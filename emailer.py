import smtplib
from email.mime.text import MIMEText

SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587
EMAIL = "your_email@gmail.com"
PASSWORD = "your_app_password"  # Gmail App Password

def send_welcome_email(to_email: str):
    msg = MIMEText(
        "Welcome to Health AI!\n\nYour account has been created successfully."
    )
    msg["Subject"] = "Welcome to Health AI"
    msg["From"] = EMAIL
    msg["To"] = to_email

    with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
        server.starttls()
        server.login(EMAIL, PASSWORD)
        server.send_message(msg)
