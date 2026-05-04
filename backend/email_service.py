import imaplib
import email
from email.header import decode_header
from datetime import datetime, timedelta
from typing import List, Dict, Optional
from bs4 import BeautifulSoup
import re


TASK_KEYWORDS = [
    "pendiente", "tarea", "hacer", "recordar", "deadline", "entrega",
    "reunión", "meeting", "review", "revisar", "completar", "enviar",
    "task", "todo", "action", "follow up", "seguimiento", "importante",
    "urgente", "urgent", "asap", "prioridad", "priority"
]

URGENT_KEYWORDS = ["urgente", "urgent", "asap", "inmediato", "hoy", "today", "crítico"]
IMPORTANT_KEYWORDS = ["importante", "important", "prioridad", "priority", "esencial", "critical"]


def decode_str(s):
    if s is None:
        return ""
    decoded = decode_header(s)
    result = ""
    for part, charset in decoded:
        if isinstance(part, bytes):
            try:
                result += part.decode(charset or "utf-8", errors="replace")
            except Exception:
                result += part.decode("utf-8", errors="replace")
        else:
            result += part
    return result


def extract_text_from_email(msg) -> str:
    text = ""
    if msg.is_multipart():
        for part in msg.walk():
            content_type = part.get_content_type()
            if content_type == "text/plain":
                payload = part.get_payload(decode=True)
                if payload:
                    text += payload.decode(errors="replace")
            elif content_type == "text/html" and not text:
                payload = part.get_payload(decode=True)
                if payload:
                    soup = BeautifulSoup(payload.decode(errors="replace"), "lxml")
                    text += soup.get_text(separator=" ")
    else:
        payload = msg.get_payload(decode=True)
        if payload:
            content_type = msg.get_content_type()
            if content_type == "text/html":
                soup = BeautifulSoup(payload.decode(errors="replace"), "lxml")
                text = soup.get_text(separator=" ")
            else:
                text = payload.decode(errors="replace")
    return text[:2000]


def is_task_related(subject: str, body: str) -> bool:
    combined = (subject + " " + body).lower()
    return any(kw in combined for kw in TASK_KEYWORDS)


def detect_urgency(subject: str, body: str) -> bool:
    combined = (subject + " " + body).lower()
    return any(kw in combined for kw in URGENT_KEYWORDS)


def detect_importance(subject: str, body: str) -> bool:
    combined = (subject + " " + body).lower()
    return any(kw in combined for kw in IMPORTANT_KEYWORDS)


def extract_due_date(body: str) -> Optional[datetime]:
    patterns = [
        r'\b(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})\b',
        r'\b(para el|before|deadline|entrega)\s+(\d{1,2})[/-](\d{1,2})',
    ]
    for pattern in patterns:
        match = re.search(pattern, body, re.IGNORECASE)
        if match:
            try:
                groups = match.groups()
                if len(groups) == 3:
                    day, month, year = int(groups[0]), int(groups[1]), int(groups[2])
                    if year < 100:
                        year += 2000
                    return datetime(year, month, day)
            except (ValueError, IndexError):
                pass
    return None


class EmailService:
    def __init__(self, email_addr: str, password: str, imap_server: str,
                 imap_port: int = 993, use_ssl: bool = True):
        self.email_addr = email_addr
        self.password = password
        self.imap_server = imap_server
        self.imap_port = imap_port
        self.use_ssl = use_ssl

    def connect(self):
        if self.use_ssl:
            mail = imaplib.IMAP4_SSL(self.imap_server, self.imap_port)
        else:
            mail = imaplib.IMAP4(self.imap_server, self.imap_port)
        mail.login(self.email_addr, self.password)
        return mail

    def fetch_task_emails(self, days_back: int = 1) -> List[Dict]:
        tasks = []
        try:
            mail = self.connect()
            mail.select("INBOX")

            since_date = (datetime.now() - timedelta(days=days_back)).strftime("%d-%b-%Y")
            _, message_numbers = mail.search(None, f'(SINCE "{since_date}")')

            if not message_numbers[0]:
                mail.logout()
                return tasks

            for num in message_numbers[0].split()[-50:]:  # max 50 emails
                try:
                    _, msg_data = mail.fetch(num, "(RFC822)")
                    msg = email.message_from_bytes(msg_data[0][1])

                    subject = decode_str(msg.get("Subject", ""))
                    sender = decode_str(msg.get("From", ""))
                    msg_id = msg.get("Message-ID", str(num))
                    body = extract_text_from_email(msg)

                    if not is_task_related(subject, body):
                        continue

                    date_str = msg.get("Date", "")
                    try:
                        from email.utils import parsedate_to_datetime
                        received_at = parsedate_to_datetime(date_str)
                    except Exception:
                        received_at = datetime.now()

                    tasks.append({
                        "title": subject[:200] if subject else "Tarea sin asunto",
                        "description": body[:500],
                        "email_id": msg_id,
                        "email_from": sender,
                        "is_urgent": detect_urgency(subject, body),
                        "is_important": detect_importance(subject, body),
                        "due_date": extract_due_date(body),
                        "received_at": received_at,
                    })
                except Exception:
                    continue

            mail.logout()
        except Exception as e:
            raise RuntimeError(f"Error conectando al correo: {str(e)}")

        return tasks

    def test_connection(self) -> bool:
        try:
            mail = self.connect()
            mail.logout()
            return True
        except Exception:
            return False
