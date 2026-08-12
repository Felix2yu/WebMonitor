from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy import inspect
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)

# 创建数据库引擎
engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False},
    echo=settings.DEBUG  # 在调试模式下开启SQL日志
)

# 创建SessionLocal类
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 创建Base类
Base = declarative_base()

# 依赖项：获取数据库会话
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def ensure_columns():
    """轻量级迁移：为已存在的表补充新增列（无 Alembic 时使用）"""
    inspector = inspect(engine)
    existing_columns = {col["name"] for col in inspector.get_columns("monitor_tasks")}
    additions = {
        "schedule_type": "VARCHAR(20) DEFAULT 'interval'",
        "cron_expression": "VARCHAR(100)",
    }
    with engine.begin() as conn:
        for col, ddl in additions.items():
            if col not in existing_columns:
                logger.info(f"为 monitor_tasks 表补充缺失列: {col}")
                conn.execute(text(f"ALTER TABLE monitor_tasks ADD COLUMN {col} {ddl}"))