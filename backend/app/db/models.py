from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base

class User(Base):
    """用户模型"""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False, comment="用户名")
    email = Column(String(100), unique=True, index=True, nullable=False, comment="邮箱")
    hashed_password = Column(String(255), nullable=False, comment="加密密码")
    full_name = Column(String(100), comment="全名")
    is_active = Column(Boolean, default=True, comment="是否激活")
    is_admin = Column(Boolean, default=False, comment="是否管理员")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), comment="创建时间")
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), comment="更新时间")

    tasks = relationship("MonitorTask", back_populates="owner", cascade="all, delete-orphan")

class MonitorTask(Base):
    """监控任务模型"""
    __tablename__ = "monitor_tasks"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False, comment="任务名称")
    url = Column(String(500), nullable=False, comment="监控URL")
    xpath = Column(String(500), nullable=False, comment="XPath选择器")
    interval = Column(Integer, default=300, comment="检查间隔（秒）")
    is_active = Column(Boolean, default=True, comment="是否启用")
    description = Column(Text, comment="任务描述")
    last_content = Column(Text, comment="上次内容")
    last_check = Column(DateTime, comment="上次检查时间")
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False, comment="所有者ID")
    email_config_id = Column(Integer, ForeignKey("email_configs.id"), nullable=True, comment="邮件配置ID")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), comment="创建时间")
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), comment="更新时间")

    logs = relationship("MonitorLog", back_populates="task", cascade="all, delete-orphan")
    owner = relationship("User", back_populates="tasks")
    notify_config = relationship("EmailConfig")

class MonitorLog(Base):
    """监控日志模型"""
    __tablename__ = "monitor_logs"

    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, ForeignKey("monitor_tasks.id"), nullable=False, comment="任务ID")
    old_content = Column(Text, comment="旧内容")
    new_content = Column(Text, comment="新内容")
    is_changed = Column(Boolean, default=False, comment="内容是否变化")
    error_message = Column(Text, comment="错误信息")
    check_time = Column(DateTime(timezone=True), server_default=func.now(), comment="检查时间")

    task = relationship("MonitorTask", back_populates="logs")

class EmailConfig(Base):
    """通知配置模型"""
    __tablename__ = "email_configs"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, comment="配置名称")
    smtp_server = Column(String(200), nullable=True, comment="SMTP服务器地址")
    smtp_port = Column(Integer, default=465, comment="SMTP端口")
    smtp_user = Column(String(200), nullable=True, comment="发送者邮箱")
    smtp_password = Column(String(200), nullable=True, comment="SMTP密码")
    receiver_email = Column(String(200), nullable=True, comment="接收者邮箱")
    is_ssl = Column(Boolean, default=True, comment="是否使用SSL")
    apprise_urls = Column(Text, nullable=True, comment="Apprise通知URL，每行一个")
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, comment="用户ID")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), comment="创建时间")
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), comment="更新时间")

    user = relationship("User")

class BlacklistDomain(Base):
    """黑名单域名模型"""
    __tablename__ = "blacklist_domains"

    id = Column(Integer, primary_key=True, index=True)
    domain = Column(String(500), nullable=False, unique=True, index=True, comment="黑名单域名")
    description = Column(Text, comment="描述")
    is_active = Column(Boolean, default=True, comment="是否启用")
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False, comment="创建者ID")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), comment="创建时间")
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), comment="更新时间")

    creator = relationship("User")
