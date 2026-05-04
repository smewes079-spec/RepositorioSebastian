import imaplib
import email
from email.header import decode_header
from datetime import datetime, timedelta
from typing import List, Dict, Optional
from bs4 import BeautifulSoup
import re


# ── Palabras clave específicas agencia aduanera ───────────────────────────────

CUSTOMS_TASK_KEYWORDS = [
    # Operaciones aduaneras
    "despacho", "liberación", "aforo", "afore", "reconocimiento", "canal",
    "declaración", "dai", "dus", "manifiesto", "bulto", "carga", "mercancía",
    "aduana", "aduanero", "sag", "sernapesca", "ism", "resolución",
    "levante", "retiro", "almacén", "depósito", "zona franca",
    "clasificación arancelaria", "arancel", "partida", "subpartida",
    "impuesto", "iva", "derecho", "sobretasa", "drawback",
    "bl", "awb", "mbl", "hbl", "guía", "conocimiento embarque",
    "factura", "packing list", "certificado origen",
    # Gestión comercial
    "cotización", "cotizar", "presupuesto", "tarifa", "precio",
    "solicitud", "urgente", "asap", "necesito", "requiero", "ayuda",
    "reunión", "meeting", "llamada", "revisión", "pendiente",
    "cliente", "importación", "exportación", "tránsito",
    # Genéricas
    "tarea", "hacer", "recordar", "deadline", "entrega", "enviar",
    "revisar", "completar", "gestionar", "coordinar",
]

URGENT_KEYWORDS = [
    "urgente", "urgent", "asap", "inmediato", "hoy", "today",
    "crítico", "bloqueado", "parado", "detenido", "retrasado",
    "multa", "sanción", "vencimiento", "vence hoy", "plazo",
    "inspector", "fiscalización", "requerimiento",
]

IMPORTANT_KEYWORDS = [
    "importante", "important", "prioridad", "priority",
    "cliente vip", "cliente especial", "cuenta clave",
    "gran volumen", "millones", "urgencia", "crítico",
]

# Categorías específicas por palabras clave
CATEGORY_KEYWORDS = {
    "despacho": ["despacho", "liberación", "levante", "retiro", "aforo", "canal", "reconocimiento", "bulto"],
    "documentacion": ["dai", "dus", "manifiesto", "declaración", "bl", "awb", "factura", "packing", "certificado", "documento"],
    "clasificacion": ["clasificación", "arancelaria", "arancel", "partida", "subpartida", "hts", "ncm"],
    "pago": ["pago", "impuesto", "derecho", "iva", "sobretasa", "drawback", "reembolso", "cobro", "facturar"],
    "fiscalizacion": ["fiscalización", "auditoría", "inspector", "sag", "sernapesca", "requerimiento", "multa", "sanción"],
    "cotizacion": ["cotización", "cotizar", "presupuesto", "tarifa", "precio", "propuesta"],
    "coordinacion": ["coordinación", "coordinar", "gestionar", "operaciones", "logística", "transporte"],
    "reunion": ["reunión", "meeting", "llamada", "videoconferencia", "cita", "agenda"],
    "reporte": ["reporte", "informe", "reporte", "estadística", "análisis", "resumen"],
}


def decode_str(s) -> str:
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
            result += str(part)
    return result.strip()


def extract_text(msg) -> str:
    text = ""
    if msg.is_multipart():
        for part in msg.walk():
            ct = part.get_content_type()
            if ct == "text/plain":
                payload = part.get_payload(decode=True)
                if payload:
                    text += payload.decode(errors="replace")
            elif ct == "text/html" and not text:
                payload = part.get_payload(decode=True)
                if payload:
                    soup = BeautifulSoup(payload.decode(errors="replace"), "lxml")
                    text += soup.get_text(separator=" ")
    else:
        payload = msg.get_payload(decode=True)
        if payload:
            if msg.get_content_type() == "text/html":
                soup = BeautifulSoup(payload.decode(errors="replace"), "lxml")
                text = soup.get_text(separator=" ")
            else:
                text = payload.decode(errors="replace")
    return text[:3000]


def is_task_related(subject: str, body: str) -> bool:
    combined = (subject + " " + body).lower()
    return any(kw in combined for kw in CUSTOMS_TASK_KEYWORDS)


def detect_urgency(subject: str, body: str) -> bool:
    combined = (subject + " " + body).lower()
    return any(kw in combined for kw in URGENT_KEYWORDS)


def detect_importance(subject: str, body: str) -> bool:
    combined = (subject + " " + body).lower()
    return any(kw in combined for kw in IMPORTANT_KEYWORDS)


def detect_category(subject: str, body: str) -> str:
    combined = (subject + " " + body).lower()
    for category, keywords in CATEGORY_KEYWORDS.items():
        if any(kw in combined for kw in keywords):
            return category
    return "otro"


def classify_client(sender_email: str, internal_domains: List[str],
                    vip_emails: List[str], client_registry: List[dict]) -> dict:
    """Determina si el remitente es cliente externo, interno, y su importancia."""
    email_lower = sender_email.lower()
    domain = email_lower.split("@")[-1] if "@" in email_lower else ""

    # Verificar en registro de clientes
    for client in client_registry:
        if (client.get("email_address") and client["email_address"].lower() in email_lower) or \
           (client.get("email_domain") and client["email_domain"].lower() == domain):
            return {
                "client_type": client["client_type"],
                "client_importance": client["importance"],
                "client_name": client["name"],
            }

    # Verificar dominios internos
    for internal_domain in internal_domains:
        if internal_domain.strip().lower() in domain:
            return {
                "client_type": "internal",
                "client_importance": "interno",
                "client_name": None,
            }

    # Verificar VIP
    for vip in vip_emails:
        if vip.strip().lower() in email_lower:
            return {
                "client_type": "external",
                "client_importance": "vip",
                "client_name": None,
            }

    # Por defecto: cliente externo regular
    return {
        "client_type": "external",
        "client_importance": "regular",
        "client_name": None,
    }


def compute_email_priority_score(is_urgent: bool, is_important: bool,
                                  client_type: str, client_importance: str) -> int:
    """Score 0-100 para ranking de correos por prioridad."""
    score = 0
    # Tipo de cliente
    if client_type == "external":
        score += 50
        if client_importance == "vip":
            score += 30
        elif client_importance == "regular":
            score += 15
    else:
        score += 10

    # Urgencia / importancia
    if is_urgent:
        score += 15
    if is_important:
        score += 5

    return min(score, 100)


def extract_due_date(body: str) -> Optional[datetime]:
    patterns = [
        r'\b(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})\b',
        r'(para el|antes del|deadline|entrega|vence)\s+(\d{1,2})[/-](\d{1,2})',
    ]
    for pattern in patterns:
        match = re.search(pattern, body, re.IGNORECASE)
        if match:
            try:
                groups = [g for g in match.groups() if g and g.isdigit()]
                if len(groups) >= 3:
                    day, month, year = int(groups[-3]), int(groups[-2]), int(groups[-1])
                    if year < 100:
                        year += 2000
                    if 1 <= month <= 12 and 1 <= day <= 31:
                        return datetime(year, month, day)
            except (ValueError, IndexError):
                pass
    return None


class EmailService:
    def __init__(self, email_addr: str, password: str, imap_server: str,
                 imap_port: int = 993, use_ssl: bool = True,
                 internal_domains: List[str] = None,
                 vip_emails: List[str] = None,
                 client_registry: List[dict] = None):
        self.email_addr = email_addr
        self.password = password
        self.imap_server = imap_server
        self.imap_port = imap_port
        self.use_ssl = use_ssl
        self.internal_domains = internal_domains or []
        self.vip_emails = vip_emails or []
        self.client_registry = client_registry or []

    def connect(self):
        if self.use_ssl:
            mail = imaplib.IMAP4_SSL(self.imap_server, self.imap_port)
        else:
            mail = imaplib.IMAP4(self.imap_server, self.imap_port)
        mail.login(self.email_addr, self.password)
        return mail

    def fetch_task_emails(self, days_back: int = 1) -> List[Dict]:
        results = []
        try:
            mail = self.connect()
            mail.select("INBOX")
            since_date = (datetime.now() - timedelta(days=days_back)).strftime("%d-%b-%Y")
            _, message_numbers = mail.search(None, f'(SINCE "{since_date}")')

            if not message_numbers[0]:
                mail.logout()
                return results

            for num in message_numbers[0].split()[-100:]:
                try:
                    _, msg_data = mail.fetch(num, "(RFC822)")
                    msg = email.message_from_bytes(msg_data[0][1])

                    subject = decode_str(msg.get("Subject", ""))
                    sender = decode_str(msg.get("From", ""))
                    msg_id = msg.get("Message-ID", str(num))
                    body = extract_text(msg)

                    if not is_task_related(subject, body):
                        continue

                    try:
                        from email.utils import parsedate_to_datetime
                        received_at = parsedate_to_datetime(msg.get("Date", ""))
                    except Exception:
                        received_at = datetime.now()

                    is_urgent = detect_urgency(subject, body)
                    is_important = detect_importance(subject, body)
                    category = detect_category(subject, body)

                    sender_email = sender
                    if "<" in sender:
                        sender_email = sender.split("<")[-1].strip(">")

                    client_info = classify_client(
                        sender_email, self.internal_domains,
                        self.vip_emails, self.client_registry
                    )

                    priority_score = compute_email_priority_score(
                        is_urgent, is_important,
                        client_info["client_type"],
                        client_info["client_importance"]
                    )

                    results.append({
                        "title": subject[:200] if subject else "Solicitud sin asunto",
                        "description": body[:500],
                        "email_id": msg_id,
                        "email_from": sender,
                        "email_subject": subject,
                        "is_urgent": is_urgent,
                        "is_important": is_important,
                        "category": category,
                        "client_type": client_info["client_type"],
                        "client_importance": client_info["client_importance"],
                        "client_name": client_info["client_name"],
                        "due_date": extract_due_date(body),
                        "received_at": received_at,
                        "priority_score": priority_score,
                    })
                except Exception:
                    continue

            mail.logout()
            # Ordenar por score descendente
            results.sort(key=lambda x: x["priority_score"], reverse=True)
        except Exception as e:
            raise RuntimeError(f"Error conectando al correo: {str(e)}")

        return results

    def test_connection(self) -> bool:
        try:
            mail = self.connect()
            mail.logout()
            return True
        except Exception:
            return False
