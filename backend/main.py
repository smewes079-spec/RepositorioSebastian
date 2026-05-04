from fastapi import FastAPI, Depends, HTTPException
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
from models import (EmailConfig, Notification, WeeklyReport, Task,
                    TaskStatus, ClientRegistry)

Base.metadata.create_all(bind=engine)

app = FastAPI(title="TaskFlow Aduanero API", version="2.0.0")

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
    client_type: Optional[str] = None,
    category: Optional[str] = None,
    db: Session = Depends(get_db)
):
    return task_service.get_tasks(db, status, priority, client_type, category)


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


# ─── Dashboard ────────────────────────────────────────────────────────────────

@app.get("/api/dashboard", response_model=schemas.DashboardSummary)
def dashboard(db: Session = Depends(get_db)):
    return task_service.get_dashboard_summary(db)


# ─── Reports ─────────────────────────────────────────────────────────────────

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
def mark_read(notif_id: int, db: Session = Depends(get_db)):
    n = db.query(Notification).filter(Notification.id == notif_id).first()
    if not n:
        raise HTTPException(status_code=404)
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


# ─── Client Registry ─────────────────────────────────────────────────────────

@app.get("/api/clients", response_model=List[schemas.ClientRegistryResponse])
def list_clients(db: Session = Depends(get_db)):
    return db.query(ClientRegistry).all()


@app.post("/api/clients", response_model=schemas.ClientRegistryResponse, status_code=201)
def create_client(client: schemas.ClientRegistryCreate, db: Session = Depends(get_db)):
    db_client = ClientRegistry(**client.model_dump())
    db.add(db_client)
    db.commit()
    db.refresh(db_client)
    return db_client


@app.delete("/api/clients/{client_id}", status_code=204)
def delete_client(client_id: int, db: Session = Depends(get_db)):
    c = db.query(ClientRegistry).filter(ClientRegistry.id == client_id).first()
    if c:
        db.delete(c)
        db.commit()


# ─── Email Config & Sync ─────────────────────────────────────────────────────

@app.post("/api/email/config", response_model=schemas.EmailConfigResponse)
def save_email_config(config: schemas.EmailConfigCreate, db: Session = Depends(get_db)):
    service = email_svc.EmailService(
        config.email, config.password,
        config.imap_server, config.imap_port, config.use_ssl
    )
    if not service.test_connection():
        raise HTTPException(status_code=400,
                            detail="No se pudo conectar al servidor de correo. Verifica las credenciales.")

    password_b64 = base64.b64encode(config.password.encode()).decode()
    existing = db.query(EmailConfig).first()
    if existing:
        existing.email = config.email
        existing.imap_server = config.imap_server
        existing.imap_port = config.imap_port
        existing.use_ssl = config.use_ssl
        existing.password_encrypted = password_b64
        existing.internal_domains = config.internal_domains
        existing.vip_emails = config.vip_emails
        existing.is_active = True
        db.commit()
        db.refresh(existing)
        return existing

    db_config = EmailConfig(
        email=config.email, imap_server=config.imap_server,
        imap_port=config.imap_port, use_ssl=config.use_ssl,
        password_encrypted=password_b64,
        internal_domains=config.internal_domains,
        vip_emails=config.vip_emails,
    )
    db.add(db_config)
    db.commit()
    db.refresh(db_config)
    return db_config


@app.get("/api/email/config", response_model=Optional[schemas.EmailConfigResponse])
def get_email_config(db: Session = Depends(get_db)):
    return db.query(EmailConfig).first()


@app.post("/api/email/sync", response_model=schemas.SyncResult)
def sync_email(db: Session = Depends(get_db)):
    config = db.query(EmailConfig).filter(EmailConfig.is_active == True).first()
    if not config:
        raise HTTPException(status_code=400, detail="No hay configuración de correo activa")

    password = base64.b64decode(config.password_encrypted.encode()).decode()
    clients = [{"name": c.name, "email_domain": c.email_domain,
                "email_address": c.email_address, "client_type": c.client_type,
                "importance": c.importance}
               for c in db.query(ClientRegistry).all()]

    service = email_svc.EmailService(
        config.email, password, config.imap_server, config.imap_port, config.use_ssl,
        internal_domains=(config.internal_domains or "").split(","),
        vip_emails=(config.vip_emails or "").split(","),
        client_registry=clients,
    )

    errors = []
    new_count = 0
    ext_new = 0
    int_new = 0
    emails = []
    try:
        emails = service.fetch_task_emails(days_back=1)
        for em in emails:
            if db.query(Task).filter(Task.email_id == em["email_id"]).first():
                continue

            task_in = schemas.TaskCreate(
                title=em["title"],
                description=em.get("description"),
                is_urgent=em["is_urgent"],
                is_important=em["is_important"],
                client_type=em["client_type"],
                client_name=em.get("client_name"),
                client_importance=em["client_importance"],
                category=em["category"],
                due_date=em.get("due_date"),
                source="email",
            )
            t = task_service.create_task(db, task_in)
            t.email_id = em["email_id"]
            t.email_from = em["email_from"]
            t.email_subject = em.get("email_subject")
            db.commit()
            new_count += 1
            if em["client_type"] == "external":
                ext_new += 1
            else:
                int_new += 1

        config.last_sync = datetime.now()
        db.commit()
    except Exception as e:
        errors.append(str(e))

    return schemas.SyncResult(synced=len(emails), new_tasks=new_count,
                              external_new=ext_new, internal_new=int_new, errors=errors)


@app.delete("/api/email/config")
def delete_email_config(db: Session = Depends(get_db)):
    config = db.query(EmailConfig).first()
    if config:
        db.delete(config)
        db.commit()
    return {"ok": True}


@app.get("/api/health")
def health():
    return {"status": "ok", "timestamp": datetime.now().isoformat()}
