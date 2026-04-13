"""
Seed script — creates the first admin staff account.

Run from the backend/ directory:
    python seed_admin.py

You will be prompted for the admin's details interactively.
The script is safe to run multiple times; it will skip creation if the
email already exists.
"""

import sys
import getpass

# Ensure the app package is importable from backend/
sys.path.insert(0, ".")

from dotenv import load_dotenv
load_dotenv()

from app.database import SessionLocal, engine, Base
from app.models import staff_user as _  # noqa: F401 — register model with Base
from app.models import staff_refresh_token as __  # noqa: F401
from app.models.staff_user import StaffUser
from app.utils.security import hash_password

VALID_ROLES = ["admin", "ecologist", "surveyor"]


def prompt(label: str, secret: bool = False) -> str:
    while True:
        value = (getpass.getpass if secret else input)(f"{label}: ").strip()
        if value:
            return value
        print("  This field cannot be empty.")


def main() -> None:
    print("=== Biodiversity Farm — Staff Account Seed ===\n")

    email = prompt("Email")
    full_name = prompt("Full name")

    while True:
        role = prompt(f"Role ({', '.join(VALID_ROLES)})").lower()
        if role in VALID_ROLES:
            break
        print(f"  Invalid role. Choose from: {', '.join(VALID_ROLES)}")

    while True:
        password = prompt("Password", secret=True)
        confirm = prompt("Confirm password", secret=True)
        if password == confirm:
            break
        print("  Passwords do not match. Try again.")

    # Ensure tables exist (idempotent)
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        existing = db.query(StaffUser).filter(StaffUser.email == email).first()
        if existing:
            print(f"\n  A staff account with email '{email}' already exists (role: {existing.role}). Skipping.")
            return

        staff = StaffUser(
            email=email,
            full_name=full_name,
            hashed_password=hash_password(password),
            role=role,
        )
        db.add(staff)
        db.commit()
        db.refresh(staff)

        print("\n  Staff account created.")
        print(f"  ID:    {staff.staff_id}")
        print(f"  Name:  {staff.full_name}")
        print(f"  Email: {staff.email}")
        print(f"  Role:  {staff.role}")
    finally:
        db.close()


if __name__ == "__main__":
    main()
