import datetime
import json
import logging
from fastapi import APIRouter
from app.schemas.chat import ChatQueryRequest, ChatQueryResponse
from app.services.llm_service import llm_service
from app.prompts.edit_v1 import SYSTEM_PROMPT_INTENT_AND_EDIT_V1
from app.graph.nodes import node_assess_risk, node_generate_summary, node_check_completeness

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/chat", tags=["Chat"])

FIELD_KEY_MAP = {
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

@router.post("/message", response_model=ChatQueryResponse)
async def chat_message(body: ChatQueryRequest):
    """
    Dual-Mode AI Chat Assistant:
    Mode 1: Question Answering ("mode": "qa")
    Mode 2: Complaint Editing Agent ("mode": "edit") with live Groq LLM & LangGraph re-evaluation.
    """
    logger.info(f"Processing AI Chat Query: \"{body.query}\"")

    context_prompt = f"""
    ACTIVE COMPLAINT FIELDS:
    {json.dumps(body.complaint_context, indent=2)}

    ACTIVE RISK ASSESSMENT:
    {json.dumps(body.risk_context, indent=2)}

    USER QUERY / EDIT INSTRUCTION:
    "{body.query}"
    """

    try:
        # Call Groq LLM to detect intent and parse edits or QA response
        llm_response = llm_service.call_json_llm(
            system_prompt=SYSTEM_PROMPT_INTENT_AND_EDIT_V1,
            user_prompt=context_prompt,
            temperature=0.1
        )
    except Exception as e:
        logger.error(f"Groq LLM intent processing failed: {e}")
        return ChatQueryResponse(
            id=f"msg_{datetime.datetime.now().strftime('%H%M%S')}",
            role="assistant",
            content=f"Error executing AI query: {str(e)}",
            timestamp=datetime.datetime.now().isoformat(),
            mode="qa"
        )

    mode = llm_response.get("mode", "qa")

    if mode == "edit" and "changes" in llm_response and llm_response["changes"]:
        changes = llm_response["changes"]
        confirmation = llm_response.get(
            "confirmation",
            f"I have updated the requested fields ({', '.join(changes.keys())}). All other complaint information has been preserved."
        )

        # Build merged backend fields
        merged_backend_fields = dict(body.complaint_context)
        fe_changes = {}
        for backend_key, new_val in changes.items():
            merged_backend_fields[backend_key] = new_val
            fe_key = FIELD_KEY_MAP.get(backend_key, backend_key)
            fe_changes[fe_key] = str(new_val)

        # Re-evaluate LangGraph state for Risk, Summary, and Completeness
        temp_state = {
            "document_text": body.complaint_context.get("description", ""),
            "extracted_fields": merged_backend_fields,
            "risk_assessment": {},
            "complaint_summary": "",
            "completeness_result": {},
            "activity_log": [],
            "metadata": {}
        }

        try:
            temp_state = node_assess_risk(temp_state)
            temp_state = node_generate_summary(temp_state)
            temp_state = node_check_completeness(temp_state)
        except Exception as err:
            logger.warning(f"Re-evaluating LangGraph nodes after edit encountered error: {err}")

        first_changed_key = list(changes.keys())[0] if changes else "field"
        formatted_field_label = first_changed_key.replace("_", " ").title()

        activity_item = {
          "title": f"AI updated {formatted_field_label}",
          "description": f"Updated {formatted_field_label} to \"{list(changes.values())[0]}\" via AI Chat command.",
          "type": "edit",
          "actor": "AI Assistant"
        }

        logger.info(f"✓ AI Editing Agent applied patch: {changes}")

        return ChatQueryResponse(
            id=f"msg_{datetime.datetime.now().strftime('%H%M%S')}",
            role="assistant",
            content=confirmation,
            timestamp=datetime.datetime.now().isoformat(),
            mode="edit",
            changes=changes,
            updated_frontend_fields=fe_changes,
            recalculated_risk=temp_state.get("risk_assessment"),
            recalculated_summary=temp_state.get("complaint_summary"),
            recalculated_completeness=temp_state.get("completeness_result"),
            activity_item=activity_item
        )

    # QA Mode
    reply_text = llm_response.get("reply", "I reviewed the complaint details. How else can I assist you?")
    return ChatQueryResponse(
        id=f"msg_{datetime.datetime.now().strftime('%H%M%S')}",
        role="assistant",
        content=reply_text,
        timestamp=datetime.datetime.now().isoformat(),
        mode="qa"
    )
