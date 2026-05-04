from sqlalchemy.orm import Session
from sqlalchemy import and_, func
from datetime import datetime, timedelta
from typing import List, Optional
import json

from models import (Task, Notification, PriorityLevel, TaskStatus, TaskSource,
                    ClientType, ClientImportance, TaskCategory, WeeklyReport, ClientRegistry)
from schemas import TaskCreate, TaskUpdate, DashboardSummary


def compute_priority(is_urgent: bool, is_important: bool,
                     client_type: str, client_importance: str) -> PriorityLevel:
    """
    Lógica de priorización adaptada a agencia aduanera:
    - Cliente externo VIP + urgente/importante → critical
    - Cliente externo + urgente o importante → high
    - Cliente externo regular → medium
    - Cliente interno → medium/low según urgencia
    """
    is_ext = client_type == ClientType.external or client_type == "external"
    is_vip = client_importance == ClientImportance.vip or client_importance == "vip"

    if is_ext:
        if is_vip and (is_urgent or is_important):
            return PriorityLevel.critical
        if is_vip:
            return PriorityLevel.high
        if is_urgent and is_important:
            return PriorityLevel.critical
        if is_urgent or is_important:
            return PriorityLevel.high
        return PriorityLevel.medium
    else:
        # Cliente interno
        if is_urgent and is_important:
            return PriorityLevel.medium
        if is_urgent:
            return PriorityLevel.medium
        return PriorityLevel.low


def create_task(db: Session, task_in: TaskCreate) -> Task:
    priority = compute_priority(
        task_in.is_urgent, task_in.is_important,
        task_in.client_type, task_in.client_importance
    )
    db_task = Task(
        title=task_in.title,
        description=task_in.description,
        priority=priority,
        is_urgent=task_in.is_urgent,
        is_important=task_in.is_important,
        client_type=task_in.client_type,
        client_name=task_in.client_name,
        client_importance=task_in.client_importance,
        category=task_in.category,
        due_date=task_in.due_date,
        reminder_at=task_in.reminder_at,
        tags=task_in.tags,
        estimated_minutes=task_in.estimated_minutes,
        source=task_in.source,
        notes=task_in.notes,
    )
    db.add(db_task)
    db.commit()
    db.refresh(db_task)

    if task_in.reminder_at:
        _create_notification(db, db_task.id, "Recordatorio programado",
                             f"Recordatorio para: {db_task.title}", "reminder")
    return db_task


def update_task(db: Session, task_id: int, task_update: TaskUpdate) -> Optional[Task]:
    db_task = db.query(Task).filter(Task.id == task_id).first()
    if not db_task:
        return None

    update_data = task_update.model_dump(exclude_unset=True)

    if any(k in update_data for k in ["is_urgent", "is_important", "client_type", "client_importance"]):
        update_data["priority"] = compute_priority(
            update_data.get("is_urgent", db_task.is_urgent),
            update_data.get("is_important", db_task.is_important),
            update_data.get("client_type", db_task.client_type),
            update_data.get("client_importance", db_task.client_importance),
        )

    if update_data.get("status") == TaskStatus.completed and db_task.status != TaskStatus.completed:
        update_data["completed_at"] = datetime.now()
        update_data["progress"] = 100
        _create_notification(db, task_id, "Tarea completada",
                             f"✅ Completaste: {db_task.title}", "success")

    for key, value in update_data.items():
        setattr(db_task, key, value)

    db.commit()
    db.refresh(db_task)
    return db_task


def get_tasks(db: Session, status: Optional[str] = None,
              priority: Optional[str] = None,
              client_type: Optional[str] = None,
              category: Optional[str] = None) -> List[Task]:
    query = db.query(Task).filter(Task.status != TaskStatus.cancelled)

    if status:
        query = query.filter(Task.status == status)
    if priority:
        query = query.filter(Task.priority == priority)
    if client_type:
        query = query.filter(Task.client_type == client_type)
    if category:
        query = query.filter(Task.category == category)

    priority_order = {
        PriorityLevel.critical: 0,
        PriorityLevel.high: 1,
        PriorityLevel.medium: 2,
        PriorityLevel.low: 3,
    }
    tasks = query.all()
    tasks.sort(key=lambda t: (
        priority_order.get(t.priority, 99),
        t.due_date or datetime.max
    ))
    return tasks


def get_dashboard_summary(db: Session) -> DashboardSummary:
    now = datetime.now()
    today = now.date()
    today_start = datetime.combine(today, datetime.min.time())

    all_active = db.query(Task).filter(Task.status != TaskStatus.cancelled).all()

    # Tareas del día (creadas hoy o con vencimiento hoy)
    today_tasks = [
        t for t in all_active
        if (t.due_date and t.due_date.date() == today)
        or (t.created_at and t.created_at.date() == today)
    ] or all_active

    completed = sum(1 for t in today_tasks if t.status == TaskStatus.completed)
    in_progress = sum(1 for t in today_tasks if t.status == TaskStatus.in_progress)
    pending = sum(1 for t in today_tasks if t.status == TaskStatus.pending)
    overdue = sum(1 for t in all_active
                  if t.due_date and t.due_date < now
                  and t.status not in [TaskStatus.completed, TaskStatus.cancelled])
    rate = round(completed / len(today_tasks) * 100, 1) if today_tasks else 0

    # Segmentación
    external = [t for t in today_tasks if t.client_type == ClientType.external]
    internal = [t for t in today_tasks if t.client_type == ClientType.internal]

    # Sólo pendientes + en progreso para el panel
    ext_active = [t for t in external if t.status != TaskStatus.completed]
    int_active = [t for t in internal if t.status != TaskStatus.completed]

    critical = [t for t in today_tasks
                if t.priority == PriorityLevel.critical
                and t.status != TaskStatus.completed]

    # Análisis de correos recientes (últimas 24h)
    recent_email_tasks = [
        t for t in all_active
        if t.source == TaskSource.email
        and t.created_at >= now - timedelta(hours=24)
    ]
    email_analysis = []
    for t in sorted(recent_email_tasks,
                    key=lambda x: (0 if x.client_type == ClientType.external else 1,
                                   0 if x.priority == PriorityLevel.critical else 1)):
        email_analysis.append({
            "id": t.id,
            "subject": t.email_subject or t.title,
            "from": t.email_from or "",
            "client_type": t.client_type,
            "client_name": t.client_name or "",
            "client_importance": t.client_importance,
            "priority": t.priority,
            "category": t.category,
            "is_urgent": t.is_urgent,
            "status": t.status,
            "created_at": t.created_at.isoformat() if t.created_at else "",
        })

    priority_order = {PriorityLevel.critical: 0, PriorityLevel.high: 1,
                      PriorityLevel.medium: 2, PriorityLevel.low: 3}
    ext_active.sort(key=lambda t: (priority_order.get(t.priority, 99),
                                    t.due_date or datetime.max))
    int_active.sort(key=lambda t: (priority_order.get(t.priority, 99),
                                    t.due_date or datetime.max))

    return DashboardSummary(
        date=today.isoformat(),
        total_tasks=len(today_tasks),
        completed=completed,
        in_progress=in_progress,
        pending=pending,
        overdue_tasks=overdue,
        completion_rate=rate,
        external_tasks=ext_active[:20],
        external_pending=sum(1 for t in external if t.status == TaskStatus.pending),
        external_completed=sum(1 for t in external if t.status == TaskStatus.completed),
        internal_tasks=int_active[:20],
        internal_pending=sum(1 for t in internal if t.status == TaskStatus.pending),
        internal_completed=sum(1 for t in internal if t.status == TaskStatus.completed),
        critical_tasks=critical[:10],
        email_analysis=email_analysis[:20],
    )


def generate_weekly_report(db: Session) -> WeeklyReport:
    today = datetime.now()
    week_start = (today - timedelta(days=today.weekday())).replace(
        hour=0, minute=0, second=0, microsecond=0)
    week_end = week_start + timedelta(days=6, hours=23, minutes=59, seconds=59)

    tasks = db.query(Task).filter(
        and_(Task.created_at >= week_start, Task.created_at <= week_end)
    ).all()

    total = len(tasks)
    completed = [t for t in tasks if t.status == TaskStatus.completed]
    rate = round(len(completed) / total * 100, 1) if total else 0

    ext_completed = sum(1 for t in completed if t.client_type == ClientType.external)
    int_completed = sum(1 for t in completed if t.client_type == ClientType.internal)

    times = []
    for t in completed:
        if t.completed_at and t.created_at:
            times.append((t.completed_at - t.created_at).total_seconds() / 60)
    avg_time = round(sum(times) / len(times), 1) if times else 0

    days_count: dict = {}
    for t in completed:
        if t.completed_at:
            day = t.completed_at.strftime("%A")
            days_count[day] = days_count.get(day, 0) + 1
    productive_day = max(days_count, key=days_count.get) if days_count else None

    by_category: dict = {}
    for t in tasks:
        cat = str(t.category) if t.category else "otro"
        by_category[cat] = by_category.get(cat, 0) + 1

    suggestions = _generate_suggestions(total, rate, avg_time, tasks, ext_completed, int_completed)

    report_data = json.dumps({
        "by_priority": {
            "critical": sum(1 for t in tasks if t.priority == PriorityLevel.critical),
            "high": sum(1 for t in tasks if t.priority == PriorityLevel.high),
            "medium": sum(1 for t in tasks if t.priority == PriorityLevel.medium),
            "low": sum(1 for t in tasks if t.priority == PriorityLevel.low),
        },
        "by_status": {
            "completed": len(completed),
            "in_progress": sum(1 for t in tasks if t.status == TaskStatus.in_progress),
            "pending": sum(1 for t in tasks if t.status == TaskStatus.pending),
        },
        "by_client_type": {
            "external": sum(1 for t in tasks if t.client_type == ClientType.external),
            "internal": sum(1 for t in tasks if t.client_type == ClientType.internal),
        },
        "by_source": {
            "manual": sum(1 for t in tasks if t.source == TaskSource.manual),
            "email": sum(1 for t in tasks if t.source == TaskSource.email),
        },
        "by_category": by_category,
        "days_productivity": days_count,
    })

    existing = db.query(WeeklyReport).filter(
        WeeklyReport.week_start >= week_start,
        WeeklyReport.week_start < week_start + timedelta(days=1)
    ).first()

    if existing:
        existing.total_tasks = total
        existing.completed_tasks = len(completed)
        existing.completion_rate = rate
        existing.external_completed = ext_completed
        existing.internal_completed = int_completed
        existing.avg_completion_time = avg_time
        existing.most_productive_day = productive_day
        existing.suggestions = suggestions
        existing.report_data = report_data
        db.commit()
        db.refresh(existing)
        return existing

    report = WeeklyReport(
        week_start=week_start, week_end=week_end,
        total_tasks=total, completed_tasks=len(completed),
        completion_rate=rate, external_completed=ext_completed,
        internal_completed=int_completed, avg_completion_time=avg_time,
        most_productive_day=productive_day, suggestions=suggestions,
        report_data=report_data,
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    return report


def _generate_suggestions(total: int, rate: float, avg_time: float,
                           tasks: list, ext_completed: int, int_completed: int) -> str:
    suggestions = []

    ext_total = sum(1 for t in tasks if t.client_type == ClientType.external)
    int_total = sum(1 for t in tasks if t.client_type == ClientType.internal)
    ext_rate = round(ext_completed / ext_total * 100, 1) if ext_total else 0
    int_rate = round(int_completed / int_total * 100, 1) if int_total else 0

    if ext_rate < 70:
        suggestions.append(
            f"Tu tasa de cumplimiento con clientes externos es {ext_rate}%. "
            "Prioriza estas solicitudes para mejorar la satisfacción del cliente."
        )
    elif ext_rate >= 90:
        suggestions.append("Excelente atención a clientes externos. Mantén ese nivel de respuesta.")

    if int_rate < 50:
        suggestions.append(
            "Las tareas internas tienen baja tasa de completado. "
            "Bloquea tiempo en tu agenda para gestión interna."
        )

    critical = sum(1 for t in tasks if t.priority == PriorityLevel.critical)
    if critical > 10:
        suggestions.append(
            f"Acumulaste {critical} tareas críticas esta semana. "
            "Evalúa delegar despachos rutinarios al equipo operativo."
        )

    if avg_time > 180:
        suggestions.append(
            "El tiempo promedio de resolución supera 3 horas. "
            "Considera usar plantillas para respuestas frecuentes (cotizaciones, estados de despacho)."
        )

    email_tasks = sum(1 for t in tasks if t.source == TaskSource.email)
    if email_tasks > total * 0.7 and total > 0:
        suggestions.append(
            "Más del 70% de tus tareas provienen del correo. "
            "Define horarios fijos de revisión de email para evitar interrupciones constantes."
        )

    if not suggestions:
        suggestions.append(
            "Buena gestión esta semana. Continúa priorizando clientes externos "
            "y mantén actualizado el estado de los despachos."
        )

    return " | ".join(suggestions)


def _create_notification(db: Session, task_id: int, title: str,
                          message: str, notif_type: str):
    db.add(Notification(task_id=task_id, title=title,
                        message=message, notification_type=notif_type))
    db.commit()


def check_reminders(db: Session):
    now = datetime.now()
    tasks = db.query(Task).filter(
        and_(Task.reminder_at >= now - timedelta(minutes=1),
             Task.reminder_at <= now + timedelta(minutes=1),
             Task.status.notin_([TaskStatus.completed, TaskStatus.cancelled]))
    ).all()
    for t in tasks:
        _create_notification(db, t.id, "⏰ Recordatorio", f"Es hora de atender: {t.title}", "reminder")

    overdue = db.query(Task).filter(
        and_(Task.due_date < now,
             Task.status.notin_([TaskStatus.completed, TaskStatus.cancelled]))
    ).all()
    for t in overdue:
        exists = db.query(Notification).filter(
            and_(Notification.task_id == t.id,
                 Notification.notification_type == "overdue",
                 Notification.created_at >= now - timedelta(hours=2))
        ).first()
        if not exists:
            label = "cliente externo" if t.client_type == ClientType.external else "interno"
            _create_notification(db, t.id, "🚨 Tarea vencida",
                                 f"[{label}] {t.title} está vencida.", "overdue")
