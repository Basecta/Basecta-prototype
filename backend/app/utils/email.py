import resend
import os


def _resend_config() -> tuple[str, str]:
    resend.api_key = os.getenv("RESEND_API_KEY", "")
    from_address = os.getenv("RESEND_FROM_EMAIL", "noreply@yourdomain.com")
    from_name = os.getenv("RESEND_FROM_NAME", "")
    from_field = f"{from_name} <{from_address}>" if from_name else from_address
    return resend.api_key, from_field


def send_verification_code(to_email: str, code: str) -> None:
    _, from_field = _resend_config()

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


def send_password_reset_email(to_email: str, reset_link: str) -> None:
    _, from_field = _resend_config()

    resend.Emails.send({
        "from": from_field,
        "to": [to_email],
        "subject": "Reset your password",
        "html": (
            "<div style='font-family:sans-serif;max-width:480px;margin:0 auto'>"
            "<h2 style='color:#4f46e5'>Reset your password</h2>"
            "<p>Click the button below to set a new password. "
            "This link expires in <strong>1 hour</strong>.</p>"
            f"<div style='text-align:center;margin:32px 0'>"
            f"<a href='{reset_link}' style='background:#4f46e5;color:#fff;padding:12px 28px;"
            f"border-radius:6px;text-decoration:none;font-weight:600;font-size:15px'>"
            f"Reset Password</a></div>"
            "<p style='color:#64748b;font-size:13px'>If you did not request a password reset, "
            "you can safely ignore this email.</p>"
            "</div>"
        ),
    })
