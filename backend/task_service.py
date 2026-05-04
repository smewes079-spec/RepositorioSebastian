from sqlalchemy.orm import Session
from sqlalchemy import and_, func
from datetime import datetime, timedelta
from typing import List, Optional
import json

from models import Task, Notification, PriorityLevel, TaskStatus, TaskSource, WeeklyReport
from schemas import TaskCreate, TaskUpdate, DailySummary, TaskResponse


def compute_priority(is_urgent: bool, is_important: bool) -> PriorityLevel:
    if is_urgent and is_important:
        return PriorityLevel.critical
    if not is_urgent and is_important:
        return PriorityLevel.important
    if is_urgent and not is_important:
        return PriorityLevel.urgent
    return PriorityLevel.low


def create_task(db: Session, task_in: TaskCreate) -> Task:
    priority = compute_priority(task_in.is_urgent, task_in.is_important)
    db_task = Task(
        title=task_in.title,
        description=task_in.description,
        priority=priority,
        is_urgent=task_in.is_urgent,
        is_important=task_in.is_important,
        due_date=task_in.due_date,
        reminder_at=task_in.reminder_at,
        tags=task_in.tags,
        estimated_minutes=task_in.estimated_minutes,
        source=task_in.source,
    )
    db.add(db_task)
    db.commit()
    db.refresh(db_task)

    if task_in.reminder_at:
        _create_notification(db, db_task.id, "Recordatorio programado",
                             f"Tienes un recordatorio para: {db_task.title}", "reminder")
    return db_task


def update_task(db: Session, task_id: int, task_update: TaskUpdate) -> Optional[Task]:
    db_task = db.query(Task).filter(Task.id == task_id).first()
    if not db_task:
        return None

    update_data = task_update.model_dump(exclude_unset=True)

    if "is_urgent" in update_data or "is_important" in update_data:
        is_urgent = update_data.get("is_urgent", db_task.is_urgent)
        is_important = update_data.get("is_important", db_task.is_important)
        update_data["priority"] = compute_priority(is_urgent, is_important)

    if update_data.get("status") == TaskStatus.completed and db_task.status != TaskStatus.completed:
        update_data["completed_at"] = datetime.now()
        update_data["progress"] = 100
        _create_notification(db, task_id, "Tarea completada",
                             f"Completaste: {db_task.title}", "success")

    for key, value in update_data.items():
        setattr(db_task, key, value)

    db.commit()
    db.refresh(db_task)
    return db_task


def get_tasks(db: Session, status: Optional[str] = None,
              priority: Optional[str] = None, date: Optional[str] = None) -> List[Task]:
    query = db.query(Task)
    if status:
        query = query.filter(Task.status == status)
    if priority:
        query = query.filter(Task.priority == priority)
    if date:
        try:
            target = datetime.strptime(date, "%Y-%m-%d")
            query = query.filter(
                and_(Task.created_at >= target,
                     Task.created_at < target + timedelta(days=1))
            )
        except ValueError:
            pass

    priority_order = {
        PriorityLevel.critical: 0,
        PriorityLevel.important: 1,
        PriorityLevel.urgent: 2,
        PriorityLevel.low: 3,
    }

    tasks = query.filter(Task.status != TaskStatus.cancelled).all()
    tasks.sort(key=lambda t: (priority_order.get(t.priority, 99),
                              t.due_date or datetime.max))
    return tasks


def get_daily_summary(db: Session) -> DailySummary:
    today = datetime.now().date()
    today_start = datetime.combine(today, datetime.min.time())
    today_end = datetime.combine(today, datetime.max.time())

    all_tasks = db.query(Task).filter(Task.status != TaskStatus.cancelled).all()

    today_tasks = [t for t in all_tasks
                   if (t.due_date and today_start <= t.due_date <= today_end)
                   or (t.created_at and today_start <= t.created_at <= today_end)]

    if not today_tasks:
        today_tasks = all_tasks

    completed = sum(1 for t in today_tasks if t.status == TaskStatus.completed)
    in_progress = sum(1 for t in today_tasks if t.status == TaskStatus.in_progress)
    pending = sum(1 for t in today_tasks if t.status == TaskStatus.pending)

    overdue = sum(1 for t in all_tasks
                  if t.due_date and t.due_date < datetime.now()
                  and t.status not in [TaskStatus.completed, TaskStatus.cancelled])

    rate = (completed / len(today_tasks) * 100) if today_tasks else 0

    return DailySummary(
        date=today.isoformat(),
        total_tasks=len(today_tasks),
        completed=completed,
        in_progress=in_progress,
        pending=pending,
        critical_tasks=[t for t in today_tasks if t.priority == PriorityLevel.critical],
        important_tasks=[t for t in today_tasks if t.priority == PriorityLevel.important],
        urgent_tasks=[t for t in today_tasks if t.priority == PriorityLevel.urgent],
        completion_rate=round(rate, 1),
        overdue_tasks=overdue,
    )


def generate_weekly_report(db: Session) -> WeeklyReport:
    today = datetime.now()
    week_start = today - timedelta(days=today.weekday())
    week_start = week_start.replace(hour=0, minute=0, second=0, microsecond=0)
    week_end = week_start + timedelta(days=6, hours=23, minutes=59, seconds=59)

    tasks = db.query(Task).filter(
        and_(Task.created_at >= week_start, Task.created_at <= week_end)
    ).all()

    total = len(tasks)
    completed = [t for t in tasks if t.status == TaskStatus.completed]
    rate = (len(completed) / total * 100) if total else 0

    completion_times = []
    for t in completed:
        if t.completed_at and t.created_at:
            delta = (t.completed_at - t.created_at).total_seconds() / 60
            completion_times.append(delta)
    avg_time = sum(completion_times) / len(completion_times) if completion_times else 0

    days_count = {}
    for t in completed:
        if t.completed_at:
            day = t.completed_at.strftime("%A")
            days_count[day] = days_count.get(day, 0) + 1
    productive_day = max(days_count, key=days_count.get) if days_count else None

    suggestions = _generate_suggestions(total, rate, avg_time, tasks)

    report_data = json.dumps({
        "by_priority": {
            "critical": sum(1 for t in tasks if t.priority == PriorityLevel.critical),
            "important": sum(1 for t in tasks if t.priority == PriorityLevel.important),
            "urgent": sum(1 for t in tasks if t.priority == PriorityLevel.urgent),
            "low": sum(1 for t in tasks if t.priority == PriorityLevel.low),
        },
        "by_status": {
            "completed": len(completed),
            "in_progress": sum(1 for t in tasks if t.status == TaskStatus.in_progress),
            "pending": sum(1 for t in tasks if t.status == TaskStatus.pending),
        },
        "by_source": {
            "manual": sum(1 for t in tasks if t.source == TaskSource.manual),
            "email": sum(1 for t in tasks if t.source == TaskSource.email),
        },
        "days_productivity": days_count,
    })

    existing = db.query(WeeklyReport).filter(
        and_(WeeklyReport.week_start >= week_start,
             WeeklyReport.week_start < week_start + timedelta(days=1))
    ).first()

    if existing:
        existing.total_tasks = total
        existing.completed_tasks = len(completed)
        existing.completion_rate = round(rate, 1)
        existing.avg_completion_time = round(avg_time, 1)
        existing.most_productive_day = productive_day
        existing.suggestions = suggestions
        existing.report_data = report_data
        db.commit()
        db.refresh(existing)
        return existing

    report = WeeklyReport(
        week_start=week_start,
        week_end=week_end,
        total_tasks=total,
        completed_tasks=len(completed),
        completion_rate=round(rate, 1),
        avg_completion_time=round(avg_time, 1),
        most_productive_day=productive_day,
        suggestions=suggestions,
        report_data=report_data,
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    return report


def _generate_suggestions(total: int, rate: float, avg_time: float, tasks: list) -> str:
    suggestions = []

    if rate < 50:
        suggestions.append("Tu tasa de completado es baja. Considera reducir el número de tareas diarias y enfocarte en las más críticas.")
    elif rate >= 80:
        suggestions.append("Excelente tasa de completado. Mantén el ritmo y considera asumir tareas más desafiantes.")

    critical = sum(1 for t in tasks if t.priority == PriorityLevel.critical)
    if critical > 5:
        suggestions.append(f"Tienes {critical} tareas críticas. Revisa si todas son realmente urgentes e importantes, o si puedes delegar algunas.")

    if avg_time > 120:
        suggestions.append("El tiempo promedio de completado es alto. Intenta descomponer tareas grandes en subtareas más pequeñas.")
    elif avg_time > 0 and avg_time < 10:
        suggestions.append("Completas tareas muy rápidamente. Asegúrate de que la calidad sea la adecuada.")

    low_tasks = sum(1 for t in tasks if t.priority == PriorityLevel.low)
    if low_tasks > total * 0.5 and total > 0:
        suggestions.append("Más del 50% de tus tareas son de baja prioridad. Evalúa si vale la pena mantenerlas o eliminarlas.")

    if not suggestions:
        suggestions.append("Buen trabajo esta semana. Sigue priorizando con la matriz de urgencia e importancia.")

    return " | ".join(suggestions)


def _create_notification(db: Session, task_id: int, title: str,
                         message: str, notif_type: str):
    notif = Notification(
        task_id=task_id,
        title=title,
        message=message,
        notification_type=notif_type,
    )
    db.add(notif)
    db.commit()


def check_reminders(db: Session):
    now = datetime.now()
    window_start = now - timedelta(minutes=1)
    window_end = now + timedelta(minutes=1)

    tasks_with_reminders = db.query(Task).filter(
        and_(
            Task.reminder_at >= window_start,
            Task.reminder_at <= window_end,
            Task.status.notin_([TaskStatus.completed, TaskStatus.cancelled])
        )
    ).all()

    for task in tasks_with_reminders:
        _create_notification(db, task.id, "Recordatorio de tarea",
                             f"Es hora de: {task.title}", "reminder")

    overdue_tasks = db.query(Task).filter(
        and_(
            Task.due_date < now,
            Task.status.notin_([TaskStatus.completed, TaskStatus.cancelled])
        )
    ).all()

    for task in overdue_tasks:
        existing = db.query(Notification).filter(
            and_(Notification.task_id == task.id,
                 Notification.notification_type == "overdue",
                 Notification.created_at >= now - timedelta(hours=1))
        ).first()
        if not existing:
            _create_notification(db, task.id, "Tarea vencida",
                                 f"La tarea '{task.title}' está vencida.", "overdue")
