from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class ChatMessageSchema(BaseModel):
    id: str
    role: str
    content: str
    timestamp: str

class ChatQueryRequest(BaseModel):
    query: str
    complaint_context: Dict[str, Any] = Field(default_factory=dict)
    risk_context: Dict[str, Any] = Field(default_factory=dict)
    chat_history: List[ChatMessageSchema] = Field(default_factory=list)

class ChatQueryResponse(BaseModel):
    id: str
    role: str = "assistant"
    content: str
    timestamp: str
    streaming: bool = False
    mode: str = "qa"  # "qa" or "edit"
    changes: Optional[Dict[str, Any]] = None
    updated_frontend_fields: Optional[Dict[str, Any]] = None
    recalculated_risk: Optional[Dict[str, Any]] = None
    recalculated_summary: Optional[str] = None
    recalculated_completeness: Optional[Dict[str, Any]] = None
    activity_item: Optional[Dict[str, Any]] = None
