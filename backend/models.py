from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, Float, Enum
from sqlalchemy.sql import func
from database import Base
import enum


class PriorityLevel(str, enum.Enum):
    critical = "critical"   # Urgente + Importante (cliente externo crítico)
    high = "high"           # Urgente o Importante (cliente externo)
    medium = "medium"       # Cliente interno urgente / externo bajo
    low = "low"             # Cliente interno rutinario


class TaskStatus(str, enum.Enum):
    pending = "pending"
    in_progress = "in_progress"
    completed = "completed"
    cancelled = "cancelled"


class ClientType(str, enum.Enum):
    external = "external"   # Clientes importadores/exportadores
    internal = "internal"   # Equipos internos (operaciones, finanzas, etc.)


class TaskSource(str, enum.Enum):
    manual = "manual"
    email = "email"


class TaskCategory(str, enum.Enum):
    # Categorías específicas agencia aduanera
    despacho = "despacho"               # Despacho / liberación de carga
    documentacion = "documentacion"     # Documentación aduanera (DUS, DAI)
    clasificacion = "clasificacion"     # Clasificación arancelaria
    pago = "pago"                       # Pagos de derechos / impuestos
    fiscalizacion = "fiscalizacion"     # Fiscalización / auditoría
    cotizacion = "cotizacion"           # Cotizaciones a clientes
    coordinacion = "coordinacion"       # Coordinación interna
    reunion = "reunion"                 # Reuniones
    reporte = "reporte"                 # Reportes internos
    otro = "otro"


class ClientImportance(str, enum.Enum):
    vip = "vip"           # Cliente estratégico / gran volumen
    regular = "regular"   # Cliente habitual
    ocasional = "ocasional"  # Cliente esporádico
    interno = "interno"   # Área interna


class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    priority = Column(Enum(PriorityLevel), default=PriorityLevel.low)
    status = Column(Enum(TaskStatus), default=TaskStatus.pending)
    source = Column(Enum(TaskSource), default=TaskSource.manual)

    # Segmentación cliente
    client_type = Column(Enum(ClientType), default=ClientType.internal)
    client_name = Column(String(200), nullable=True)
    client_importance = Column(Enum(ClientImportance), default=ClientImportance.regular)
    category = Column(Enum(TaskCategory), default=TaskCategory.otro)

    # Priorización
    is_urgent = Column(Boolean, default=False)
    is_important = Column(Boolean, default=False)

    # Fechas
    due_date = Column(DateTime, nullable=True)
    reminder_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)

    # Email
    email_id = Column(String(200), nullable=True)
    email_from = Column(String(200), nullable=True)
    email_subject = Column(String(500), nullable=True)

    # Tracking
    tags = Column(String(500), nullable=True)
    estimated_minutes = Column(Integer, nullable=True)
    actual_minutes = Column(Integer, nullable=True)
    progress = Column(Integer, default=0)
    notes = Column(Text, nullable=True)

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

    # Dominios/emails de clientes internos (separados por coma)
    internal_domains = Column(Text, nullable=True)
    # Emails VIP (separados por coma)
    vip_emails = Column(Text, nullable=True)

    created_at = Column(DateTime, server_default=func.now())


class ClientRegistry(Base):
    """Registro de clientes para clasificación automática"""
    __tablename__ = "client_registry"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    email_domain = Column(String(200), nullable=True)
    email_address = Column(String(200), nullable=True)
    client_type = Column(Enum(ClientType), default=ClientType.external)
    importance = Column(Enum(ClientImportance), default=ClientImportance.regular)
    notes = Column(Text, nullable=True)
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
    external_completed = Column(Integer, default=0)
    internal_completed = Column(Integer, default=0)
    avg_completion_time = Column(Float, default=0.0)
    most_productive_day = Column(String(20), nullable=True)
    suggestions = Column(Text, nullable=True)
    report_data = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
