from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from models import PriorityLevel, TaskStatus, TaskSource


class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    is_urgent: bool = False
    is_important: bool = False
    due_date: Optional[datetime] = None
    reminder_at: Optional[datetime] = None
    tags: Optional[str] = None
    estimated_minutes: Optional[int] = None
    source: TaskSource = TaskSource.manual


class TaskCreate(TaskBase):
    pass


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    is_urgent: Optional[bool] = None
    is_important: Optional[bool] = None
    status: Optional[TaskStatus] = None
    due_date: Optional[datetime] = None
    reminder_at: Optional[datetime] = None
    tags: Optional[str] = None
    estimated_minutes: Optional[int] = None
    actual_minutes: Optional[int] = None
    progress: Optional[int] = None


class TaskResponse(TaskBase):
    id: int
    priority: PriorityLevel
    status: TaskStatus
    email_id: Optional[str] = None
    email_from: Optional[str] = None
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


class EmailConfigResponse(BaseModel):
    id: int
    email: str
    imap_server: str
    imap_port: int
    use_ssl: bool
    last_sync: Optional[datetime] = None
    is_active: bool

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


class DailySummary(BaseModel):
    date: str
    total_tasks: int
    completed: int
    in_progress: int
    pending: int
    critical_tasks: List[TaskResponse]
    important_tasks: List[TaskResponse]
    urgent_tasks: List[TaskResponse]
    completion_rate: float
    overdue_tasks: int


class WeeklyReportResponse(BaseModel):
    id: int
    week_start: datetime
    week_end: datetime
    total_tasks: int
    completed_tasks: int
    completion_rate: float
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
    errors: List[str] = []
