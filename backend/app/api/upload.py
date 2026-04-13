from fastapi import APIRouter, UploadFile, File, HTTPException, status, Header
from pathlib import Path
import shutil
from datetime import datetime
from app.utils.security import verify_token

router = APIRouter(prefix="/api/upload", tags=["upload"])

# Create uploads directory if it doesn't exist
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

@router.post("/{category}")
async def upload_file(
    category: str,
    file: UploadFile = File(...),
    authorization: str = Header(None)
):
    # Verify authentication
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )

    token = authorization.replace("Bearer ", "")
    payload = verify_token(token)

    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )

    # Validate category
    if category not in ["hedgerows", "waterways", "soil"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid category. Must be hedgerows, waterways, or soil"
        )

    # Validate file type
    if not file.filename.endswith('.csv'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only CSV files are allowed"
        )

    # Create uploads directory if it doesn't exist
    UPLOAD_DIR.mkdir(exist_ok=True)

    # Create category directory if it doesn't exist
    category_dir = UPLOAD_DIR / category
    category_dir.mkdir(exist_ok=True)

    # Generate unique filename with timestamp
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    user_id = payload.get("user_id")
    filename = f"{user_id}_{timestamp}_{file.filename}"
    file_path = category_dir / filename

    # Save file
    try:
        with file_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save file: {str(e)}"
        ) from e

    return {
        "message": "File uploaded successfully",
        "filename": file.filename,
        "category": category,
        "saved_as": filename,
        "file_size": file_path.stat().st_size
    }
