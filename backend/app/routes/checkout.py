import json
import time
import random
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import Order, AuditLog, Product
from app.payments.razorpay_service import create_razorpay_order, verify_payment_signature, DEFAULT_KEY_ID

router = APIRouter(tags=["Payment"])

class CreateOrderRequest(BaseModel):
    amount: float
    receiptId: Optional[str] = None
    keyId: Optional[str] = None
    keySecret: Optional[str] = None

class VerifyPaymentRequest(BaseModel):
    auditId: Optional[str] = None
    razorpay_order_id: str
    razorpay_payment_id: Optional[str] = None
    razorpay_signature: Optional[str] = None
    items: List[Dict[str, Any]]
    total_amount: float
    keySecret: Optional[str] = None

class SimulateFailureRequest(BaseModel):
    auditId: Optional[str] = None
    razorpay_order_id: Optional[str] = None
    items: Optional[List[Dict[str, Any]]] = []
    total_amount: Optional[float] = 0.0
    failureReason: Optional[str] = "Simulated Bank Decline for Buildathon Evaluator Test"

def process_order_creation(req: CreateOrderRequest):
    if req.amount <= 0:
        raise HTTPException(status_code=400, detail="Valid amount is required")
    
    res = create_razorpay_order(
        amount_inr=req.amount,
        receipt_id=req.receiptId,
        key_id=req.keyId,
        key_secret=req.keySecret
    )
    return res

@router.post("/checkout")
@router.post("/api/checkout")
@router.post("/api/payment/create-order")
def create_order(req: CreateOrderRequest):
    return process_order_creation(req)

@router.post("/payment/verify")
@router.post("/api/payment/verify")
def verify_payment(req: VerifyPaymentRequest, db: Session = Depends(get_db)):
    is_valid = verify_payment_signature(
        razorpay_order_id=req.razorpay_order_id,
        razorpay_payment_id=req.razorpay_payment_id or "pay_sim",
        razorpay_signature=req.razorpay_signature or "",
        key_secret=req.keySecret
    )

    if not is_valid:
        raise HTTPException(status_code=400, detail="Invalid Razorpay payment signature")

    # Save successful order in DB
    order_id = f"ord_{int(time.time() * 1000)}"
    order_num = f"RZP-ORD-{random.randint(100000, 999999)}"

    new_order = Order(
        id=order_id,
        order_number=order_num,
        razorpay_order_id=req.razorpay_order_id,
        razorpay_payment_id=req.razorpay_payment_id or f"pay_sim_{int(time.time())}",
        total_amount=req.total_amount,
        items=json.dumps(req.items),
        status="SUCCESS",
        failure_reason=None
    )
    db.add(new_order)

    # Deduct product stock
    for item in req.items:
        p_id = item.get("id")
        qty = item.get("quantity", 1)
        prod = db.query(Product).filter(Product.id == p_id).first()
        if prod:
            prod.stock = max(0, prod.stock - qty)

    # Update audit log status
    if req.auditId:
        audit_log = db.query(AuditLog).filter(AuditLog.id == req.auditId).first()
        if audit_log:
            audit_log.payment_status = "success"

    db.commit()

    return {
        "success": True,
        "message": "Payment verified & order completed successfully",
        "orderNumber": order_num
    }

@router.post("/payment/simulate-failure")
@router.post("/api/payment/simulate-failure")
def simulate_failure(req: SimulateFailureRequest, db: Session = Depends(get_db)):
    order_id = f"ord_fail_{int(time.time() * 1000)}"
    order_num = f"RZP-FAIL-{random.randint(100000, 999999)}"

    failed_order = Order(
        id=order_id,
        order_number=order_num,
        razorpay_order_id=req.razorpay_order_id or f"order_fail_{int(time.time())}",
        razorpay_payment_id=None,
        total_amount=req.total_amount,
        items=json.dumps(req.items),
        status="FAILED",
        failure_reason=req.failureReason
    )
    db.add(failed_order)

    # Update audit log status
    if req.auditId:
        audit_log = db.query(AuditLog).filter(AuditLog.id == req.auditId).first()
        if audit_log:
            audit_log.payment_status = "failed"
            audit_log.failure_reason = req.failureReason

    db.commit()

    return {
        "success": False,
        "isHandledFailure": True,
        "orderNumber": order_num,
        "message": "Payment failure recorded gracefully in audit trail",
        "retrySuggestions": [
            "Try using a different payment method (Test UPI / Cards in Test Mode)",
            "Remove high-value items to lower cart threshold",
            "Click 'Retry Payment' to attempt transaction again"
        ]
    }
