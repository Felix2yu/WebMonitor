from pydantic import BaseModel, Field, EmailStr, field_validator, model_validator
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    username: str = Field(..., description="用户名", min_length=3, max_length=50)
    email: EmailStr = Field(..., description="邮箱")
    full_name: Optional[str] = Field(None, description="全名", max_length=100)
    is_active: bool = Field(default=True, description="是否激活")

class UserCreate(UserBase):
    password: str = Field(..., description="密码", min_length=6)
    is_admin: Optional[bool] = Field(default=False, description="是否管理员")

class UserUpdate(BaseModel):
    username: Optional[str] = Field(None, description="用户名")
    email: Optional[EmailStr] = Field(None, description="邮箱")
    full_name: Optional[str] = Field(None, description="全名")
    is_active: Optional[bool] = Field(None, description="是否激活")
    password: Optional[str] = Field(None, description="密码")
    is_admin: Optional[bool] = None

class UserResponse(BaseModel):
    id: int
    username: str
    email: EmailStr
    full_name: Optional[str] = None
    is_active: bool
    is_admin: bool
    created_at: datetime
    updated_at: datetime
    class Config:
        from_attributes = True

class TokenData(BaseModel):
    username: Optional[str] = None
    user_id: Optional[int] = None
    is_admin: Optional[bool] = False

class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class MonitorTaskBase(BaseModel):
    name: str = Field(..., description="任务名称", min_length=1, max_length=200)
    url: str = Field(..., description="监控URL", min_length=1, max_length=500)
    xpath: str = Field(..., description="XPath选择器", min_length=1, max_length=500)
    interval: int = Field(default=300, description="检查间隔（秒）", ge=10)
    schedule_type: str = Field(default="interval", description="调度类型: interval / cron")
    cron_expression: Optional[str] = Field(None, description="Cron表达式（标准5字段: 分 时 日 月 星期）", max_length=100)
    is_active: bool = Field(default=True, description="是否启用")
    description: Optional[str] = Field(None, description="任务描述", max_length=1000)

    @field_validator('schedule_type')
    @classmethod
    def validate_schedule_type(cls, v):
        if v not in ("interval", "cron"):
            raise ValueError("schedule_type 只能是 interval 或 cron")
        return v

    @field_validator('cron_expression')
    @classmethod
    def validate_cron_expression(cls, v, info):
        schedule_type = info.data.get("schedule_type", "interval")
        if schedule_type == "cron":
            if not v or not v.strip():
                raise ValueError("cron 调度类型需要提供 cron_expression")
            from apscheduler.triggers.cron import CronTrigger
            try:
                CronTrigger.from_crontab(v)
            except Exception as e:
                raise ValueError(f"无效的 Cron 表达式: {e}")
        return v

class MonitorTaskCreate(MonitorTaskBase):
    email_config_id: int = Field(..., description="通知配置ID")

class MonitorTaskUpdate(BaseModel):
    name: Optional[str] = Field(None, description="任务名称", min_length=1, max_length=200)
    url: Optional[str] = Field(None, description="监控URL", min_length=1, max_length=500)
    xpath: Optional[str] = Field(None, description="XPath选择器", min_length=1, max_length=500)
    interval: Optional[int] = Field(None, description="检查间隔（秒）", ge=10)
    schedule_type: Optional[str] = Field(None, description="调度类型: interval / cron")
    cron_expression: Optional[str] = Field(None, description="Cron表达式（标准5字段: 分 时 日 月 星期）", max_length=100)
    is_active: Optional[bool] = Field(None, description="是否启用")
    description: Optional[str] = Field(None, description="任务描述", max_length=1000)
    email_config_id: Optional[int] = Field(None, description="通知配置ID")

    @field_validator('schedule_type')
    @classmethod
    def validate_schedule_type(cls, v):
        if v is not None and v not in ("interval", "cron"):
            raise ValueError("schedule_type 只能是 interval 或 cron")
        return v

    @field_validator('cron_expression')
    @classmethod
    def validate_cron_expression(cls, v):
        if v is None or v == "":
            return v
        from apscheduler.triggers.cron import CronTrigger
        try:
            CronTrigger.from_crontab(v)
        except Exception as e:
            raise ValueError(f"无效的 Cron 表达式: {e}")
        return v

    @model_validator(mode='after')
    def check_cron_required(self):
        if self.schedule_type == "cron" and not (self.cron_expression or "").strip():
            raise ValueError("cron 调度类型需要提供 cron_expression")
        return self

class MonitorTaskResponse(MonitorTaskBase):
    id: int
    last_content: Optional[str] = None
    last_check: Optional[datetime] = None
    owner_id: int
    email_config_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    owner_username: Optional[str] = None
    class Config:
        from_attributes = True

class MonitorLogResponse(BaseModel):
    id: int
    task_id: int
    old_content: Optional[str] = None
    new_content: Optional[str] = None
    is_changed: bool
    error_message: Optional[str] = None
    check_time: datetime
    class Config:
        from_attributes = True

class NotifyConfigBase(BaseModel):
    name: str = Field(..., description="配置名称", min_length=1, max_length=100)
    smtp_server: Optional[str] = Field(None, description="SMTP服务器地址")
    smtp_port: int = Field(default=465, description="SMTP端口", ge=1, le=65535)
    smtp_user: Optional[str] = Field(None, description="发送者邮箱")
    smtp_password: Optional[str] = Field(None, description="SMTP密码")
    receiver_email: Optional[str] = Field(None, description="接收者邮箱")
    is_ssl: bool = Field(default=True, description="是否使用SSL")
    apprise_urls: Optional[str] = Field(None, description="Apprise通知URL，每行一个")

class NotifyConfigCreate(NotifyConfigBase):
    pass

class NotifyConfigUpdate(NotifyConfigBase):
    name: Optional[str] = None
    smtp_server: Optional[str] = None
    smtp_port: Optional[int] = None
    smtp_user: Optional[str] = None
    smtp_password: Optional[str] = None
    receiver_email: Optional[str] = None
    is_ssl: Optional[bool] = None
    apprise_urls: Optional[str] = None

class NotifyConfigSimpleResponse(BaseModel):
    id: int
    name: str
    smtp_user: Optional[str] = None
    receiver_email: Optional[str] = None
    apprise_urls: Optional[str] = None
    class Config:
        from_attributes = True

class NotifyConfigResponse(NotifyConfigBase):
    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime
    class Config:
        from_attributes = True

class BlacklistDomainBase(BaseModel):
    domain: str = Field(..., description="黑名单域名", min_length=1, max_length=500)
    description: Optional[str] = Field(None, description="描述")
    is_active: bool = Field(default=True, description="是否启用")

class BlacklistDomainCreate(BlacklistDomainBase):
    pass

class BlacklistDomainUpdate(BaseModel):
    domain: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None

class BlacklistDomainResponse(BlacklistDomainBase):
    id: int
    created_by: int
    created_at: datetime
    updated_at: datetime
    class Config:
        from_attributes = True
