"""Create a test partner in the database.
Run: python create_test_partner.py
"""
import asyncio
import uuid
import sys
from pathlib import Path

# Ensure backend package path is on sys.path when running from repo root
REPO_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(REPO_ROOT))

from database import database
from partner_auth import hash_password

async def run():
    await database.connect()
    pwd = 'testpassword'
    partner = {
        'id': str(uuid.uuid4()),
        'username': 'test_partner',
        'email': 'partner@example.com',
        'password_hash': hash_password(pwd),
        'name': 'Test Partner',
        'phone': '+911234567890'
    }
    existing = await database.get_partner_by_username(partner['username'])
    if existing:
        print('Partner already exists:', partner['username'])
    else:
        created = await database.create_partner(partner)
        print('Created partner:', created['username'])
    await database.close()

if __name__ == '__main__':
    try:
        asyncio.run(run())
    except Exception as e:
        print('Error running script:', e)
        raise
