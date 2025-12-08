from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType
from app.config import settings
from pathlib import Path
from typing import List
import logging

logger = logging.getLogger(__name__)

conf = ConnectionConfig(
    MAIL_USERNAME=settings.MAIL_USERNAME,
    MAIL_PASSWORD=settings.MAIL_PASSWORD,
    MAIL_FROM=settings.MAIL_FROM,
    MAIL_PORT=settings.MAIL_PORT,
    MAIL_SERVER=settings.MAIL_SERVER,
    MAIL_STARTTLS=True,
    MAIL_SSL_TLS=False,
    USE_CREDENTIALS=True,
    VALIDATE_CERTS=True
)

async def send_scan_email(recipients: List[str], subject: str, body: str, attachments: List[str]):
    if not recipients: return

    message = MessageSchema(
        subject=subject,
        recipients=recipients,
        body=body,
        subtype=MessageType.html,
        attachments=[dict(file=f) for f in attachments if Path(f).exists()]
    )

    fm = FastMail(conf)
    try:
        await fm.send_message(message)
        logger.info(f"Email sent to {recipients}")
    except Exception as e:
        logger.error(f"Failed to send email: {e}")
