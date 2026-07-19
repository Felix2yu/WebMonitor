import logging
from datetime import datetime
from typing import Optional

import apprise

from app.core.config import settings
from ..db.database import SessionLocal
from ..db.models import EmailConfig

logger = logging.getLogger(__name__)


class EmailService:
    """通知服务（基于 apprise，支持多渠道）"""

    def __init__(self):
        self._config: Optional[EmailConfig] = None

    def get_email_config_by_id(self, config_id: int) -> Optional[EmailConfig]:
        """根据ID获取通知配置"""
        db = SessionLocal()
        try:
            return db.query(EmailConfig).filter(EmailConfig.id == config_id).first()
        finally:
            db.close()

    def get_email_config(self, user_id: Optional[int] = None) -> Optional[EmailConfig]:
        """获取通知配置"""
        db = SessionLocal()
        try:
            if user_id:
                from ..db.crud import get_user_active_email_config
                user_config = get_user_active_email_config(db, user_id)
                if user_config:
                    return user_config
            self._config = db.query(EmailConfig).first()
            return self._config
        finally:
            db.close()

    def _get_urls_from_config(self, config: Optional[EmailConfig]) -> list[str]:
        """从配置对象提取 apprise URLs"""
        urls = []
        if config and config.apprise_urls:
            urls.extend(
                u.strip() for u in config.apprise_urls.splitlines() if u.strip()
            )
        return urls

    def _get_urls_from_env(self) -> list[str]:
        """从环境变量提取 apprise URLs"""
        if settings.APPRISE_URLS:
            return [u.strip() for u in settings.APPRISE_URLS.split(",") if u.strip()]
        return []

    def _build_message(self, task_name: str, url: str, title: str,
                       old_content: str, new_content: str, check_time: datetime) -> tuple[str, str]:
        """构建通知标题和正文"""
        time_str = check_time.strftime("%Y-%m-%d %H:%M:%S")
        subject = f"{title} - 内容更新通知"
        body = (
            f"网页内容已更新！\n\n"
            f"监控任务: {task_name}\n"
            f"网页标题: {title}\n"
            f"监控URL: {url}\n"
            f"更新时间: {time_str}\n\n"
            f"---\n原内容:\n{old_content}\n\n"
            f"---\n新内容:\n{new_content}\n\n"
            f"---\n此通知由 WebMonitor 自动发送。"
        )
        return subject, body

    def _send_via_apprise(self, urls: list[str], title: str, body: str) -> bool:
        """通过 apprise 发送通知"""
        if not urls:
            logger.warning("未配置通知 URL，跳过发送")
            return False

        a = apprise.Apprise()
        for url in urls:
            a.add(url)

        if not a:
            logger.warning("apprise 无有效通知 URL")
            return False

        result = a.notify(title=title, body=body)
        if result:
            logger.info(f"通知发送成功，渠道数: {len(urls)}")
        else:
            logger.error("通知发送失败")
        return result

    def send_change_notification(
        self,
        task_name: str,
        url: str,
        title: str,
        old_content: str,
        new_content: str,
        check_time: datetime,
        email_config_id: Optional[int] = None,
        user_id: Optional[int] = None,
    ) -> bool:
        """发送内容变化通知"""
        logger.info(f"[通知] task={task_name}, email_config_id={email_config_id}, user_id={user_id}")
        if email_config_id:
            config = self.get_email_config_by_id(email_config_id)
            logger.info(f"[通知] 按 config_id={email_config_id} 查找: {config}")
        else:
            config = self.get_email_config(user_id)
            logger.info(f"[通知] 按 user_id={user_id} 查找: {config}")

        urls = self._get_urls_from_config(config) or self._get_urls_from_env()
        logger.info(f"[通知] 解析到 {len(urls)} 个通知 URL: {urls}")
        subject, body = self._build_message(task_name, url, title, old_content, new_content, check_time)
        return self._send_via_apprise(urls, subject, body)

    def send_test_notification(self, config: EmailConfig) -> bool:
        """发送测试通知"""
        test_time = datetime.now()
        urls = self._get_urls_from_config(config)
        subject = "WebMonitor 通知配置测试"
        body = (
            f"这是一条来自 WebMonitor 的测试通知。\n\n"
            f"测试时间: {test_time.strftime('%Y-%m-%d %H:%M:%S')}\n"
            f"配置名称: {config.name}\n\n"
            f"如果您收到此通知，说明配置正常工作！"
        )
        return self._send_via_apprise(urls, subject, body)

    def test_email_connection(self) -> dict:
        """测试通知连接"""
        config = self.get_email_config()
        if not config:
            return {"success": False, "error": "未找到通知配置"}
        urls = self._get_urls_from_config(config)
        if not urls:
            return {"success": False, "error": "未配置通知 URL"}
        a = apprise.Apprise()
        for url in urls:
            a.add(url)
        if not a:
            return {"success": False, "error": "无有效通知 URL"}
        return {"success": True, "message": f"已加载 {len(urls)} 个通知渠道"}

    def test_email_connection_with_config(self, config: EmailConfig) -> dict:
        """使用指定配置测试连接"""
        urls = self._get_urls_from_config(config)
        if not urls:
            return {"success": False, "error": "未配置通知 URL"}
        a = apprise.Apprise()
        for url in urls:
            a.add(url)
        if not a:
            return {"success": False, "error": "无有效通知 URL"}
        return {"success": True, "message": f"已加载 {len(urls)} 个通知渠道"}
