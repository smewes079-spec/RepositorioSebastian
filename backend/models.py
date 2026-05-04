from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, Float, Enum
from sqlalchemy.sql import func
from database import Base
import enum


class PriorityLevel(str, enum.Enum):
    critical = "critical"   # Urgente + Importante
    important = "important" # No urgente + Importante
    urgent = "urgent"       # Urgente + No importante
    low = "low"             # No urgente + No importante


class TaskStatus(str, enum.Enum):
    pending = "pending"
    in_progress = "in_progress"
    completed = "completed"
    cancelled = "cancelled"


class TaskSource(str, enum.Enum):
    manual = "manual"
    email = "email"
    calendar = "calendar"


class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    priority = Column(Enum(PriorityLevel), default=PriorityLevel.low)
    status = Column(Enum(TaskStatus), default=TaskStatus.pending)
    source = Column(Enum(TaskSource), default=TaskSource.manual)
    is_urgent = Column(Boolean, default=False)
    is_important = Column(Boolean, default=False)
    due_date = Column(DateTime, nullable=True)
    reminder_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    email_id = Column(String(200), nullable=True)
    email_from = Column(String(200), nullable=True)
    tags = Column(String(500), nullable=True)
    estimated_minutes = Column(Integer, nullable=True)
    actual_minutes = Column(Integer, nullable=True)
    progress = Column(Integer, default=0)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


class EmailConfig(Base):
    __tablename__ = "email_config"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(200), nullable=False)
    imap_server = Column(String(200), nullable=False)
    imap_port = Column(Integer, default=993)
    use_ssl = Column(Boolean, default=True)
    password_encrypted = Column(Text, nullable=False)
    last_sync = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(Integer, nullable=True)
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    notification_type = Column(String(50), default="reminder")
    created_at = Column(DateTime, server_default=func.now())


class WeeklyReport(Base):
    __tablename__ = "weekly_reports"

    id = Column(Integer, primary_key=True, index=True)
    week_start = Column(DateTime, nullable=False)
    week_end = Column(DateTime, nullable=False)
    total_tasks = Column(Integer, default=0)
    completed_tasks = Column(Integer, default=0)
    completion_rate = Column(Float, default=0.0)
    avg_completion_time = Column(Float, default=0.0)
    most_productive_day = Column(String(20), nullable=True)
    suggestions = Column(Text, nullable=True)
    report_data = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
