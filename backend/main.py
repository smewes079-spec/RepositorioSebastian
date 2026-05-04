from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import base64

from database import engine, get_db, Base
import models
import schemas
import task_service
import email_service as email_svc
from models import EmailConfig, Notification, WeeklyReport, Task, TaskStatus

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Task Manager API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Tasks ────────────────────────────────────────────────────────────────────

@app.get("/api/tasks", response_model=List[schemas.TaskResponse])
def list_tasks(
    status: Optional[str] = None,
    priority: Optional[str] = None,
    date: Optional[str] = None,
    db: Session = Depends(get_db)
):
    return task_service.get_tasks(db, status, priority, date)


@app.post("/api/tasks", response_model=schemas.TaskResponse, status_code=201)
def create_task(task: schemas.TaskCreate, db: Session = Depends(get_db)):
    return task_service.create_task(db, task)


@app.get("/api/tasks/{task_id}", response_model=schemas.TaskResponse)
def get_task(task_id: int, db: Session = Depends(get_db)):
    t = db.query(Task).filter(Task.id == task_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Tarea no encontrada")
    return t


@app.patch("/api/tasks/{task_id}", response_model=schemas.TaskResponse)
def update_task(task_id: int, task_update: schemas.TaskUpdate, db: Session = Depends(get_db)):
    t = task_service.update_task(db, task_id, task_update)
    if not t:
        raise HTTPException(status_code=404, detail="Tarea no encontrada")
    return t


@app.delete("/api/tasks/{task_id}", status_code=204)
def delete_task(task_id: int, db: Session = Depends(get_db)):
    t = db.query(Task).filter(Task.id == task_id).first()
    if not t:
        raise HTTPException(status_code=404, detail="Tarea no encontrada")
    t.status = TaskStatus.cancelled
    db.commit()


# ─── Summary & Reports ────────────────────────────────────────────────────────

@app.get("/api/summary/daily", response_model=schemas.DailySummary)
def daily_summary(db: Session = Depends(get_db)):
    return task_service.get_daily_summary(db)


@app.get("/api/reports/weekly", response_model=schemas.WeeklyReportResponse)
def weekly_report(db: Session = Depends(get_db)):
    return task_service.generate_weekly_report(db)


@app.get("/api/reports/history", response_model=List[schemas.WeeklyReportResponse])
def report_history(db: Session = Depends(get_db)):
    return db.query(WeeklyReport).order_by(WeeklyReport.week_start.desc()).limit(12).all()


# ─── Notifications ────────────────────────────────────────────────────────────

@app.get("/api/notifications", response_model=List[schemas.NotificationResponse])
def list_notifications(unread_only: bool = False, db: Session = Depends(get_db)):
    query = db.query(Notification)
    if unread_only:
        query = query.filter(Notification.is_read == False)
    return query.order_by(Notification.created_at.desc()).limit(50).all()


@app.patch("/api/notifications/{notif_id}/read")
def mark_notification_read(notif_id: int, db: Session = Depends(get_db)):
    n = db.query(Notification).filter(Notification.id == notif_id).first()
    if not n:
        raise HTTPException(status_code=404, detail="Notificación no encontrada")
    n.is_read = True
    db.commit()
    return {"ok": True}


@app.patch("/api/notifications/read-all")
def mark_all_read(db: Session = Depends(get_db)):
    db.query(Notification).filter(Notification.is_read == False).update({"is_read": True})
    db.commit()
    return {"ok": True}


@app.post("/api/notifications/check-reminders")
def check_reminders(db: Session = Depends(get_db)):
    task_service.check_reminders(db)
    return {"ok": True}


# ─── Email Config ─────────────────────────────────────────────────────────────

@app.post("/api/email/config", response_model=schemas.EmailConfigResponse)
def save_email_config(config: schemas.EmailConfigCreate, db: Session = Depends(get_db)):
    service = email_svc.EmailService(
        config.email, config.password,
        config.imap_server, config.imap_port, config.use_ssl
    )
    if not service.test_connection():
        raise HTTPException(status_code=400, detail="No se pudo conectar al servidor de correo. Verifica las credenciales.")

    password_b64 = base64.b64encode(config.password.encode()).decode()

    existing = db.query(EmailConfig).first()
    if existing:
        existing.email = config.email
        existing.imap_server = config.imap_server
        existing.imap_port = config.imap_port
        existing.use_ssl = config.use_ssl
        existing.password_encrypted = password_b64
        existing.is_active = True
        db.commit()
        db.refresh(existing)
        return existing

    db_config = EmailConfig(
        email=config.email,
        imap_server=config.imap_server,
        imap_port=config.imap_port,
        use_ssl=config.use_ssl,
        password_encrypted=password_b64,
    )
    db.add(db_config)
    db.commit()
    db.refresh(db_config)
    return db_config


@app.get("/api/email/config", response_model=Optional[schemas.EmailConfigResponse])
def get_email_config(db: Session = Depends(get_db)):
    return db.query(EmailConfig).first()


@app.post("/api/email/sync", response_model=schemas.SyncResult)
def sync_email(background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    config = db.query(EmailConfig).filter(EmailConfig.is_active == True).first()
    if not config:
        raise HTTPException(status_code=400, detail="No hay configuración de correo activa")

    password = base64.b64decode(config.password_encrypted.encode()).decode()
    service = email_svc.EmailService(
        config.email, password,
        config.imap_server, config.imap_port, config.use_ssl
    )

    errors = []
    new_count = 0
    try:
        emails = service.fetch_task_emails(days_back=1)
        for em in emails:
            existing = db.query(Task).filter(Task.email_id == em["email_id"]).first()
            if existing:
                continue
            from schemas import TaskCreate
            from models import TaskSource
            task_in = TaskCreate(
                title=em["title"],
                description=em.get("description"),
                is_urgent=em["is_urgent"],
                is_important=em["is_important"],
                due_date=em.get("due_date"),
                source=TaskSource.email,
            )
            t = task_service.create_task(db, task_in)
            t.email_id = em["email_id"]
            t.email_from = em["email_from"]
            db.commit()
            new_count += 1
        config.last_sync = datetime.now()
        db.commit()
    except Exception as e:
        errors.append(str(e))

    return schemas.SyncResult(synced=len(emails) if not errors else 0,
                              new_tasks=new_count, errors=errors)


@app.delete("/api/email/config")
def delete_email_config(db: Session = Depends(get_db)):
    config = db.query(EmailConfig).first()
    if config:
        db.delete(config)
        db.commit()
    return {"ok": True}


# ─── Health ───────────────────────────────────────────────────────────────────

@app.get("/api/health")
def health():
    return {"status": "ok", "timestamp": datetime.now().isoformat()}
