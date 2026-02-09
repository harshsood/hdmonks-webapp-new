from fastapi import APIRouter, HTTPException, Header, Depends
from typing import Optional
from datetime import datetime
import logging

from models import (
    PartnerLogin, ClientCreate, ClientUpdate,
    ClientServiceCreate
)
from database import database
from partner_auth import verify_session, create_session

logger = logging.getLogger(__name__)

partner_router = APIRouter(prefix="/api/partner", tags=["Partner"])


async def verify_partner_token(authorization: Optional[str] = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="No authorization token provided")
    token = authorization.replace("Bearer ", "")
    session = verify_session(token)
    if not session:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return session


@partner_router.post("/login")
async def partner_login(credentials: PartnerLogin):
    try:
        if database.db is None:
            await database.connect()
        partner = await database.get_partner_by_username(credentials.username)
        if not partner:
            raise HTTPException(status_code=401, detail="Invalid credentials")
        from partner_auth import verify_password as _verify
        if not _verify(credentials.password, partner["password_hash"]):
            raise HTTPException(status_code=401, detail="Invalid credentials")
        session = create_session(partner["id"], partner["username"])
        return {"success": True, "token": session["token"], "partner": {"username": partner["username"]}}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Partner login error: {e}")
        raise HTTPException(status_code=500, detail=str(e))



@partner_router.post("/register")
async def partner_register(payload: dict):
    """Register a new partner (username, email, password, name?)"""
    try:
        if database.db is None:
            await database.connect()

        username = payload.get("username")
        email = payload.get("email")
        password = payload.get("password")
        name = payload.get("name")
        phone = payload.get("phone")

        if not username or not email or not password:
            raise HTTPException(status_code=400, detail="username, email and password are required")

        existing = await database.get_partner_by_username(username)
        if existing:
            raise HTTPException(status_code=400, detail="Username already exists")

        from partner_auth import hash_password
        import uuid
        partner_data = {
            "id": str(uuid.uuid4()),
            "username": username,
            "email": email,
            "password_hash": hash_password(password),
            "name": name,
            "phone": phone,
            "created_at": datetime.utcnow().isoformat()
        }

        created = await database.create_partner(partner_data)
        # hide password_hash in response
        created.pop("password_hash", None)
        return {"success": True, "data": created}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Partner register error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@partner_router.get("/verify")
async def verify_partner(session: dict = Depends(verify_partner_token)):
    return {"success": True, "partner": {"username": session['username']}}


@partner_router.get("/clients")
async def list_clients(session: dict = Depends(verify_partner_token)):
    try:
        partner_id = session["partner_id"]
        clients = await database.get_clients_by_partner(partner_id)
        return {"success": True, "data": clients}
    except Exception as e:
        logger.error(f"Error listing clients: {e}")
        raise HTTPException(status_code=500, detail=str(e))



@partner_router.get("/clients/{client_id}")
async def get_client(client_id: str, session: dict = Depends(verify_partner_token)):
    try:
        partner_id = session["partner_id"]
        client = await database.get_client_by_id(client_id)
        if not client or client.get("partner_id") != partner_id:
            raise HTTPException(status_code=404, detail="Client not found")
        return {"success": True, "data": client}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching client: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@partner_router.post("/clients")
async def create_client(client: ClientCreate, session: dict = Depends(verify_partner_token)):
    try:
        partner_id = session["partner_id"]
        client_data = client.dict()
        client_data["partner_id"] = partner_id
        client_data["created_at"] = datetime.utcnow().isoformat()
        client_data["updated_at"] = datetime.utcnow().isoformat()
        created = await database.create_client(client_data)
        return {"success": True, "data": created}
    except Exception as e:
        logger.error(f"Error creating client: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@partner_router.put("/clients/{client_id}")
async def update_client(client_id: str, update: ClientUpdate, session: dict = Depends(verify_partner_token)):
    try:
        partner_id = session["partner_id"]
        update_data = {k: v for k, v in update.dict().items() if v is not None}
        update_data["updated_at"] = datetime.utcnow().isoformat()
        success = await database.update_client(partner_id, client_id, update_data)
        if not success:
            raise HTTPException(status_code=404, detail="Client not found")
        client = await database.get_client_by_id(client_id)
        return {"success": True, "data": client}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating client: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@partner_router.delete("/clients/{client_id}")
async def delete_client(client_id: str, session: dict = Depends(verify_partner_token)):
    try:
        partner_id = session["partner_id"]
        success = await database.delete_client(partner_id, client_id)
        if not success:
            raise HTTPException(status_code=404, detail="Client not found")
        return {"success": True, "message": "Client deleted"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting client: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@partner_router.post("/clients/{client_id}/services")
async def add_service_to_client(client_id: str, service: ClientServiceCreate, session: dict = Depends(verify_partner_token)):
    try:
        partner_id = session["partner_id"]
        service_data = service.dict()
        service_data["purchase_date"] = datetime.utcnow().isoformat()
        created = await database.add_service_to_client(partner_id, client_id, service_data)
        if not created:
            raise HTTPException(status_code=404, detail="Client not found")
        return {"success": True, "data": created}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error adding service to client: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@partner_router.put("/clients/{client_id}/services/{service_id}")
async def update_client_service(client_id: str, service_id: str, update: dict, session: dict = Depends(verify_partner_token)):
    try:
        partner_id = session["partner_id"]
        update_data = {k: v for k, v in update.items() if v is not None}
        success = await database.update_client_service(partner_id, client_id, service_id, update_data)
        if not success:
            raise HTTPException(status_code=404, detail="Service or client not found")
        client = await database.get_client_by_id(client_id)
        return {"success": True, "data": client}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating client service: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@partner_router.delete("/clients/{client_id}/services/{service_id}")
async def delete_client_service(client_id: str, service_id: str, session: dict = Depends(verify_partner_token)):
    try:
        partner_id = session["partner_id"]
        success = await database.delete_client_service(partner_id, client_id, service_id)
        if not success:
            raise HTTPException(status_code=404, detail="Service or client not found")
        return {"success": True, "message": "Service removed"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting client service: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@partner_router.get("/revenue")
async def revenue_summary(session: dict = Depends(verify_partner_token)):
    try:
        partner_id = session["partner_id"]
        summary = await database.get_revenue_by_partner(partner_id)
        return {"success": True, "data": summary}
    except Exception as e:
        logger.error(f"Error fetching revenue summary: {e}")
        raise HTTPException(status_code=500, detail=str(e))
