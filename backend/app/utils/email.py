import resend
import os


def send_verification_code(to_email: str, code: str) -> None:
    resend.api_key = os.getenv("RESEND_API_KEY", "")
    from_address = os.getenv("RESEND_FROM_EMAIL", "noreply@yourdomain.com")
    from_name = os.getenv("RESEND_FROM_NAME", "")
    from_field = f"{from_name} <{from_address}>" if from_name else from_address

    resend.Emails.send({
        "from": from_field,
        "to": [to_email],
        "subject": "Your verification code",
        "html": (
            "<div style='font-family:sans-serif;max-width:480px;margin:0 auto'>"
            "<h2 style='color:#4f46e5'>Verify your email</h2>"
            "<p>Enter the code below to complete your registration. "
            "It expires in <strong>10 minutes</strong>.</p>"
            f"<div style='font-size:40px;font-weight:bold;letter-spacing:12px;"
            f"text-align:center;padding:24px 0;color:#1e293b'>{code}</div>"
            "<p style='color:#64748b;font-size:13px'>"
            "If you did not request this, you can safely ignore this email.</p>"
            "</div>"
        ),
    })
