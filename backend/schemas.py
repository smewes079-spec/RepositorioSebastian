from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from models import PriorityLevel, TaskStatus, TaskSource, ClientType, TaskCategory, ClientImportance


class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    is_urgent: bool = False
    is_important: bool = False
    client_type: ClientType = ClientType.internal
    client_name: Optional[str] = None
    client_importance: ClientImportance = ClientImportance.regular
    category: TaskCategory = TaskCategory.otro
    due_date: Optional[datetime] = None
    reminder_at: Optional[datetime] = None
    tags: Optional[str] = None
    estimated_minutes: Optional[int] = None
    source: TaskSource = TaskSource.manual
    notes: Optional[str] = None


class TaskCreate(TaskBase):
    pass


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    is_urgent: Optional[bool] = None
    is_important: Optional[bool] = None
    client_type: Optional[ClientType] = None
    client_name: Optional[str] = None
    client_importance: Optional[ClientImportance] = None
    category: Optional[TaskCategory] = None
    status: Optional[TaskStatus] = None
    due_date: Optional[datetime] = None
    reminder_at: Optional[datetime] = None
    tags: Optional[str] = None
    estimated_minutes: Optional[int] = None
    actual_minutes: Optional[int] = None
    progress: Optional[int] = None
    notes: Optional[str] = None


class TaskResponse(TaskBase):
    id: int
    priority: PriorityLevel
    status: TaskStatus
    email_id: Optional[str] = None
    email_from: Optional[str] = None
    email_subject: Optional[str] = None
    progress: int
    actual_minutes: Optional[int] = None
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class EmailConfigCreate(BaseModel):
    email: str
    password: str
    imap_server: str
    imap_port: int = 993
    use_ssl: bool = True
    internal_domains: Optional[str] = None
    vip_emails: Optional[str] = None


class EmailConfigResponse(BaseModel):
    id: int
    email: str
    imap_server: str
    imap_port: int
    use_ssl: bool
    last_sync: Optional[datetime] = None
    is_active: bool
    internal_domains: Optional[str] = None
    vip_emails: Optional[str] = None

    class Config:
        from_attributes = True


class ClientRegistryCreate(BaseModel):
    name: str
    email_domain: Optional[str] = None
    email_address: Optional[str] = None
    client_type: ClientType = ClientType.external
    importance: ClientImportance = ClientImportance.regular
    notes: Optional[str] = None


class ClientRegistryResponse(ClientRegistryCreate):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class NotificationResponse(BaseModel):
    id: int
    task_id: Optional[int] = None
    title: str
    message: str
    is_read: bool
    notification_type: str
    created_at: datetime

    class Config:
        from_attributes = True


class DashboardSummary(BaseModel):
    date: str
    # Totales
    total_tasks: int
    completed: int
    in_progress: int
    pending: int
    overdue_tasks: int
    completion_rate: float
    # Segmentación
    external_tasks: List[TaskResponse]
    external_pending: int
    external_completed: int
    internal_tasks: List[TaskResponse]
    internal_pending: int
    internal_completed: int
    # Críticas
    critical_tasks: List[TaskResponse]
    # Análisis correos
    email_analysis: List[dict]


class WeeklyReportResponse(BaseModel):
    id: int
    week_start: datetime
    week_end: datetime
    total_tasks: int
    completed_tasks: int
    completion_rate: float
    external_completed: int
    internal_completed: int
    avg_completion_time: float
    most_productive_day: Optional[str]
    suggestions: Optional[str]
    report_data: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class SyncResult(BaseModel):
    synced: int
    new_tasks: int
    external_new: int
    internal_new: int
    errors: List[str] = []
