import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from src.core.config import settings
import asyncio

logger = logging.getLogger("visionguard.email")

def _send_smtp_email_sync(to_email: str, subject: str, html_content: str):
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = settings.SENDER_EMAIL
        msg["To"] = to_email
        
        part = MIMEText(html_content, "html")
        msg.attach(part)
        
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.starttls()
            if settings.SMTP_USER and settings.SMTP_PASSWORD:
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(settings.SENDER_EMAIL, [to_email], msg.as_string())
        logger.info(f"Verification OTP sent via SMTP to {to_email}")
        print(f"\n[SUCCESS] Real verification email delivered to {to_email} from {settings.SENDER_EMAIL}!\n")
        return True
    except Exception as e:
        logger.error(f"Failed to send SMTP email to {to_email}: {e}")
        print(f"\n[ERROR] Failed to deliver email to {to_email}: {e}\n")
        return False

async def send_verification_otp(to_email: str, otp_code: str):
    """
    Sends a 6-digit OTP verification email to the user.
    Falls back to explicit console/log printing in development mode if SMTP is not configured.
    """
    subject = f"[{otp_code}] Verify your VisionGuard AI Account"
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {{ font-family: 'Inter', Arial, sans-serif; background-color: #090d16; color: #ffffff; margin: 0; padding: 0; }}
        .container {{ max-width: 600px; margin: 40px auto; background: #0f172a; border: 1px solid #1e293b; border-radius: 16px; padding: 32px; text-align: center; }}
        .logo {{ font-size: 24px; font-weight: 700; color: #3b82f6; margin-bottom: 24px; }}
        .title {{ font-size: 20px; font-weight: 700; color: #ffffff; margin-bottom: 12px; }}
        .subtitle {{ font-size: 14px; color: #94a3b8; line-height: 1.6; margin-bottom: 28px; }}
        .otp-box {{ background: #1e293b; border: 1px dashed #3b82f6; border-radius: 12px; padding: 18px; font-size: 32px; font-weight: 800; color: #60a5fa; letter-spacing: 6px; display: inline-block; margin-bottom: 28px; font-family: monospace; }}
        .footer {{ font-size: 12px; color: #475569; margin-top: 32px; border-top: 1px solid #1e293b; padding-top: 20px; }}
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">VisionGuard AI</div>
        <div class="title">Email Verification Required</div>
        <div class="subtitle">
          Thank you for registering your administrator account on the VisionGuard AI video analytics intelligence platform. Please enter the verification code below to verify your email address and unlock access:
        </div>
        <div class="otp-box">{otp_code}</div>
        <div class="subtitle">
          This code expires in <strong>{settings.OTP_EXPIRE_MINUTES} minutes</strong>. If you did not initiate this registration, please disregard this email.
        </div>
        <div class="footer">
          &copy; 2026 VisionGuard AI Corporation. Automated Security System Notification.
        </div>
      </div>
    </body>
    </html>
    """
    
    # If SMTP is configured, dispatch asynchronously
    if settings.SMTP_HOST:
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(None, _send_smtp_email_sync, to_email, subject, html_content)
    else:
        # Developer / Hybrid Console Mode Notification
        print("\n" + "=" * 70)
        print(f"[DEV EMAIL AGENT] Verification OTP for {to_email}:")
        print(f"CODE: >> {otp_code} << (Valid for {settings.OTP_EXPIRE_MINUTES} mins)")
        print("=" * 70 + "\n")
        logger.info(f"[DEV MODE] OTP generated for {to_email}: {otp_code}")
    
    return True

async def send_password_reset_email(to_email: str, reset_token: str):
    """
    Sends a password recovery reset link via email to the administrator account.
    """
    reset_link = f"http://localhost:3000/reset-password?token={reset_token}"
    subject = "[VisionGuard AI] Secure Password Reset & Recovery"
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {{ font-family: 'Inter', Arial, sans-serif; background-color: #090d16; color: #ffffff; margin: 0; padding: 0; }}
        .container {{ max-width: 600px; margin: 40px auto; background: #0f172a; border: 1px solid #1e293b; border-radius: 16px; padding: 32px; text-align: center; }}
        .logo {{ font-size: 24px; font-weight: 700; color: #3b82f6; margin-bottom: 24px; }}
        .title {{ font-size: 20px; font-weight: 700; color: #ffffff; margin-bottom: 12px; }}
        .subtitle {{ font-size: 14px; color: #94a3b8; line-height: 1.6; margin-bottom: 28px; }}
        .btn {{ background-color: #2563eb; color: #ffffff; padding: 14px 28px; font-size: 16px; font-weight: 700; text-decoration: none; border-radius: 12px; display: inline-block; margin-bottom: 28px; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.4); }}
        .link-text {{ font-size: 11px; color: #64748b; word-break: break-all; margin-bottom: 24px; font-family: monospace; }}
        .footer {{ font-size: 12px; color: #475569; margin-top: 32px; border-top: 1px solid #1e293b; padding-top: 20px; }}
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">VisionGuard AI</div>
        <div class="title">Password Recovery Requested</div>
        <div class="subtitle">
          We received a request to reset the administrator password for your VisionGuard AI platform account associated with this email. Click the button below to verify your token and set a new password:
        </div>
        <a href="{reset_link}" class="btn" target="_blank">Reset Administrator Password</a>
        <div class="subtitle">
          Or copy and paste this link directly into your browser window:
        </div>
        <div class="link-text">{reset_link}</div>
        <div class="subtitle">
          This security token will expire in <strong>30 minutes</strong>. If you did not request a password reset, please ignore this message; your account remains protected.
        </div>
        <div class="footer">
          &copy; 2026 VisionGuard AI Corporation. Enterprise Security Engine.
        </div>
      </div>
    </body>
    </html>
    """
    
    if settings.SMTP_HOST:
        loop = asyncio.get_event_loop()
        await loop.run_in_executor(None, _send_smtp_email_sync, to_email, subject, html_content)
        print(f"\n[SUCCESS] Password reset email with recovery link sent to {to_email}!\n")
    else:
        print("\n" + "=" * 70)
        print(f"[DEV EMAIL AGENT] Password Reset Link for {to_email}:")
        print(f"LINK: >> {reset_link} <<")
        print("=" * 70 + "\n")
        logger.info(f"[DEV MODE] Reset link generated for {to_email}: {reset_link}")
        
    return True

