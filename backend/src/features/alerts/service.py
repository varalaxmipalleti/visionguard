import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import requests
import asyncio
import logging

from src.core.config import settings

logger = logging.getLogger(__name__)

class AlertService:
    def __init__(self):
        # In a real application, these would come from the database or environment variables
        self.smtp_server = "smtp.example.com"
        self.smtp_port = 587
        self.smtp_username = "alerts@visionguard.ai"
        self.smtp_password = "secure_password"
        
        self.telegram_bot_token = "YOUR_TELEGRAM_BOT_TOKEN"
        self.telegram_chat_id = "YOUR_CHAT_ID"
        
        self.email_enabled = False
        self.telegram_enabled = False
        
    def configure(self, email_enabled: bool, telegram_enabled: bool):
        self.email_enabled = email_enabled
        self.telegram_enabled = telegram_enabled

    def send_email_alert(self, subject: str, message: str, recipient: str):
        if not self.email_enabled:
            return
            
        try:
            msg = MIMEMultipart()
            msg['From'] = self.smtp_username
            msg['To'] = recipient
            msg['Subject'] = subject
            msg.attach(MIMEText(message, 'plain'))
            
            # Using a mock SMTP print for the demo to prevent hanging/errors on local test
            logger.info(f"[EMAIL MOCK] Sending email to {recipient}: {subject} - {message}")
            # server = smtplib.SMTP(self.smtp_server, self.smtp_port)
            # server.starttls()
            # server.login(self.smtp_username, self.smtp_password)
            # server.send_message(msg)
            # server.quit()
        except Exception as e:
            logger.error(f"Failed to send email alert: {e}")

    def send_telegram_alert(self, message: str):
        if not self.telegram_enabled:
            return
            
        try:
            url = f"https://api.telegram.org/bot{self.telegram_bot_token}/sendMessage"
            payload = {
                "chat_id": self.telegram_chat_id,
                "text": message
            }
            logger.info(f"[TELEGRAM MOCK] Sending payload: {payload}")
            # requests.post(url, json=payload)
        except Exception as e:
            logger.error(f"Failed to send Telegram alert: {e}")

    async def trigger_alert(self, alert_type: str, message: str, camera_name: str, recipient_email: str):
        """
        Main entrypoint for triggers (Motion, Intrusion, Camera Offline).
        Runs synchronously in a background thread for production via asyncio.to_thread if real network calls are made.
        """
        full_message = f"[{alert_type.upper()}] Camera '{camera_name}': {message}"
        
        # Dispatch notifications asynchronously
        await asyncio.to_thread(self.send_email_alert, f"VisionGuard Alert: {alert_type}", full_message, recipient_email)
        await asyncio.to_thread(self.send_telegram_alert, full_message)
        
        # Database persistence logic would go here (saving to alerts table)
        # e.g., await db.execute(insert(Alert).values(...))
        
        return {"status": "dispatched", "message": full_message}

# Global singleton
alert_service = AlertService()
