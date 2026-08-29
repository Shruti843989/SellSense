import json
import uuid
import time
import datetime
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import Product, ChatMemory as DBChatMemory, User
from app.auth import get_optional_user, get_current_user
from app.agent.chat_agent import chat_agent

router = APIRouter(prefix="/api/chat", tags=["Conversational Chat Agent"])

class ChatRequest(BaseModel):
    message: str
    cartItems: Optional[List[Dict[str, Any]]] = []
    apiKey: Optional[str] = None
    sessionId: Optional[str] = None

@router.get("/history")
def get_chat_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Fetch persistent chat conversation history for the logged-in user from PostgreSQL.
    """
    mem = db.query(DBChatMemory).filter(DBChatMemory.user_id == current_user.id).first()
    messages = []
    if mem and mem.messages:
        try:
            messages = json.loads(mem.messages)
        except Exception:
            messages = []
    return {"success": True, "messages": messages}

@router.post("")
@router.post("/")
async def chat_with_agent(
    req: ChatRequest,
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    if not req.message or not req.message.strip():
        raise HTTPException(status_code=400, detail="Message string is required")

    products_db = db.query(Product).all()
    catalog = [
        {
            "id": p.id,
            "name": p.name,
            "description": p.description,
            "price": p.price,
            "category": p.category,
            "image": p.image,
            "stock": p.stock,
            "tags": json.loads(p.tags) if p.tags else [],
            "rating": p.rating
        }
        for p in products_db
    ]

    session_id = req.sessionId
    if current_user:
        session_id = f"user_sess_{current_user.id}"

    chat_result = await chat_agent.process_chat(
        message=req.message,
        cart_items=req.cartItems or [],
        catalog=catalog,
        session_id=session_id,
        api_key=req.apiKey
    )

    # If user is logged in, persist conversation history to PostgreSQL ChatMemory table
    if current_user:
        user_mem = db.query(DBChatMemory).filter(DBChatMemory.user_id == current_user.id).first()
        existing_msgs = []
        if user_mem and user_mem.messages:
            try:
                existing_msgs = json.loads(user_mem.messages)
            except Exception:
                existing_msgs = []

        now_iso = datetime.datetime.utcnow().isoformat()
        
        # Append User question & Agent response
        existing_msgs.append({
            "sender": "user",
            "content": req.message,
            "timestamp": now_iso
        })

        existing_msgs.append({
            "sender": "agent",
            "content": chat_result["reply"],
            "recommendedProducts": chat_result.get("recommendedProducts", []),
            "timestamp": now_iso
        })

        if user_mem:
            user_mem.messages = json.dumps(existing_msgs)
            user_mem.updated_at = now_iso
        else:
            new_mem = DBChatMemory(
                id=f"cmem_{uuid.uuid4().hex[:12]}",
                user_id=current_user.id,
                messages=json.dumps(existing_msgs),
                updated_at=now_iso
            )
            db.add(new_mem)

        db.commit()

    return {
        "success": True,
        "reply": chat_result["reply"],
        "recommendedProducts": chat_result["recommendedProducts"],
        "intentParsed": chat_result.get("intentParsed", {}),
        "aiSource": chat_result.get("aiSource", "Conversational Agent")
    }
