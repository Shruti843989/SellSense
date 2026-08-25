import json
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import Product
from app.agent.chat_agent import chat_agent

router = APIRouter(tags=["Conversational Chat Agent"])

class ChatRequest(BaseModel):
    message: str
    cartItems: Optional[List[Dict[str, Any]]] = []
    apiKey: Optional[str] = None

async def process_chat_request(req: ChatRequest, db: Session):
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

    chat_result = await chat_agent.process_chat(
        message=req.message,
        cart_items=req.cartItems or [],
        catalog=catalog,
        api_key=req.apiKey
    )

    return {
        "success": True,
        "reply": chat_result["reply"],
        "recommendedProducts": chat_result["recommendedProducts"],
        "intentParsed": chat_result.get("intentParsed", {}),
        "aiSource": chat_result.get("aiSource", "Conversational Agent")
    }

@router.post("/chat")
async def chat_with_agent_root(req: ChatRequest, db: Session = Depends(get_db)):
    return await process_chat_request(req, db)

@router.post("/api/chat")
async def chat_with_agent_api(req: ChatRequest, db: Session = Depends(get_db)):
    return await process_chat_request(req, db)
