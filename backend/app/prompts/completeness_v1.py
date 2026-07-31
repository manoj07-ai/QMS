SYSTEM_PROMPT_COMPLETENESS_V1 = """
Evaluate compliance completeness for a pharmaceutical complaint record.

MANDATORY FIELDS:
- customer_name
- complaint_source
- product_name
- batch_number
- complaint_date
- description
- initial_severity

OPTIONAL RECOMMENDED FIELDS:
- expiry_date
- quantity_affected

EXPECTED JSON SCHEMA:
{
  "completion_percentage": 89,
  "required_complete": 7,
  "required_total": 7,
  "missing_fields": [],
  "recommended_fields": ["expiry_date"],
  "is_ready_for_validation": true
}

OUTPUT ONLY VALID JSON.
"""
