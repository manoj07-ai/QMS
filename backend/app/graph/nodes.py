import json
import logging
import time
from typing import Dict, Any
from app.graph.state import GraphState
from app.services.llm_service import llm_service
from app.prompts.extract_v1 import SYSTEM_PROMPT_EXTRACTION_V1
from app.prompts.risk_v1 import SYSTEM_PROMPT_RISK_V1
from app.prompts.summary_v1 import SYSTEM_PROMPT_SUMMARY_V1

logger = logging.getLogger(__name__)

def node_ingest_preprocess(state: GraphState) -> GraphState:
    start_time = time.time()
    text = state.get("document_text", "").strip()
    logger.info(f"[LangGraph Node: Preprocess] Ingested {len(text)} characters of complaint text.")
    
    state["activity_log"].append({
        "timestamp": time.strftime("%H:%M:%S"),
        "title": "Document ingested & preprocessed",
        "description": f"Parsed {len(text)} characters of plain text.",
        "type": "upload",
        "actor": "Preprocess Node"
    })
    return state

def node_extract_fields(state: GraphState) -> GraphState:
    start_time = time.time()
    text = state.get("document_text", "")
    logger.info(f"[LangGraph Node: Extraction Agent] Invoking Groq LLM...")

    prompt = f"Document Text:\n\"\"\"\n{text}\n\"\"\""
    extracted_json = llm_service.call_json_llm(SYSTEM_PROMPT_EXTRACTION_V1, prompt, temperature=0.1)

    confidence_scores = extracted_json.pop("confidence_scores", {})
    llm_meta = extracted_json.pop("_llm_meta", {})

    state["extracted_fields"] = extracted_json
    state["extraction_confidence"] = confidence_scores
    state["metadata"]["extraction_llm_meta"] = llm_meta

    latency = int((time.time() - start_time) * 1000)
    logger.info(f"[LangGraph Node: Extraction Agent] Completed in {latency}ms using model {llm_meta.get('model')}.")

    state["activity_log"].append({
        "timestamp": time.strftime("%H:%M:%S"),
        "title": "AI Extraction completed",
        "description": f"Extracted {len(extracted_json)} fields via Groq ({llm_meta.get('model')}) in {latency}ms.",
        "type": "extraction",
        "actor": "Extraction Agent"
    })
    return state

def node_validate_fields(state: GraphState) -> GraphState:
    fields = state.get("extracted_fields", {})
    required_keys = [
        "customer_name", "complaint_source", "product_name",
        "batch_number", "complaint_date", "description", "initial_severity"
    ]
    missing = [k for k in required_keys if not fields.get(k)]
    
    is_valid = len(missing) == 0
    state["validation_result"] = {
        "is_valid": is_valid,
        "errors_count": len(missing),
        "missing_fields": missing,
        "validated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ")
    }

    logger.info(f"[LangGraph Node: Validation Agent] Checked mandatory fields. Missing: {missing}")
    return state

def node_assess_risk(state: GraphState) -> GraphState:
    start_time = time.time()
    fields = state.get("extracted_fields", {})
    text = state.get("document_text", "")
    logger.info(f"[LangGraph Node: Risk Assessment Agent] Invoking Groq LLM...")

    prompt = f"Complaint Fields:\n{json.dumps(fields, indent=2)}\n\nRaw Text:\n{text}"
    risk_json = llm_service.call_json_llm(SYSTEM_PROMPT_RISK_V1, prompt, temperature=0.1)

    llm_meta = risk_json.pop("_llm_meta", {})
    state["risk_assessment"] = risk_json
    state["metadata"]["risk_llm_meta"] = llm_meta

    latency = int((time.time() - start_time) * 1000)
    logger.info(
        f"[LangGraph Node: Risk Assessment Agent] Risk level assigned: "
        f"{risk_json.get('risk_level', 'high').upper()} in {latency}ms."
    )

    state["activity_log"].append({
        "timestamp": time.strftime("%H:%M:%S"),
        "title": "AI Risk Assessment completed",
        "description": f"Assigned {risk_json.get('risk_level', 'High').upper()} risk level with {risk_json.get('confidence', 85)}% confidence.",
        "type": "risk",
        "actor": "Risk Agent"
    })
    return state

def node_generate_summary(state: GraphState) -> GraphState:
    start_time = time.time()
    fields = state.get("extracted_fields", {})
    risk = state.get("risk_assessment", {})
    logger.info(f"[LangGraph Node: Summary Agent] Invoking Groq LLM...")

    prompt = f"Complaint Fields:\n{json.dumps(fields, indent=2)}\n\nRisk Assessment:\n{json.dumps(risk, indent=2)}"
    summary_json = llm_service.call_json_llm(SYSTEM_PROMPT_SUMMARY_V1, prompt, temperature=0.2)

    summary_text = summary_json.get("summary", "")
    state["complaint_summary"] = summary_text

    latency = int((time.time() - start_time) * 1000)
    logger.info(f"[LangGraph Node: Summary Agent] Executive summary generated in {latency}ms.")
    return state

def node_check_completeness(state: GraphState) -> GraphState:
    fields = state.get("extracted_fields", {})
    required = ["customer_name", "complaint_source", "product_name", "batch_number", "complaint_date", "description", "initial_severity"]
    optional = ["expiry_date", "quantity_affected", "manufacturing_date"]

    complete_req = [f for f in required if fields.get(f)]
    missing_req = [f for f in required if not fields.get(f)]
    missing_opt = [f for f in optional if not fields.get(f)]

    pct = int((len(complete_req) / len(required)) * 100) if required else 0

    state["completeness_result"] = {
        "completion_percentage": pct,
        "required_complete": len(complete_req),
        "required_total": len(required),
        "missing_fields": missing_req,
        "recommended_fields": missing_opt,
        "is_ready_for_validation": pct == 100
    }

    logger.info(f"[LangGraph Node: Completeness Agent] Completion percentage: {pct}%")
    return state
