from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
import logging
import asyncio

from ..db.database import SessionLocal
from ..db.models import MonitorTask
from .monitor_service import MonitorService

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class MonitorScheduler:
    """监控任务调度器"""

    def __init__(self):
        self.scheduler = BackgroundScheduler()
        self.monitor_service = MonitorService()
        self._setup_jobs()

    def _build_trigger(self, task):
        """根据任务的调度配置构建调度触发器（仅支持 cron）"""
        if task.schedule_type == "cron" and task.cron_expression:
            return CronTrigger.from_crontab(task.cron_expression)
        raise ValueError(f"任务 {task.name} 未配置有效的 cron 表达式")

    def _schedule_desc(self, task):
        """生成任务调度的可读描述"""
        if task.schedule_type == "cron" and task.cron_expression:
            return f"Cron: {task.cron_expression}"
        return "未配置调度"

    def _schedule_active_tasks(self):
        """启动时一次性调度所有活跃任务（不周期性重建，避免 cron job 被重复移除/添加导致误触发）"""
        db = SessionLocal()
        try:
            from ..db.crud import get_active_monitor_tasks
            active_tasks = get_active_monitor_tasks(db)

            logger.info(f"调度到 {len(active_tasks)} 个活跃任务")

            for task in active_tasks:
                self._add_job_safe(task)

        except Exception as e:
            logger.error(f"调度活跃任务失败: {e}")
        finally:
            db.close()

    def _add_job_safe(self, task):
        """为任务添加监控作业（replace_existing 自动去重，绝不先 remove 再 add 以免 cron 立即触发）"""
        job_id = f"monitor_task_{task.id}"
        try:
            def task_wrapper():
                try:
                    asyncio.run(self.monitor_service.check_single_task(task.id))
                except Exception as e:
                    logger.error(f"执行任务 {task.name} 时发生错误: {e}")

            self.scheduler.add_job(
                func=task_wrapper,
                trigger=self._build_trigger(task),
                id=job_id,
                name=f"监控任务: {task.name}",
                replace_existing=True
            )
            logger.info(f"为任务 {task.name} (ID: {task.id}) 设置监控作业，调度: {self._schedule_desc(task)}")
        except Exception as e:
            logger.error(f"为任务 {task.id} 设置监控作业失败: {e}")

    def start(self):
        """启动调度器"""
        try:
            self.scheduler.start()
            # 启动时一次性调度所有活跃任务（后续增删改由 API 调用 add/remove_task_job 维护）
            self._schedule_active_tasks()
            logger.info("监控调度器启动成功")
        except Exception as e:
            logger.error(f"监控调度器启动失败: {e}")

    def stop(self):
        """停止调度器"""
        try:
            self.scheduler.shutdown()
            logger.info("监控调度器已停止")
        except Exception as e:
            logger.error(f"监控调度器停止失败: {e}")

    def add_task_job(self, task: MonitorTask):
        """为指定任务添加监控作业（供 API 在任务创建/更新时调用）"""
        try:
            self._add_job_safe(task)
            return True
        except Exception as e:
            logger.error(f"为任务 {task.id} 添加监控作业失败: {e}")
            return False

    def remove_task_job(self, task_id: int):
        """移除指定任务的监控作业"""
        job_id = f"monitor_task_{task_id}"
        try:
            if self.scheduler.get_job(job_id):
                self.scheduler.remove_job(job_id)
                logger.info(f"移除任务 {task_id} 的监控作业")
            return True

        except Exception as e:
            logger.error(f"移除任务 {task_id} 的监控作业失败: {e}")
            return False

# 创建全局调度器实例
monitor_scheduler = MonitorScheduler()