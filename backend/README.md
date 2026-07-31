# QCMS Backend — FastAPI + LangGraph + Groq + Supabase

Pharmaceutical Quality Assurance Customer Complaint Management System API.

## Tech Stack
- **FastAPI**: REST API Framework
- **LangGraph**: Multi-Agent State Machine Workflow
- **Groq Cloud LLM**: Llama-3.3-70b-versatile with JSON mode
- **Supabase**: PostgreSQL Database with Row Level Security (RLS)
- **PyPDF**: PDF & Document Text Parsing

## Endpoints
- `POST /api/v1/complaints/extract` — Extract complaint fields, assess risk, generate summary
- `POST /api/v1/complaints/validate` — Execute QMS Quality Gate validation rules
- `POST /api/v1/complaints/save` — Commit complaint & activity logs to Supabase
- `POST /api/v1/chat/message` — Context-aware AI chat assistant

## Quick Start

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Configure environment
cp .env.example .env

# 3. Start server
python app/main.py
# or
uvicorn app.main:app --reload --port 8000
```

Interactive API documentation available at: `http://localhost:8000/docs`
