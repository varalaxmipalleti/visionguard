from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from src.features.users.models import User
from src.features.auth.dependencies import get_current_active_user
import shutil
import os

router = APIRouter()

UPLOAD_DIR = "uploads/videos"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload")
async def upload_video(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user)
):
    """
    Upload a video file for analysis.
    """
    if not file.content_type.startswith("video/"):
        raise HTTPException(status_code=400, detail="File provided is not a video.")
        
    file_location = f"{UPLOAD_DIR}/{file.filename}"
    with open(file_location, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    return {"info": f"file '{file.filename}' saved at '{file_location}'"}
