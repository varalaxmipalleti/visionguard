"""
Import all models here so Alembic can discover them for migrations.
"""
from src.core.database import Base
from src.features.users.models import User
from src.features.cameras.models import Camera
from src.features.analytics.models import Analytics
from src.features.alerts.models import Alert
