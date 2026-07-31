from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.api.endpoints.complaints import router as complaints_router
from app.api.endpoints.chat import router as chat_router

app = FastAPI(
    title="QCMS API — Pharmaceutical Complaint Management System",
    description="Backend API for AI-powered Quality Assurance Complaint Intake, Risk Assessment, and LangGraph Workflow.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Middleware Setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(complaints_router, prefix="/api/v1")
app.include_router(chat_router, prefix="/api/v1")

@app.get("/")
def root():
    return {
        "title": "QCMS API",
        "status": "online",
        "environment": settings.ENVIRONMENT,
        "docs": "/docs"
    }

@app.get("/health")
def health_check():
    return {"status": "healthy", "model": settings.GROQ_MODEL}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=True)
