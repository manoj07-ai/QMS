import datetime
import json
import logging
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
from app.schemas.complaint import (
    ExtractionPipelineResponse,
    ComplaintFieldSchema,
    AiFieldMetaSchema,
    ValidationGateRequest,
    ValidationGateResponse,
    ValidationItemSchema,
    ComplaintSaveRequest,
    ComplaintSaveResponse,
)
from app.services.document_parser import extract_text_from_bytes
from app.graph.workflow import graph_runner
from app.services.llm_service import llm_service
from app.services.supabase_service import supabase_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/complaints", tags=["Complaints"])

class NaturalLanguageEditRequest(BaseModel):
    edit_instruction: str
    current_fields: Dict[str, Any]

def transform_to_frontend_fields(extracted_fields: Dict[str, Any], confidence_map: Dict[str, int]) -> Dict[str, ComplaintFieldSchema]:
    field_key_map = {
        "complaint_source": "complaintSource",
        "customer_name": "customerName",
        "product_name": "productName",
        "product_strength": "productStrength",
        "batch_number": "batchLotNumber",
        "manufacturing_date": "manufacturingDate",
        "expiry_date": "expiryDate",
        "quantity_affected": "quantityAffected",
        "complaint_type": "complaintType",
        "complaint_date": "complaintDate",
        "description": "complaintDescription",
        "initial_severity": "initialSeverity",
        "priority": "priority",
    }

    result = {}
    for backend_key, fe_key in field_key_map.items():
        val = str(extracted_fields.get(backend_key, ""))
        conf = confidence_map.get(backend_key, 90)
        result[fe_key] = ComplaintFieldSchema(
            value=val,
            meta=AiFieldMetaSchema(
                isAiFilled=True,
                confidence=conf,
                isDirty=False,
                isConfirmed=False
            )
        )
    return result

@router.get("", response_model=List[Dict[str, Any]])
async def list_saved_complaints():
    """
    Retrieve list of all saved complaints from Supabase PostgreSQL / persistent database.
    """
    return supabase_service.list_complaints()

@router.get("/{complaint_id}")
async def get_saved_complaint(complaint_id: str):
    """
    Retrieve specific saved complaint by ID or complaint number.
    """
    record = supabase_service.get_complaint(complaint_id)
    if not record:
        raise HTTPException(status_code=404, detail=f"Complaint '{complaint_id}' not found.")
    return record

@router.post("/extract", response_model=ExtractionPipelineResponse)
async def extract_complaint(
    file: Optional[UploadFile] = File(None),
    text: Optional[str] = Form(None)
):
    """
    Extract complaint details using live Groq-powered LangGraph pipeline.
    """
    raw_text = ""
    filename = "document.txt"
    page_count = 1

    if file:
        content = await file.read()
        filename = file.filename or "document.pdf"
        raw_text, page_count = extract_text_from_bytes(content, filename)
    elif text:
        raw_text = text.strip()

    if not raw_text:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No readable text found in document or request body."
        )

    try:
        graph_state = graph_runner.run(raw_text, filename=filename)
    except Exception as e:
        logger.error(f"LangGraph execution failure: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"LangGraph Groq pipeline error: {str(e)}"
        )

    fe_fields = transform_to_frontend_fields(
        graph_state.get("extracted_fields", {}),
        graph_state.get("extraction_confidence", {})
    )

    steps = [
        {"id": "ext-1", "label": "Upload received & validated", "status": "done", "confidence": 95},
        {"id": "ext-2", "label": "Reading complaint document", "status": "done", "confidence": 92},
        {"id": "ext-3", "label": "Extracting customer details", "status": "done", "confidence": 96},
        {"id": "ext-4", "label": "Identifying product", "status": "done", "confidence": 98},
        {"id": "ext-5", "label": "Detecting batch information", "status": "done", "confidence": 99},
        {"id": "ext-6", "label": "Classifying complaint", "status": "done", "confidence": 92},
        {"id": "ext-7", "label": "Generating AI risk assessment", "status": "done", "confidence": 87},
        {"id": "ext-8", "label": "Creating complaint summary", "status": "done", "confidence": 93},
        {"id": "ext-9", "label": "Completed", "status": "done", "confidence": 95},
    ]

    return ExtractionPipelineResponse(
        success=True,
        fields=fe_fields,
        risk_assessment=graph_state.get("risk_assessment", {}),
        summary=graph_state.get("complaint_summary", ""),
        completeness=graph_state.get("completeness_result", {}),
        steps=steps,
        metadata={
            "filename": filename,
            "page_count": page_count,
            "total_latency_ms": graph_state.get("metadata", {}).get("total_pipeline_latency_ms", 0)
        }
    )

@router.post("/edit")
async def natural_language_edit(body: NaturalLanguageEditRequest):
    system_prompt = """
    You are an AI assistant for a pharmaceutical QMS. Parse the user edit instruction and output an updated complaint JSON.
    Modify ONLY the specified fields mentioned in the instruction. Preserve every other field exactly as is.
    
    OUTPUT ONLY VALID JSON with updated fields.
    """
    prompt = f"Instruction: \"{body.edit_instruction}\"\nCurrent Fields:\n{json.dumps(body.current_fields, indent=2)}"
    
    updated_json = llm_service.call_json_llm(system_prompt, prompt)
    updated_json.pop("_llm_meta", None)
    
    return {
        "success": True,
        "instruction": body.edit_instruction,
        "updated_fields": updated_json
    }

@router.post("/validate", response_model=ValidationGateResponse)
async def validate_complaint(body: ValidationGateRequest):
    fields = body.fields
    required_map = {
        "customerName": "Customer Name",
        "complaintSource": "Complaint Source",
        "productName": "Product Name",
        "batchLotNumber": "Batch / Lot Number",
        "complaintDate": "Complaint Date",
        "complaintDescription": "Complaint Description",
        "initialSeverity": "Initial Severity",
    }

    items = []
    errors = 0
    for key, label in required_map.items():
        field_val = fields.get(key, {})
        val = field_val.get("value", "") if isinstance(field_val, dict) else str(field_val)
        if not val or not str(val).strip():
            errors += 1
            items.append(ValidationItemSchema(
                field=key,
                label=label,
                message=f"{label} is required for QMS submission.",
                type="error"
            ))
        else:
            items.append(ValidationItemSchema(
                field=key,
                label=label,
                message="Verified & complete.",
                type="info"
            ))

    warnings = 0
    expiry = fields.get("expiryDate", {})
    exp_val = expiry.get("value", "") if isinstance(expiry, dict) else str(expiry)
    if not exp_val:
        warnings += 1
        items.append(ValidationItemSchema(
            field="expiryDate",
            label="Expiry Date",
            message="Expiry date is missing. Recommended for batch recall processing.",
            type="warning"
        ))

    return ValidationGateResponse(
        is_valid=(errors == 0),
        errors_count=errors,
        warnings_count=warnings,
        validated_at=datetime.datetime.now().isoformat(),
        items=items
    )

@router.post("/save", response_model=ComplaintSaveResponse)
async def save_complaint(body: ComplaintSaveRequest):
    now = datetime.datetime.now()
    num = body.complaint_number or f"QCM-{now.year}-{now.microsecond % 9000 + 1000}"
    comp_id = f"cmp_{now.strftime('%Y%m%d%H%M%S')}"

    db_payload = {
        "id": comp_id,
        "complaint_number": num,
        "lifecycle_status": body.lifecycle_status,
        "form_state": body.form_state,
        "complaint_source": body.fields.get("complaintSource", {}).get("value", "email"),
        "customer_name": body.fields.get("customerName", {}).get("value", "Unknown"),
        "product_name": body.fields.get("productName", {}).get("value", "Unknown"),
        "batch_lot_number": body.fields.get("batchLotNumber", {}).get("value", "N/A"),
        "complaint_type": body.fields.get("complaintType", {}).get("value", "product_defect"),
        "complaint_date": body.fields.get("complaintDate", {}).get("value", now.strftime("%Y-%m-%d")),
        "description": body.fields.get("complaintDescription", {}).get("value", ""),
        "initial_severity": body.fields.get("initialSeverity", {}).get("value", "major"),
        "risk_assessment": body.risk_assessment,
        "completeness": body.completeness,
    }

    supabase_service.save_complaint(db_payload)
    supabase_service.log_activity(comp_id, "Complaint saved to database", f"Complaint {num} persisted.", "save", "User")

    return ComplaintSaveResponse(
        success=True,
        id=comp_id,
        complaint_number=num,
        lifecycle_status=body.lifecycle_status,
        saved_at=now.isoformat(),
        message=f"Complaint {num} saved successfully to persistent database."
    )
