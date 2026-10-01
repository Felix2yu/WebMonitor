# WebMonitor 项目指令

本文件为仓库级约定（AGENTS.md 标准），供各类 AI 编程助手读取。

## 包管理器（强制）

本项目前端统一使用 **pnpm 11.22.0**，不使用 npm / yarn：

- `frontend/package.json` 已声明 `"packageManager": "pnpm@11.22.0"`，锁文件为 `frontend/pnpm-lock.yaml`
- 安装依赖：`pnpm install`
- 添加 / 移除依赖：`pnpm add <pkg>` / `pnpm remove <pkg>`
- 运行脚本：`pnpm run <script>`
- **禁止使用 `npm install` / `npm ci` / `npm run` / `npx` 安装依赖或运行脚本**——锁文件是 pnpm 格式，
  npm 会生成 `package-lock.json` 并破坏 pnpm 的依赖树结构，还会让 CI 与本地构建结果不一致。

## Project Overview

WebMonitor is a web content monitoring and notification system with a React frontend + FastAPI backend architecture. It uses Selenium WebDriver for dynamic content scraping and APScheduler for background task scheduling.

## Development Commands

### Running the Application
```bash
# Backend (Terminal 1)
cd backend && python main.py

# Frontend (Terminal 2)
cd frontend && pnpm install && pnpm run dev

# Access: Frontend http://localhost:8000, Backend API http://localhost:8000, API Docs http://localhost:8000/docs
```

### Docker Deployment
```bash
docker compose up -d              # Start all services
docker compose logs -f            # View logs
docker compose up -d --build      # Rebuild after changes
```

### Frontend Build & Preview
```bash
cd frontend
pnpm install                      # 依赖用 pnpm，版本来自 package.json 的 packageManager
pnpm run build                    # Vite 生产构建，产出 build/
pnpm run preview                  # 本地预览构建产物
```

> 前端目前没有测试脚本与用例（package.json 里没有 test），别照着旧文档写 `npm test`。

### Backend Development
```bash
cd backend
pip install -r requirements.txt
python main.py                    # Runs with uvicorn, auto-creates admin user (admin/admin123)
```

## Architecture

### Data Flow
1. **Frontend** (React + Material-UI) → API calls via Axios with JWT auth
2. **API Layer** (FastAPI) → JWT authentication, Pydantic validation
3. **Services** → Business logic (monitor, email, scheduler, auth)
4. **Database** (SQLAlchemy) → SQLite (dev) / PostgreSQL (prod)
5. **Scheduler** (APScheduler BackgroundScheduler) → Runs Selenium monitoring tasks

### Key Architectural Decisions

**Async/Sync Bridge in Scheduler**: The APScheduler uses a sync BackgroundScheduler but monitor_service methods are async. `backend/app/services/scheduler.py` uses `asyncio.run()` wrapper functions to bridge this gap.

**Task Subscription System**: Users can mark their monitoring tasks as public. Other users can subscribe to public tasks with their own email configurations. See `TaskSubscription` model in `backend/app/db/models.py`.

**Authentication Flow**: JWT tokens stored in localStorage, Axios interceptor adds Authorization header. See `frontend/src/contexts/AuthContext.js` for token management.

### Backend Structure (`backend/`)
- `main.py` - FastAPI app with lifespan management (creates admin user, starts scheduler)
- `app/api/routes.py` - Main CRUD endpoints for tasks, logs, email configs, subscriptions
- `app/api/auth.py` - Login, register, current user endpoints
- `app/services/monitor_service.py` - Selenium WebDriver scraping with XPath
- `app/services/scheduler.py` - APScheduler job management (job_id: `monitor_task_{task_id}`)
- `app/services/email_service.py` - SMTP notifications with SSL/TLS
- `app/db/models.py` - SQLAlchemy models (User, MonitorTask, MonitorLog, EmailConfig, BlacklistDomain, TaskSubscription)
- `app/core/config.py` - Pydantic settings with .env support

### Frontend Structure (`frontend/`)
- `src/App.js` - React Router setup, Material-UI theme (Chinese serif typography)
- `src/contexts/AuthContext.js` - JWT token storage, Axios auth header config
- `src/components/ProtectedRoute.js` - Route guards with admin-only support
- `src/pages/` - All page components (Dashboard, MonitorTasks, MonitorLogs, EmailConfig, etc.)

### Route Protection
- **Public**: `/`, `/login`, `/register`
- **Protected**: `/dashboard`, `/tasks`, `/logs`, `/email-config`, `/public-tasks`, `/my-subscriptions`
- **Admin-only**: `/user-management`, `/blacklist-management`

## Configuration

Key environment variables (set in `.env` or docker-compose):
- `DATABASE_URL` - Database connection (default: `sqlite:///./webmonitor.db`)
- `SECRET_KEY` - JWT signing key
- `SMTP_SERVER`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD` - Email settings
- `SELENIUM_HEADLESS` - Headless Chrome mode (default: True)
- `DEFAULT_CHECK_INTERVAL` - Monitoring interval in seconds (default: 300)

Default admin credentials: `admin` / `admin123`

## Troubleshooting

**ChromeDriver Issues**: Ensure ChromeDriver version matches Chrome browser. For headless mode: `SELENIUM_HEADLESS=True`

**Scheduler Not Running**: Check backend logs for scheduler startup. Active tasks should be logged every 5 minutes.

**API Connection**: Test with `curl http://localhost:8000/health`

**Docker Issues**:
```bash
docker compose ps                                    # Check status
docker compose logs -f                       # View backend logs
docker compose exec webmonitor curl http://localhost:8000/health  # Health check
```
