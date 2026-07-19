from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List
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

class MonitorTaskBase(BaseModel):
    name: str = Field(..., description="任务名称", min_length=1, max_length=200)
    url: str = Field(..., description="监控URL", min_length=1, max_length=500)
    xpath: str = Field(..., description="XPath选择器", min_length=1, max_length=500)
    interval: int = Field(default=300, description="检查间隔（秒）", ge=10)
    is_active: bool = Field(default=True, description="是否启用")
    description: Optional[str] = Field(None, description="任务描述", max_length=1000)

class MonitorTaskCreate(MonitorTaskBase):
    email_config_id: int = Field(..., description="通知配置ID")

class MonitorTaskUpdate(BaseModel):
    name: Optional[str] = Field(None, description="任务名称", min_length=1, max_length=200)
    url: Optional[str] = Field(None, description="监控URL", min_length=1, max_length=500)
    xpath: Optional[str] = Field(None, description="XPath选择器", min_length=1, max_length=500)
    interval: Optional[int] = Field(None, description="检查间隔（秒）", ge=10)
    is_active: Optional[bool] = Field(None, description="是否启用")
    description: Optional[str] = Field(None, description="任务描述", max_length=1000)
    email_config_id: Optional[int] = Field(None, description="通知配置ID")

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

class EmailConfigBase(BaseModel):
    name: str = Field(..., description="配置名称", min_length=1, max_length=100)
    smtp_server: Optional[str] = Field(None, description="SMTP服务器地址")
    smtp_port: int = Field(default=465, description="SMTP端口", ge=1, le=65535)
    smtp_user: Optional[str] = Field(None, description="发送者邮箱")
    smtp_password: Optional[str] = Field(None, description="SMTP密码")
    receiver_email: Optional[str] = Field(None, description="接收者邮箱")
    is_ssl: bool = Field(default=True, description="是否使用SSL")
    apprise_urls: Optional[str] = Field(None, description="Apprise通知URL，每行一个")

class EmailConfigCreate(EmailConfigBase):
    pass

class EmailConfigUpdate(EmailConfigBase):
    name: Optional[str] = None
    smtp_server: Optional[str] = None
    smtp_port: Optional[int] = None
    smtp_user: Optional[str] = None
    smtp_password: Optional[str] = None
    receiver_email: Optional[str] = None
    is_ssl: Optional[bool] = None
    apprise_urls: Optional[str] = None

class EmailConfigSimpleResponse(BaseModel):
    id: int
    name: str
    smtp_user: Optional[str] = None
    receiver_email: Optional[str] = None
    apprise_urls: Optional[str] = None
    class Config:
        from_attributes = True

class EmailConfigResponse(EmailConfigBase):
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
