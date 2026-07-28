from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import delete
from typing import List
from src.features.cameras.models import Camera
from src.features.cameras.schemas import CameraCreate, CameraUpdate

async def get_cameras(db: AsyncSession, user_id: int, skip: int = 0, limit: int = 100) -> List[Camera]:
    result = await db.execute(
        select(Camera).where(Camera.user_id == user_id).offset(skip).limit(limit)
    )
    return result.scalars().all()

async def get_camera(db: AsyncSession, camera_id: int, user_id: int) -> Camera | None:
    result = await db.execute(
        select(Camera).where(Camera.id == camera_id, Camera.user_id == user_id)
    )
    return result.scalars().first()

async def create_camera(db: AsyncSession, camera_in: CameraCreate, user_id: int) -> Camera:
    db_camera = Camera(**camera_in.model_dump(), user_id=user_id)
    db.add(db_camera)
    await db.commit()
    await db.refresh(db_camera)
    return db_camera

async def update_camera(db: AsyncSession, db_camera: Camera, camera_in: CameraUpdate) -> Camera:
    update_data = camera_in.model_dump(exclude_unset=True)
    for field in update_data:
        setattr(db_camera, field, update_data[field])
    await db.commit()
    await db.refresh(db_camera)
    return db_camera

async def delete_camera(db: AsyncSession, camera_id: int, user_id: int) -> bool:
    result = await db.execute(
        delete(Camera).where(Camera.id == camera_id, Camera.user_id == user_id)
    )
    await db.commit()
    return result.rowcount > 0
