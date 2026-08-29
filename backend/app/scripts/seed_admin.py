import argparse
import uuid
import sys
import os

# Add parent directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from app.db.database import SessionLocal
from app.db.models import User
from app.auth import hash_password

def seed_admin(email: str, password: str, name: str):
    db = SessionLocal()
    try:
        email = email.lower().strip()
        existing_user = db.query(User).filter(User.email == email).first()

        if existing_user:
            existing_user.role = "admin"
            existing_user.hashed_password = hash_password(password)
            existing_user.name = name
            existing_user.is_suspended = False
            db.commit()
            print(f"[SUCCESS] Updated existing user '{email}' to ADMIN role with new credentials.")
        else:
            admin_user = User(
                id=f"usr_admin_{uuid.uuid4().hex[:8]}",
                name=name,
                email=email,
                hashed_password=hash_password(password),
                role="admin",
                is_suspended=False
            )
            db.add(admin_user)
            db.commit()
            print(f"\n======================================================")
            print(f"[SUCCESS] Admin Account Created Successfully!")
            print(f"Email:    {email}")
            print(f"Role:     admin")
            print(f"======================================================\n")

    except Exception as e:
        print(f"[ERROR] Failed to seed admin account: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Seed Admin User for SellSense Platform")
    parser.add_argument("--email", default="admin@sellsense.com", help="Admin email address")
    parser.add_argument("--password", default="admin123", help="Admin password")
    parser.add_argument("--name", default="System Admin", help="Admin full name")

    args = parser.parse_args()
    seed_admin(args.email, args.password, args.name)
