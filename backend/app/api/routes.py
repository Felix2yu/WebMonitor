"""
API路由模块
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.db.database import get_db
from app.db.crud import create_monitor_task, get_monitor_tasks, get_monitor_task, update_monitor_task, delete_monitor_task, get_monitor_logs, get_latest_monitor_logs, create_email_config, get_email_configs, get_email_config, update_email_config, delete_email_config, get_user_monitor_tasks, get_user_email_configs, get_user_active_email_config, validate_email_config_ownership, create_blacklist_domain, get_blacklist_domains, get_blacklist_domain, update_blacklist_domain, delete_blacklist_domain, is_url_allowed_for_user, is_url_in_blacklist
from app.schemas.schemas import MonitorTaskCreate, MonitorTaskUpdate, MonitorTaskResponse, MonitorLogResponse, EmailConfigCreate, EmailConfigResponse, EmailConfigUpdate, EmailConfigSimpleResponse, BlacklistDomainCreate, BlacklistDomainUpdate, BlacklistDomainResponse
from app.services import EmailService
import logging
logger = logging.getLogger(__name__)
from app.services.monitor_service import MonitorService
from app.services.auth_service import get_current_active_user
from app.db.models import User

router = APIRouter()

@router.post("/monitor-tasks", response_model=MonitorTaskResponse)
async def create_task(task: MonitorTaskCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    """创建监控任务"""
    # 检查用户是否可以监控指定URL（黑名单验证）
    if not is_url_allowed_for_user(db=db, url=task.url, is_admin=current_user.is_admin):
        raise HTTPException(status_code=403, detail="该域名在黑名单中，普通用户无法监控此网站")

    # 验证邮箱配置是否属于当前用户
    if not validate_email_config_ownership(db, task.email_config_id, current_user.id):
        raise HTTPException(status_code=400, detail="邮箱配置不存在或不属于当前用户")

    return create_monitor_task(db=db, task=task, owner_id=current_user.id)

@router.get("/monitor-tasks", response_model=List[MonitorTaskResponse])
async def read_tasks(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    """获取当前用户的监控任务列表"""
    return get_user_monitor_tasks(db=db, user_id=current_user.id, skip=skip, limit=limit)

@router.get("/monitor-tasks/{task_id}", response_model=MonitorTaskResponse)
async def read_task(task_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    """获取单个监控任务"""
    task = get_monitor_task(db=db, task_id=task_id)
    if task is None:
        raise HTTPException(status_code=404, detail="监控任务不存在")
    if task.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="无权访问此任务")
    return task

@router.put("/monitor-tasks/{task_id}", response_model=MonitorTaskResponse)
async def update_task(task_id: int, task: MonitorTaskUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    """更新监控任务"""
    # 首先检查任务是否存在且属于当前用户
    existing_task = get_monitor_task(db=db, task_id=task_id)
    if existing_task is None:
        raise HTTPException(status_code=404, detail="监控任务不存在")
    if existing_task.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="无权访问此任务")

    # 如果更新了URL，需要验证黑名单
    if task.url and task.url != existing_task.url:
        if not is_url_allowed_for_user(db=db, url=task.url, is_admin=current_user.is_admin):
            raise HTTPException(status_code=403, detail="该域名在黑名单中，普通用户无法监控此网站")

    # 验证邮箱配置是否属于当前用户
    if task.email_config_id is not None and not validate_email_config_ownership(db, task.email_config_id, current_user.id):
        raise HTTPException(status_code=400, detail="邮箱配置不存在或不属于当前用户")

    updated_task = update_monitor_task(db=db, task_id=task_id, task=task)
    return updated_task

@router.delete("/monitor-tasks/{task_id}")
async def delete_task(task_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    """删除监控任务"""
    # 首先检查任务是否存在且属于当前用户
    existing_task = get_monitor_task(db=db, task_id=task_id)
    if existing_task is None:
        raise HTTPException(status_code=404, detail="监控任务不存在")
    if existing_task.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="无权访问此任务")

    success = delete_monitor_task(db=db, task_id=task_id)
    return {"message": "监控任务删除成功"}

@router.get("/monitor-tasks/{task_id}/logs", response_model=List[MonitorLogResponse])
async def read_task_logs(task_id: int, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """获取监控任务日志"""
    return get_monitor_logs(db=db, task_id=task_id, skip=skip, limit=limit)

@router.get("/monitor-logs/latest", response_model=List[MonitorLogResponse])
async def read_latest_logs(limit: int = 10, db: Session = Depends(get_db)):
    """获取最新的监控日志记录"""
    return get_latest_monitor_logs(db=db, limit=limit)

@router.post("/monitor-tasks/{task_id}/test")
async def test_monitor_task(task_id: int, db: Session = Depends(get_db)):
    """测试监控任务"""
    task = get_monitor_task(db=db, task_id=task_id)
    if task is None:
        raise HTTPException(status_code=404, detail="监控任务不存在")

    # 实际执行监控测试
    monitor_service = MonitorService()
    result = await monitor_service.test_task(task_id)

    if not result.get("success"):
        raise HTTPException(status_code=500, detail=result.get("error", "测试失败"))

    # 测试成功后发送一条测试通知，验证通知链路
    from datetime import datetime
    email_service = EmailService()
    try:
        email_service.send_change_notification(
            task_name=task.name,
            url=task.url,
            title=result.get("title") or "测试",
            old_content="测试前内容",
            new_content=result.get("content") or "无内容",
            check_time=datetime.now(),
            email_config_id=task.email_config_id,
            user_id=task.owner_id,
        )
    except Exception as e:
        logger.error(f"测试通知发送失败: {e}")

    return {
        "message": "监控任务测试完成，测试通知已发送",
        "status": "success",
        "content": result.get("content"),
        "title": result.get("title"),
        "url": result.get("url")
    }

@router.post("/test-email")
async def test_email_connection():
    """测试邮件连接"""
    email_service = EmailService()
    result = email_service.test_email_connection()
    return result

# 邮件配置相关API
@router.post("/notification-configs", response_model=EmailConfigResponse)
async def create_email_config_route(config: EmailConfigCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    """创建邮件配置"""
    return create_email_config(db=db, config=config, user_id=current_user.id)

@router.get("/notification-configs", response_model=List[EmailConfigResponse])
async def read_email_configs(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    """获取当前用户的邮件配置列表"""
    return get_user_email_configs(db=db, user_id=current_user.id, skip=skip, limit=limit)

@router.get("/notification-configs/simple-list", response_model=List[EmailConfigSimpleResponse])
async def get_simple_email_config_list(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """获取当前用户的邮件配置简单列表（用于任务选择）"""
    configs = get_user_email_configs(db=db, user_id=current_user.id, skip=skip, limit=limit)
    # 只返回必要的字段用于前端选择
    return [
        EmailConfigSimpleResponse(
            id=config.id,
            name=config.name,
            smtp_user=config.smtp_user,
            receiver_email=config.receiver_email
        ) for config in configs
    ]

@router.get("/notification-configs/{config_id}", response_model=EmailConfigResponse)
async def read_email_config(config_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    """获取单个邮件配置"""
    config = get_email_config(db=db, config_id=config_id)
    if config is None:
        raise HTTPException(status_code=404, detail="邮件配置不存在")
    # 确保用户只能访问自己的配置
    if config.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="无权访问此邮件配置")
    return config

@router.put("/notification-configs/{config_id}", response_model=EmailConfigResponse)
async def update_email_config_route(config_id: int, config: EmailConfigUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    """更新邮件配置"""
    # 先检查配置是否存在且属于当前用户
    existing_config = get_email_config(db=db, config_id=config_id)
    if existing_config is None:
        raise HTTPException(status_code=404, detail="邮件配置不存在")
    if existing_config.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="无权修改此邮件配置")

    db_config = update_email_config(db=db, config_id=config_id, config=config)
    return db_config

@router.delete("/notification-configs/{config_id}")
async def delete_email_config_route(config_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    """删除邮件配置"""
    # 先检查配置是否存在且属于当前用户
    existing_config = get_email_config(db=db, config_id=config_id)
    if existing_config is None:
        raise HTTPException(status_code=404, detail="邮件配置不存在")
    if existing_config.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="无权删除此邮件配置")

    success = delete_email_config(db=db, config_id=config_id)
    if not success:
        raise HTTPException(status_code=404, detail="邮件配置不存在")
    return {"message": "邮件配置删除成功"}

@router.post("/notification-configs/{config_id}/test")
async def test_email_config(config_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    """测试通知配置"""
    config = get_email_config(db=db, config_id=config_id)
    if config is None:
        raise HTTPException(status_code=404, detail="通知配置不存在")
    if config.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="无权测试此配置")

    email_service = EmailService()
    try:
        success = email_service.send_test_notification(config)
        if success:
            return {"success": True, "message": "测试通知已发送"}
        else:
            return {"success": False, "error": "测试通知发送失败，请检查通知 URL"}
    except Exception as e:
        return {"success": False, "error": f"测试通知发送失败: {str(e)}"}

# 黑名单域名相关API（仅管理员可访问）
@router.post("/blacklist-domains", response_model=BlacklistDomainResponse)
async def create_blacklist_domain_route(domain: BlacklistDomainCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    """创建黑名单域名（仅管理员）"""
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="需要管理员权限")

    return create_blacklist_domain(db=db, domain=domain, created_by=current_user.id)

@router.get("/blacklist-domains", response_model=List[BlacklistDomainResponse])
async def read_blacklist_domains(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    """获取黑名单域名列表（仅管理员）"""
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="需要管理员权限")

    return get_blacklist_domains(db=db, skip=skip, limit=limit)

@router.get("/blacklist-domains/{domain_id}", response_model=BlacklistDomainResponse)
async def read_blacklist_domain(domain_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    """获取单个黑名单域名（仅管理员）"""
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="需要管理员权限")

    domain = get_blacklist_domain(db=db, domain_id=domain_id)
    if domain is None:
        raise HTTPException(status_code=404, detail="黑名单域名不存在")
    return domain

@router.put("/blacklist-domains/{domain_id}", response_model=BlacklistDomainResponse)
async def update_blacklist_domain_route(domain_id: int, domain: BlacklistDomainUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    """更新黑名单域名（仅管理员）"""
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="需要管理员权限")

    updated_domain = update_blacklist_domain(db=db, domain_id=domain_id, domain=domain)
    if updated_domain is None:
        raise HTTPException(status_code=404, detail="黑名单域名不存在")
    return updated_domain

@router.delete("/blacklist-domains/{domain_id}")
async def delete_blacklist_domain_route(domain_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    """删除黑名单域名（仅管理员）"""
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="需要管理员权限")

    success = delete_blacklist_domain(db=db, domain_id=domain_id)
    if not success:
        raise HTTPException(status_code=404, detail="黑名单域名不存在")
    return {"message": "黑名单域名删除成功"}

@router.post("/blacklist-domains/test")
async def test_blacklist_matching(url: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    """测试黑名单匹配功能（仅管理员）"""
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="需要管理员权限")

    is_blacklisted = is_url_in_blacklist(db=db, url=url)
    return {
        "url": url,
        "is_blacklisted": is_blacklisted,
        "message": "该URL在黑名单中" if is_blacklisted else "该URL不在黑名单中"
    }

