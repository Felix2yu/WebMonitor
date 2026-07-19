import logging
import requests
from datetime import datetime
from typing import Optional, Tuple
from lxml import html

from ..db.database import SessionLocal
from ..core.config import settings
from ..db.crud import create_monitor_log, update_monitor_task_content
from .email_service import EmailService

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def _fetch_via_browserless(url: str, xpath: str) -> Tuple[Optional[str], Optional[str], Optional[str]]:
    """通过 browserless HTTP API 获取页面内容，本地 lxml 解析 XPath"""
    browserless_url = settings.BROWSERLESS_URL.rstrip('/')

    resp = requests.post(
        f"{browserless_url}/content",
        json={"url": url, "waitForTimeout": 5000},
        headers={"Content-Type": "application/json", "Cache-Control": "no-cache"},
        timeout=30,
    )
    resp.raise_for_status()

    # browserless /content 返回 text/html，不是 JSON
    page_html = resp.text
    if not page_html or len(page_html.strip()) < 10:
        return None, "browserless 返回内容为空", None

    tree = html.fromstring(page_html)
    elements = tree.xpath(xpath)
    if not elements:
        return None, f"XPath 未匹配到元素: {xpath}", None

    content = (elements[0].text_content() or "").strip()
    title_el = tree.xpath("//title")
    title = (title_el[0].text_content() or "").strip() if title_el else ""

    logger.info(f"browserless 获取成功: {title} - {content[:50]}...")
    return content, None, title


def _fetch_via_selenium(url: str, xpath: str) -> Tuple[Optional[str], Optional[str], Optional[str]]:
    """通过本地 Selenium WebDriver 获取页面内容"""
    from selenium import webdriver
    from selenium.webdriver.chrome.options import Options
    from selenium.webdriver.common.by import By
    from selenium.webdriver.support.ui import WebDriverWait
    from selenium.webdriver.support import expected_conditions as EC

    driver = None
    try:
        chrome_options = Options()
        chrome_options.add_argument("--headless")
        chrome_options.add_argument("--disable-gpu")
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_argument("--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")

        driver = webdriver.Chrome(options=chrome_options)
        driver.set_page_load_timeout(30)

        logger.info(f"正在访问: {url}")
        driver.get(url)

        wait = WebDriverWait(driver, 20)
        element = wait.until(EC.presence_of_element_located((By.XPATH, xpath)))
        content = element.text.strip()
        title = driver.title

        logger.info(f"成功获取内容: {title} - {content[:50]}...")
        return content, None, title

    except Exception as e:
        error_msg = f"获取内容出错 ({url}): {e}"
        logger.error(error_msg)
        return None, error_msg, None

    finally:
        if driver:
            driver.quit()


class MonitorService:
    """监控服务"""

    def __init__(self):
        self.email_service = EmailService()

    async def check_single_task(self, task_id: int) -> bool:
        db = SessionLocal()
        try:
            from ..db.crud import get_monitor_task
            task = get_monitor_task(db, task_id)

            if not task or not task.is_active:
                logger.info(f"任务 {task_id} 不存在或未启用，跳过检查")
                return False

            logger.info(f"开始检查任务: {task.name} (ID: {task_id})")

            if settings.BROWSERLESS_URL:
                current_content, error_message, title = _fetch_via_browserless(task.url, task.xpath)
            else:
                current_content, error_message, title = _fetch_via_selenium(task.url, task.xpath)

            check_time = datetime.now()

            if error_message:
                create_monitor_log(db=db, task_id=task_id, error_message=error_message, check_time=check_time)
                logger.error(f"任务 {task.name} 检查失败: {error_message}")
                return False

            old_content = task.last_content
            is_changed = old_content != current_content

            if is_changed:
                logger.info(f"任务 {task.name} 检测到内容变化")
                try:
                    self.email_service.send_change_notification(
                        task_name=task.name, url=task.url, title=title or "未知标题",
                        old_content=old_content or "无历史内容", new_content=current_content,
                        check_time=check_time, email_config_id=task.email_config_id, user_id=task.owner_id,
                    )
                except Exception as e:
                    logger.error(f"发送任务所有者通知失败: {e}")


            update_monitor_task_content(db, task_id, current_content, check_time)
            create_monitor_log(db=db, task_id=task_id, old_content=old_content,
                               new_content=current_content, is_changed=is_changed, check_time=check_time)
            logger.info(f"任务 {task.name} 检查完成，变化: {is_changed}")
            return True

        except Exception as e:
            error_msg = f"检查任务 {task_id} 时发生错误: {e}"
            logger.error(error_msg)
            try:
                create_monitor_log(db=db, task_id=task_id, error_message=error_msg, check_time=datetime.now())
            except Exception as log_error:
                logger.error(f"记录错误日志失败: {log_error}")
            return False

        finally:
            db.close()

    async def test_task(self, task_id: int) -> dict:
        db = SessionLocal()
        try:
            from ..db.crud import get_monitor_task
            task = get_monitor_task(db, task_id)

            if not task:
                return {"success": False, "error": "任务不存在"}

            logger.info(f"测试任务: {task.name} (ID: {task_id})")

            if settings.BROWSERLESS_URL:
                current_content, error_message, title = _fetch_via_browserless(task.url, task.xpath)
            else:
                current_content, error_message, title = _fetch_via_selenium(task.url, task.xpath)

            if error_message:
                return {"success": False, "error": error_message}

            return {"success": True, "content": current_content, "title": title, "url": task.url, "message": "测试成功"}

        except Exception as e:
            error_msg = f"测试任务 {task_id} 时发生错误: {e}"
            logger.error(error_msg)
            return {"success": False, "error": error_msg}

        finally:
            db.close()
