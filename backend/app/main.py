from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.api import auth

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI()

# CORS setup - must be before routes
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)

@app.get("/")
def read_root():
    return {"message": "Hello from FastAPI"}

@app.get("/api/health")
def health_check():
    return {"status": "healthy"}