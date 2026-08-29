from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import uuid
import datetime
import json

from app.db.database import SessionLocal
from app.db.models import AuditLog
from app.rules.rule_engine import rule_engine
from app.guardian.guardian_agent import guardian_agent

router = APIRouter()

class AbandonedCartRequest(BaseModel):
    cartItems: List[Dict[str, Any]]
    customerEmail: Optional[str] = "customer@example.com"
    sessionId: Optional[str] = "sess_abandoned_demo"

@router.post("/abandoned-cart/trigger")
def trigger_abandoned_cart_recovery(req: AbandonedCartRequest):
    """
    Simulates Abandoned Cart Recovery Agent re-engagement flow.
    Generates personalized recovery message + 5% bounded incentive.
    Evaluates through Rule Engine & Guardian Agent, and logs in Audit Trail.
    """
    if not req.cartItems:
        return {"success": False, "error": "Cart is empty."}

    cart_subtotal = sum(float(i.get("price", 0)) * int(i.get("quantity", 1)) for i in req.cartItems)
    item_names = [i.get("name", "Item") for i in req.cartItems]
    main_item = item_names[0] if item_names else "your cart items"

    discount_pct = 5.0
    discount_amount = round(cart_subtotal * (discount_pct / 100.0), 2)
    incentivized_subtotal = round(cart_subtotal - discount_amount, 2)

    # Personalization LLM / Template Message
    recovery_message = (
        f"Hey there! We noticed you left {main_item} "
        f"{f'and {len(item_names)-1} other item(s)' if len(item_names) > 1 else ''} in your cart. "
        f"Complete your order now and enjoy an exclusive 5% bonus discount (₹{discount_amount} off)!"
    )

    # Pass through Rule Engine Gate
    rule_eval = rule_engine.evaluate_candidate_against_rules(
        candidate_product={"id": "recovery_nudge", "name": f"Cart Incentive for {main_item}", "price": incentivized_subtotal},
        cart_subtotal=cart_subtotal,
        suggested_discount=discount_pct
    )

    # Pass through Guardian Safety Agent
    guardian_eval = guardian_agent.supervise_action(
        agent_name="Abandoned Cart Recovery Agent",
        action_type="RECOVERY_NUDGE",
        payload={
            "cart_subtotal": cart_subtotal,
            "incentive_discount_pct": discount_pct,
            "discount_amount": discount_amount,
            "cart_items_count": len(req.cartItems)
        }
    )

    # Log in Audit Trail
    db = SessionLocal()
    audit_id = f"aud_recov_{uuid.uuid4().hex[:8]}"

    audit_entry = AuditLog(
        id=audit_id,
        session_id=req.sessionId or "sess_abandoned",
        cart_contents=json.dumps(req.cartItems),
        ml_candidates=json.dumps([{"id": "nudge", "incentive": f"{discount_pct}%"}]),
        rule_results=json.dumps([{
            "rule": "5% Abandoned Cart Incentive Cap",
            "passed": rule_eval.overall_pass,
            "discountPct": discount_pct
        }]),
        final_suggestions=json.dumps([{
            "agent_name": "Abandoned Cart Recovery Agent",
            "message": recovery_message,
            "discountPct": discount_pct,
            "discountAmount": discount_amount
        }]),
        user_action="pending",
        payment_status="pending",
        timestamp=datetime.datetime.utcnow().isoformat()
    )
    db.add(audit_entry)
    db.commit()
    db.close()


    return {
        "success": True,
        "auditId": audit_id,
        "agentName": "Abandoned Cart Recovery Agent",
        "actionType": "RECOVERY_NUDGE",
        "message": recovery_message,
        "cartSubtotal": cart_subtotal,
        "discountPct": discount_pct,
        "discountAmount": discount_amount,
        "incentivizedTotal": incentivized_subtotal,
        "rulePassed": rule_eval.overall_pass,
        "guardianVerdict": guardian_eval.get("guardianVerdict", "APPROVE"),
        "riskScore": guardian_eval.get("riskScore", 10)
    }
