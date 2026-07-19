"""
WebMonitor 后端主启动文件
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from typing import List

from app.core.config import settings
from app.db.database import engine, SessionLocal
from app.db.models import Base, User
from app.api.routes import router as api_router
from app.api.auth import router as auth_router
from app.services.scheduler import monitor_scheduler
from app.services.auth_service import get_password_hash
import os

# 数据库迁移
try:
    import sqlite3 as _sqlite3
    _db_url = str(engine.url)
    if _db_url.startswith("sqlite:///"):
        _db_file = _db_url.replace("sqlite:///", "")
        if os.path.exists(_db_file):
            _conn = _sqlite3.connect(_db_file)
            _cursor = _conn.cursor()
            _cursor.execute("PRAGMA table_info(email_configs)")
            _cols = [r[1] for r in _cursor.fetchall()]
            if "apprise_urls" not in _cols:
                _cursor.execute("ALTER TABLE email_configs ADD COLUMN apprise_urls TEXT")
                _conn.commit()
                print("✅ 数据库迁移: 添加 apprise_urls 字段")
            # 允许 SMTP 字段为 NULL（apprise 模式不需要）
            for _col in ["smtp_server", "smtp_user", "smtp_password", "receiver_email"]:
                _cursor.execute(f"PRAGMA table_info(email_configs)")
                _col_info = [r for r in _cursor.fetchall() if r[1] == _col]
                if _col_info and _col_info[0][3]:  # notnull = 1 means NOT NULL
                    _cursor.execute(f"CREATE TABLE email_configs_new AS SELECT * FROM email_configs")
                    _cursor.execute("DROP TABLE email_configs")
                    _cursor.execute("""CREATE TABLE email_configs (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        name VARCHAR(100) NOT NULL,
                        smtp_server VARCHAR(200),
                        smtp_port INTEGER DEFAULT 465,
                        smtp_user VARCHAR(200),
                        smtp_password VARCHAR(200),
                        receiver_email VARCHAR(200),
                        is_ssl BOOLEAN DEFAULT 1,
                        apprise_urls TEXT,
                        user_id INTEGER NOT NULL REFERENCES users(id),
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )""")
                    _cursor.execute("INSERT INTO email_configs SELECT * FROM email_configs_new")
                    _cursor.execute("DROP TABLE email_configs_new")
                    _conn.commit()
                    print("✅ 数据库迁移: SMTP 字段改为可空")
                    break
            _conn.close()
except Exception as _e:
    print(f"⚠️ 数据库迁移跳过: {_e}")

# 创建数据库表
Base.metadata.create_all(bind=engine)

# 自动创建管理员用户
def create_default_admin():
    """如果不存在管理员用户，则创建默认管理员"""
    db = SessionLocal()
    try:
        # 检查是否已存在管理员用户
        admin_user = db.query(User).filter(User.is_admin == True).first()
        if admin_user:
            print(f"✅ 管理员用户已存在: {admin_user.username}")
            return

        # 创建默认管理员用户
        default_password = settings.ADMIN_PASSWORD

        # bcrypt限制密码最长72字节，手动截断以防万一
        if len(default_password) > 72:
            default_password = default_password[:72]

        hashed_password = get_password_hash(default_password)

        admin_user = User(
            username=settings.ADMIN_USERNAME,
            email=settings.ADMIN_EMAIL,
            hashed_password=hashed_password,
            full_name="系统管理员",
            is_active=True,
            is_admin=True
        )

        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)

        print(f"✅ 已创建默认管理员: {settings.ADMIN_USERNAME}")

    except Exception as e:
        print(f"❌ 创建管理员用户失败: {e}")
        db.rollback()
    finally:
        db.close()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期管理"""
    # 创建默认管理员用户
    create_default_admin()

    # 启动监控调度器
    monitor_scheduler.start()
    print(f"🚀 {settings.APP_NAME} v{settings.APP_VERSION} 启动成功")
    print("📊 监控调度器已启动")
    yield
    # 停止监控调度器
    monitor_scheduler.stop()
    print("🛑 WebMonitor API已关闭，监控调度器已停止")

# 创建FastAPI应用
app = FastAPI(
    title=settings.APP_NAME,
    description="网页内容监控通知系统 API",
    version=settings.APP_VERSION,
    lifespan=lifespan,
    debug=settings.DEBUG
)

# CORS中间件配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 挂载静态文件目录（如果存在）
if os.path.exists("static"):
    app.mount("/static", StaticFiles(directory="static"), name="static")

# 注册API路由
app.include_router(api_router, prefix="/api")
app.include_router(auth_router, prefix="/api")

# Serve frontend build output
FRONTEND_BUILD_DIR = os.path.join(os.path.dirname(__file__), "frontend-build")
if os.path.exists(FRONTEND_BUILD_DIR):
    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        """SPA catch-all: serve static files or index.html"""
        file_path = os.path.join(FRONTEND_BUILD_DIR, full_path)
        if full_path and os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(FRONTEND_BUILD_DIR, "index.html"))

@app.get("/")
async def root():
    """根路径"""
    return {
        "message": f"欢迎使用 {settings.APP_NAME}",
        "version": settings.APP_VERSION,
        "docs": "/docs",
        "status": "running"
    }

@app.get("/health")
async def health_check():
    """健康检查"""
    return {
        "status": "healthy",
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
        log_level=settings.LOG_LEVEL.lower()
    )