import time
import logging
from app.graph.state import GraphState
from app.graph.nodes import (
    node_ingest_preprocess,
    node_extract_fields,
    node_validate_fields,
    node_assess_risk,
    node_generate_summary,
    node_check_completeness,
)

logger = logging.getLogger(__name__)

class ComplaintGraphRunner:
    """
    Executes the sequential multi-agent complaint pipeline using LangGraph StateGraph.
    Flow: Preprocess -> Extract -> Validate -> Assess Risk -> Summary -> Completeness.
    """
    def run(self, document_text: str, filename: str = "document.pdf") -> GraphState:
        start_time = time.time()
        logger.info(f"=== Starting LangGraph Execution for document: {filename} ===")

        initial_state: GraphState = {
            "raw_document": None,
            "document_text": document_text,
            "extracted_fields": {},
            "extraction_confidence": {},
            "validation_result": {},
            "risk_assessment": {},
            "complaint_summary": "",
            "completeness_result": {},
            "activity_log": [],
            "chat_history": [],
            "errors": [],
            "metadata": {"filename": filename, "started_at": time.strftime("%Y-%m-%dT%H:%M:%SZ")}
        }

        try:
            from langgraph.graph import StateGraph, END
            workflow = StateGraph(GraphState)

            workflow.add_node("preprocess", node_ingest_preprocess)
            workflow.add_node("extract", node_extract_fields)
            workflow.add_node("validate", node_validate_fields)
            workflow.add_node("assess_risk", node_assess_risk)
            workflow.add_node("summary", node_generate_summary)
            workflow.add_node("completeness", node_check_completeness)

            workflow.set_entry_point("preprocess")
            workflow.add_edge("preprocess", "extract")
            workflow.add_edge("extract", "validate")
            workflow.add_edge("validate", "assess_risk")
            workflow.add_edge("assess_risk", "summary")
            workflow.add_edge("summary", "completeness")
            workflow.add_edge("completeness", END)

            app = workflow.compile()
            final_state = app.invoke(initial_state)

        except Exception as e:
            logger.warning(f"LangGraph StateGraph engine error, running sequential pipeline: {e}")
            final_state = node_ingest_preprocess(initial_state)
            final_state = node_extract_fields(final_state)
            final_state = node_validate_fields(final_state)
            final_state = node_assess_risk(final_state)
            final_state = node_generate_summary(final_state)
            final_state = node_check_completeness(final_state)

        total_latency = int((time.time() - start_time) * 1000)
        final_state["metadata"]["total_pipeline_latency_ms"] = total_latency

        logger.info(f"=== LangGraph Execution Completed in {total_latency}ms ===")
        return final_state

graph_runner = ComplaintGraphRunner()
