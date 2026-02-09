#!/usr/bin/env python3
"""
Migration script to add unique index on client ID to prevent duplicates.
"""
import asyncio
import sys
from pathlib import Path

# Add backend to path
REPO_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(REPO_ROOT / "backend"))

from database import Database

async def add_unique_index():
    """Add unique index on client ID to prevent duplicates."""
    db = Database()
    await db.connect()
    
    try:
        # Create unique index on (partner_id, id) to prevent duplicate clients per partner
        index_info = "unique_client_per_partner"
        
        try:
            await db.db.clients.create_index([("partner_id", 1), ("id", 1)], unique=True, name=index_info)
            print(f"✅ Created unique index on (partner_id, id)")
        except Exception as e:
            if "duplicate key error" in str(e).lower():
                print(f"⚠️  Cannot create unique index: duplicate clients already exist in database")
                print(f"    Run cleanup_duplicate_clients.py first to remove duplicates")
            else:
                print(f"⚠️  Index creation failed: {e}")
                return False
        
        # Verify index was created
        indexes = await db.db.clients.index_information()
        if index_info in indexes:
            print(f"✅ Index verified: {indexes[index_info]}")
        
        return True
        
    finally:
        await db.close()

if __name__ == "__main__":
    success = asyncio.run(add_unique_index())
    sys.exit(0 if success else 1)
