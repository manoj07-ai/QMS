from typing import TypedDict, Optional, List, Dict, Any

class GraphState(TypedDict):
    raw_document: Optional[bytes]
    document_text: str
    extracted_fields: Dict[str, Any]
    extraction_confidence: Dict[str, int]
    validation_result: Dict[str, Any]
    risk_assessment: Dict[str, Any]
    complaint_summary: str
    completeness_result: Dict[str, Any]
    activity_log: List[Dict[str, Any]]
    chat_history: List[Dict[str, Any]]
    errors: List[Dict[str, Any]]
    metadata: Dict[str, Any]
