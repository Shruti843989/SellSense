from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import json
import datetime

from app.db.database import SessionLocal
from app.db.models import AuditLog, Product
from app.ml.recommender import ml_recommender

router = APIRouter()

class PostPurchaseChatRequest(BaseModel):
    orderId: str
    message: str

@router.get("/orders")
def get_order_history():
    """
    Returns list of past completed orders from SQLite Audit Log database.
    """
    db = SessionLocal()
    logs = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).all()
    db.close()

    orders = []
    for log in logs:
        # Parse cart items
        cart_items = []
        if log.cart_items:
            try:
                cart_items = json.loads(log.cart_items)
            except Exception:
                cart_items = []

        total_amount = sum(float(i.get("price", 0)) * int(i.get("quantity", 1)) for i in cart_items)
        if total_amount <= 0:
            total_amount = 4999.0  # Fallback demo order total

        status = log.payment_status if log.payment_status else "success"

        orders.append({
            "orderId": log.id,
            "sessionId": log.session_id,
            "timestamp": log.timestamp,
            "status": status,
            "items": cart_items,
            "totalAmount": total_amount,
            "trackingNumber": f"TRK-{log.id[-6:].upper()}",
            "estimatedDelivery": "Delivering in 2 business days via Express Logistics"
        })

    # If no orders in database yet, provide 2 realistic seed orders for demo
    if not orders:
        orders = [
            {
                "orderId": "ord_demo_101",
                "sessionId": "sess_demo_1",
                "timestamp": datetime.datetime.utcnow().isoformat(),
                "status": "success",
                "items": [
                    {"id": "prod-1", "name": "AuraSound Pro Wireless Headphones", "price": 6999.0, "quantity": 1},
                    {"id": "prod-7", "name": "UltraMag 10,000mAh Magnetic Power Bank", "price": 1899.0, "quantity": 1}
                ],
                "totalAmount": 8898.0,
                "trackingNumber": "TRK-DEMO8898",
                "estimatedDelivery": "Delivering in 2 business days via Express Logistics"
            },
            {
                "orderId": "ord_demo_102",
                "sessionId": "sess_demo_2",
                "timestamp": (datetime.datetime.utcnow() - datetime.timedelta(days=2)).isoformat(),
                "status": "success",
                "items": [
                    {"id": "prod-9", "name": "ErgoComfort Aluminum Laptop Stand", "price": 1299.0, "quantity": 1},
                    {"id": "prod-47", "name": "ErgoLeather Desk Blotter & Pad", "price": 799.0, "quantity": 1}
                ],
                "totalAmount": 2098.0,
                "trackingNumber": "TRK-DEMO2098",
                "estimatedDelivery": "Delivered on Thursday, 28 Aug"
            }
        ]

    return {"success": True, "orders": orders}

@router.post("/orders/post-purchase-chat")
def post_purchase_chat(req: PostPurchaseChatRequest):
    """
    Post-Purchase Agent handling order questions:
    1. Delivery/Tracking queries ("when will this arrive") -> returns delivery estimate.
    2. Pairing queries ("what else pairs with what I bought") -> runs ML recommender on past order items.
    """
    msg_lower = req.message.lower()

    db = SessionLocal()
    audit_entry = db.query(AuditLog).filter(AuditLog.id == req.orderId).first()
    
    order_items = []
    if audit_entry and audit_entry.cart_items:
        try:
            order_items = json.loads(audit_entry.cart_items)
        except Exception:
            order_items = []

    if not order_items:
        # Fallback to default items
        order_items = [{"id": "prod-1", "name": "AuraSound Pro Wireless Headphones", "price": 6999.0}]

    db.close()

    # Intent 1: Delivery / Tracking
    if any(kw in msg_lower for kw in ["arrive", "delivery", "track", "shipping", "status", "when"]):
        reply = (
            f"Your order ({req.orderId}) is currently out for express transit! "
            f"Estimated delivery: 2 business days via Express Courier (Tracking: TRK-{req.orderId[-6:].upper()})."
        )
        return {"success": True, "reply": reply, "agent": "Post-Purchase Agent", "type": "DELIVERY_INFO"}

    # Intent 2: Cross-sell / Pairing via ML Engine
    elif any(kw in msg_lower for kw in ["pair", "accessory", "recommend", "else", "matches", "suggest"]):
        past_pids = [i.get("id") for i in order_items if i.get("id")]
        ml_candidates = ml_recommender.recommend_candidates_for_cart(past_pids, top_k=3)
        recommended_products = [c["product"] for c in ml_candidates]

        main_item_name = order_items[0].get("name", "your purchased item")
        reply = (
            f"Based on your purchase of '{main_item_name}', here are the top ML-recommended complementary accessories "
            f"that customers frequently buy alongside:"
        )

        return {
            "success": True,
            "reply": reply,
            "recommendedProducts": recommended_products,
            "agent": "Post-Purchase Agent",
            "type": "CROSS_SELL_RECOMMENDATION"
        }

    # Intent 3: General Support
    else:
        reply = (
            f"Hello! I am your Post-Purchase Support Agent for Order #{req.orderId}. "
            f"You can ask me 'When will this arrive?' or 'What accessories pair well with what I bought?'"
        )
        return {"success": True, "reply": reply, "agent": "Post-Purchase Agent", "type": "GENERAL"}
