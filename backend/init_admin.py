"""
Initialize admin user - Run this once to create default admin account
"""
import asyncio
import sys
from database import Database
from admin_auth import hash_password
from models import Admin
from datetime import datetime

async def create_default_admin():
    """Create default admin user"""
    db = Database()
    await db.connect()
    
    try:
        # Check if admin already exists
        existing_admin = await db.get_admin_by_username("admin")
        if existing_admin:
            print("Admin user already exists!")
            print("Username: admin")
            return
        
        # Create admin user
        admin_data = Admin(
            username="admin",
            password_hash=hash_password("admin123"),  # Default password
            email="admin@hdmonks.com",
            created_at=datetime.utcnow()
        ).dict()
        
        await db.create_admin(admin_data)
        print("✓ Default admin user created successfully!")
        print("=" * 50)
        print("Login Credentials:")
        print("  Username: admin")
        print("  Password: admin123")
        print("=" * 50)
        print("⚠️  IMPORTANT: Change the password after first login!")
        
    except Exception as e:
        print(f"Error creating admin: {str(e)}")
        sys.exit(1)
    finally:
        await db.close()

if __name__ == "__main__":
    asyncio.run(create_default_admin())
