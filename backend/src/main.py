from contextlib import asynccontextmanager
from fastapi import FastAPI
# pyrefly: ignore [missing-import]
from fastapi.middleware.cors import CORSMiddleware
# pyrefly: ignore [missing-import]
from sqlalchemy import text
from src.core.config import settings
from src.core.database import engine, Base
from src.core.exceptions import setup_exception_handlers
from src.features.auth.router import router as auth_router
from src.features.users.router import router as users_router
from src.features.cameras.router import router as cameras_router
from src.features.videos.router import router as videos_router
from src.features.analytics.router import router as analytics_router
from src.features.alerts.router import router as alerts_router
from src.features.media.router import router as media_router
from src.features.settings.router import router as settings_router
# pyrefly: ignore [missing-import]
from sqlalchemy import select
from src.core.database import AsyncSessionLocal
from src.features.users.models import User as UserModel
from src.core.security import get_password_hash, verify_password

async def seed_default_admin():
    async with AsyncSessionLocal() as db:
        try:
            result = await db.execute(select(UserModel).where(UserModel.email == "varalaxmipalleti@gmail.com"))
            admin_user = result.scalar_one_or_none()
            if not admin_user:
                print("Seeding default administrative profile: varalaxmipalleti@gmail.com")
                new_admin = UserModel(
                    email="varalaxmipalleti@gmail.com",
                    full_name="Varalaxmi Palleti",
                    hashed_password=get_password_hash("varalaxmi@22"),
                    role="admin",
                    is_active=True,
                    is_verified=True,
                )
                db.add(new_admin)
                await db.commit()
                print("Default administrator profile seeded successfully.")
            else:
                needs_commit = False
                if admin_user.full_name != "Varalaxmi Palleti":
                    admin_user.full_name = "Varalaxmi Palleti"
                    needs_commit = True
                if not admin_user.is_verified or not admin_user.is_active or admin_user.role != "admin":
                    admin_user.is_verified = True
                    admin_user.is_active = True
                    admin_user.role = "admin"
                    needs_commit = True
                if not verify_password("varalaxmi@22", admin_user.hashed_password):
                    admin_user.hashed_password = get_password_hash("varalaxmi@22")
                    needs_commit = True
                if needs_commit:
                    await db.commit()
                    print("Updated existing administrator account credentials and verified clearance.")
        except Exception as e:
            print(f"Admin seeding note: {e}")

@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        try:
            await conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name VARCHAR;"))
            await conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;"))
            await conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS otp_code VARCHAR;"))
            await conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS otp_expires_at TIMESTAMPTZ;"))
            await conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token VARCHAR;"))
            await conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_expires_at TIMESTAMPTZ;"))
            # AI engine settings columns (per-user preferences)
            await conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS settings_confidence FLOAT DEFAULT 0.30;"))
            await conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS settings_nms_iou FLOAT DEFAULT 0.40;"))
            await conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS settings_gpu_enabled BOOLEAN DEFAULT TRUE;"))
            await conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS settings_color_space VARCHAR DEFAULT 'YCbCr + HSV (Dual Consensus)';"))
        except Exception as e:
            print(f"Migration note: {e}")
    await seed_default_admin()
    yield

def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.PROJECT_NAME,
        version=settings.VERSION,
        openapi_url=f"{settings.API_V1_STR}/openapi.json",
        lifespan=lifespan
    )


    # Set all CORS enabled origins
    if settings.BACKEND_CORS_ORIGINS:
        app.add_middleware(
            CORSMiddleware,
            allow_origins=[str(origin) for origin in settings.BACKEND_CORS_ORIGINS],
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )

    # Setup exception handlers
    setup_exception_handlers(app)

    # Include routers
    app.include_router(auth_router, prefix=f"{settings.API_V1_STR}/auth", tags=["auth"])
    app.include_router(users_router, prefix=f"{settings.API_V1_STR}/users", tags=["users"])
    app.include_router(cameras_router, prefix=f"{settings.API_V1_STR}/cameras", tags=["cameras"])
    app.include_router(videos_router, prefix=f"{settings.API_V1_STR}/videos", tags=["videos"])
    app.include_router(analytics_router, prefix=f"{settings.API_V1_STR}/analytics", tags=["analytics"])
    app.include_router(alerts_router, prefix=f"{settings.API_V1_STR}/alerts", tags=["alerts"])
    app.include_router(media_router, prefix=f"{settings.API_V1_STR}/media", tags=["media"])
    app.include_router(settings_router, prefix=f"{settings.API_V1_STR}/settings", tags=["settings"])

    @app.get("/")
    async def root():
        return {"message": "Welcome to VisionGuard AI API"}

    return app

app = create_app()
