from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

class AiFieldMetaSchema(BaseModel):
    isAiFilled: bool = True
    confidence: int = Field(default=90, ge=0, le=100)
    isDirty: bool = False
    isConfirmed: bool = False

class ComplaintFieldSchema(BaseModel):
    value: str
    meta: AiFieldMetaSchema

class TextExtractRequest(BaseModel):
    text: str = Field(..., min_length=5, description="Raw text of customer complaint or email")
    source_hint: Optional[str] = "email"

class ExtractionPipelineResponse(BaseModel):
    success: bool
    fields: Dict[str, ComplaintFieldSchema]
    risk_assessment: Dict[str, Any]
    summary: str
    completeness: Dict[str, Any]
    steps: List[Dict[str, Any]]
    metadata: Dict[str, Any] = {}

class ValidationGateRequest(BaseModel):
    fields: Dict[str, Any]

class ValidationItemSchema(BaseModel):
    field: str
    label: str
    message: str
    type: str  # error | warning | info

class ValidationGateResponse(BaseModel):
    is_valid: bool
    errors_count: int
    warnings_count: int
    validated_at: str
    items: List[ValidationItemSchema]

class ComplaintSaveRequest(BaseModel):
    complaint_number: Optional[str] = None
    lifecycle_status: str = "pending_triage"
    form_state: str = "validated"
    fields: Dict[str, Any]
    risk_assessment: Dict[str, Any] = {}
    completeness: Dict[str, Any] = {}

class ComplaintSaveResponse(BaseModel):
    success: bool
    id: str
    complaint_number: str
    lifecycle_status: str
    saved_at: str
    message: str
