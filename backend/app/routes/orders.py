import json
import datetime
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import Order, AuditLog, Product, User
from app.auth import get_optional_user, get_current_user
from app.ml.recommender import ml_recommender

router = APIRouter(prefix="/api/orders", tags=["Orders"])

class PostPurchaseChatRequest(BaseModel):
    orderId: str
    message: str

@router.get("")
def get_order_history(
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """
    Returns order history sourced from PostgreSQL database.
    If user is authenticated as customer, returns orders for that user.
    If user is admin, returns all system orders.
    """
    query = db.query(Order)
    
    if current_user and current_user.role != "admin":
        query = query.filter(Order.user_id == current_user.id)

    db_orders = query.order_by(Order.created_at.desc()).all()

    orders_list = []
    for ord_record in db_orders:
        try:
            items_parsed = json.loads(ord_record.items) if ord_record.items else []
        except Exception:
            items_parsed = []

        orders_list.append({
            "orderId": ord_record.id,
            "orderNumber": ord_record.order_number,
            "userId": ord_record.user_id,
            "razorpayOrderId": ord_record.razorpay_order_id,
            "razorpayPaymentId": ord_record.razorpay_payment_id,
            "timestamp": ord_record.created_at,
            "status": ord_record.status.lower() if ord_record.status else "success",
            "items": items_parsed,
            "totalAmount": ord_record.total_amount,
            "failureReason": ord_record.failure_reason,
            "trackingNumber": f"TRK-{ord_record.id[-6:].upper()}",
            "estimatedDelivery": "Delivering in 2 business days via Express Logistics"
        })

    return {"success": True, "orders": orders_list}

@router.post("/post-purchase-chat")
def post_purchase_chat(
    req: PostPurchaseChatRequest,
    current_user: Optional[User] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """
    Post-Purchase Agent handling order questions:
    1. Delivery/Tracking queries ("when will this arrive") -> returns delivery estimate.
    2. Pairing queries ("what else pairs with what I bought") -> runs ML recommender on past order items.
    """
    msg_lower = req.message.lower()

    # Look up order in Order DB
    order_record = db.query(Order).filter(Order.id == req.orderId).first()
    
    order_items = []
    if order_record and order_record.items:
        try:
            order_items = json.loads(order_record.items)
        except Exception:
            order_items = []

    if not order_items:
        # Fallback query in AuditLog
        audit_entry = db.query(AuditLog).filter(AuditLog.id == req.orderId).first()
        if audit_entry and audit_entry.cart_contents:
            try:
                order_items = json.loads(audit_entry.cart_contents)
            except Exception:
                order_items = []

    if not order_items:
        order_items = [{"id": "prod-1", "name": "AuraSound Pro Wireless Headphones", "price": 6999.0}]

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
