import json
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import User, Order, AuditLog, GuardianLog, CartItem, WishlistItem, ChatMemory
from app.auth import get_current_admin

router = APIRouter(prefix="/api/admin", tags=["Admin Management"])

class UpdateUserStatusRequest(BaseModel):
    is_suspended: bool

@router.get("/users")
def list_all_users(
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    [Admin Only] List all registered users with their account status and total order counts.
    """
    users = db.query(User).order_by(User.created_at.desc()).all()
    user_list = []

    for u in users:
        order_count = db.query(Order).filter(Order.user_id == u.id).count()
        user_list.append({
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "role": u.role,
            "is_suspended": u.is_suspended,
            "created_at": u.created_at,
            "orderCount": order_count
        })

    return {"success": True, "users": user_list, "totalUsers": len(user_list)}

@router.get("/users/{user_id}")
def get_user_details(
    user_id: str,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    [Admin Only] Fetch detailed profile, order history, and audit trail for a specific user.
    """
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    # User orders
    user_orders = db.query(Order).filter(Order.user_id == user_id).order_by(Order.created_at.desc()).all()
    orders_data = []
    for o in user_orders:
        try:
            items_parsed = json.loads(o.items) if o.items else []
        except Exception:
            items_parsed = []
        orders_data.append({
            "id": o.id,
            "orderNumber": o.order_number,
            "totalAmount": o.total_amount,
            "status": o.status,
            "createdAt": o.created_at,
            "items": items_parsed
        })

    # User audit logs
    user_audits = db.query(AuditLog).filter(AuditLog.user_id == user_id).order_by(AuditLog.timestamp.desc()).all()
    audits_data = []
    for a in user_audits:
        audits_data.append({
            "id": a.id,
            "sessionId": a.session_id,
            "timestamp": a.timestamp,
            "userAction": a.user_action,
            "paymentStatus": a.payment_status,
            "failureReason": a.failure_reason
        })

    # Cart & Wishlist counts
    cart_count = db.query(CartItem).filter(CartItem.user_id == user_id).count()
    wishlist_count = db.query(WishlistItem).filter(WishlistItem.user_id == user_id).count()

    return {
        "success": True,
        "user": {
            "id": target_user.id,
            "name": target_user.name,
            "email": target_user.email,
            "role": target_user.role,
            "is_suspended": target_user.is_suspended,
            "created_at": target_user.created_at,
            "cartCount": cart_count,
            "wishlistCount": wishlist_count
        },
        "orders": orders_data,
        "auditLogs": audits_data
    }

@router.put("/users/{user_id}/status")
def update_user_status(
    user_id: str,
    payload: UpdateUserStatusRequest,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    [Admin Only] Suspend or reactivate a user account.
    """
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    if target_user.id == current_admin.id:
        raise HTTPException(status_code=400, detail="You cannot suspend your own admin account")

    target_user.is_suspended = payload.is_suspended
    db.commit()

    action_text = "suspended" if payload.is_suspended else "reactivated"
    return {
        "success": True,
        "message": f"User account '{target_user.email}' has been {action_text}.",
        "user": {
            "id": target_user.id,
            "email": target_user.email,
            "is_suspended": target_user.is_suspended
        }
    }

@router.delete("/users/{user_id}")
def delete_user_account(
    user_id: str,
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    [Admin Only] Delete a user account. Anonymizes completed orders and audit logs for record-keeping.
    """
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    if target_user.id == current_admin.id:
        raise HTTPException(status_code=400, detail="You cannot delete your own admin account")

    user_email = target_user.email

    # Anonymize orders & audit logs tied to this user
    db.query(Order).filter(Order.user_id == user_id).update({"user_id": None})
    db.query(AuditLog).filter(AuditLog.user_id == user_id).update({"user_id": None})

    # Delete cart, wishlist, chat memory (handled by cascade or explicit delete)
    db.query(CartItem).filter(CartItem.user_id == user_id).delete()
    db.query(WishlistItem).filter(WishlistItem.user_id == user_id).delete()
    db.query(ChatMemory).filter(ChatMemory.user_id == user_id).delete()

    db.delete(target_user)
    db.commit()

    return {
        "success": True,
        "message": f"User account '{user_email}' deleted successfully. Associated order records were anonymized."
    }

@router.get("/guardian-logs")
def view_guardian_logs(
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    [Admin Only] Monitor Guardian Agent safety logs.
    """
    logs = db.query(GuardianLog).order_by(GuardianLog.created_at.desc()).all()
    logs_data = []
    for l in logs:
        logs_data.append({
            "id": l.id,
            "timestamp": l.timestamp,
            "agentName": l.agent_name,
            "actionType": l.action_type,
            "payload": l.payload,
            "statisticalScore": l.statistical_score,
            "verdict": l.guardian_verdict,
            "riskScore": l.risk_score,
            "reasoning": l.reasoning,
            "isDemoSimulation": l.is_demo_simulation
        })
    return {"success": True, "logs": logs_data}

@router.get("/audit-logs")
def view_audit_logs(
    current_admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """
    [Admin Only] Monitor system-wide Audit logs.
    """
    logs = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).all()
    logs_data = []
    for l in logs:
        logs_data.append({
            "id": l.id,
            "sessionId": l.session_id,
            "userId": l.user_id,
            "timestamp": l.timestamp,
            "userAction": l.user_action,
            "paymentStatus": l.payment_status,
            "failureReason": l.failure_reason,
            "cartContents": l.cart_contents,
            "finalSuggestions": l.final_suggestions
        })
    return {"success": True, "logs": logs_data}
