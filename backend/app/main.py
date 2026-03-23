from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.models import survey as _survey_models  # noqa: F401 – ensures table is registered
from app.api import auth, upload, survey

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Biodiversity Farm API")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(upload.router)
app.include_router(survey.router)

@app.get("/")
def read_root():
    return {"message": "Biodiversity Farm API"}