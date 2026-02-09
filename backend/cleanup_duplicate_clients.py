#!/usr/bin/env python3
"""
Script to remove duplicate clients from MongoDB.
Keeps the first occurrence, removes subsequent duplicates.
"""
import asyncio
import sys
from pathlib import Path

# Add backend to path
REPO_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(REPO_ROOT / "backend"))

from database import Database
from models import Client

async def remove_duplicate_clients():
    """Remove duplicate clients, keeping the first occurrence by creation date."""
    db = Database()
    await db.connect()
    
    try:
        # Get all clients
        all_clients = await db.db.clients.find({}, {"_id": 0}).sort("created_at", 1).to_list(10000)
        print(f"Total clients in database: {len(all_clients)}")
        
        # Track seen client IDs
        seen_ids = set()
        duplicates = []
        
        # Find duplicates
        for client in all_clients:
            client_id = client.get("id")
            if client_id in seen_ids:
                duplicates.append(client_id)
                print(f"Found duplicate client ID: {client_id} - {client.get('full_name')}")
            else:
                seen_ids.add(client_id)
        
        if not duplicates:
            print("✅ No duplicate clients found!")
            return
        
        # Remove duplicates (keep first, delete rest)
        print(f"\n🗑️  Removing {len(duplicates)} duplicate records...")
        for client_id in duplicates:
            # Get all records with this ID, sorted by date (keep oldest)
            records = await db.db.clients.find({"id": client_id}, {"_id": 1}).sort("created_at", 1).to_list(100)
            
            if len(records) > 1:
                # Delete all except the first one
                ids_to_delete = [r["_id"] for r in records[1:]]
                result = await db.db.clients.delete_many({"_id": {"$in": ids_to_delete}})
                print(f"  ✓ Removed {result.deleted_count} duplicate entries for client {client_id}")
        
        print("\n✅ Cleanup complete!")
        
    finally:
        await db.close()

if __name__ == "__main__":
    asyncio.run(remove_duplicate_clients())
