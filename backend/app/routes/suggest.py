import json
import time
import random
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import AuditLog, Product, GuardianLog
from app.ml.recommender import ml_recommender
from app.agent.checkout_agent import checkout_agent
from app.rules.rule_engine import rule_engine
from app.guardian.guardian_agent import guardian_agent

router = APIRouter(tags=["Suggestions"])

class SuggestionRequest(BaseModel):
    cartItems: List[Dict[str, Any]]
    apiKey: Optional[str] = None
    sessionId: Optional[str] = None

class ActionRequest(BaseModel):
    auditId: str
    action: str  # 'accepted', 'skipped'
    acceptedProducts: Optional[List[Dict[str, Any]]] = []

async def process_suggestion_pipeline(req: SuggestionRequest, db: Session):
    if not req.cartItems or len(req.cartItems) == 0:
        raise HTTPException(status_code=400, detail="Cart items array is required")

    cart_subtotal = sum(float(item["price"]) * int(item.get("quantity", 1)) for item in req.cartItems)
    cart_product_ids = [item["id"] for item in req.cartItems]

    # Step 1: ML Scoring (scikit-learn Cosine Similarity + Description TF-IDF vectors)
    ml_candidates = ml_recommender.recommend_candidates_for_cart(cart_product_ids, top_k=5)

    # Step 2: Python AI Agent Layer (LLMSelection & Reasoning)
    agent_candidates = await checkout_agent.select_and_explain(
        cart_items=req.cartItems,
        ml_candidates=ml_candidates,
        api_key=req.apiKey
    )

    # Step 3: Pure Python Bounded & Gated Rule Engine
    rule_evaluation = rule_engine.evaluate(agent_candidates, cart_subtotal)
    rule_approved = rule_evaluation["approved_suggestions"]

    # Step 4: Mandatory Guardian Agent Supervision Checkpoint
    final_guardian_approved = []
    guardian_reviews = []

    for item in rule_approved:
        g_review = await guardian_agent.review_action(
            agent_name="Upsell Checkout Agent",
            action_type="UPSELL_RECOMMENDATION",
            payload=item,
            context={"cartSubtotal": cart_subtotal},
            api_key=req.apiKey
        )
        guardian_reviews.append({
            "productId": item["id"],
            "productName": item["name"],
            "verdict": g_review["verdict"],
            "riskScore": g_review["riskScore"],
            "reasoning": g_review["reasoning"]
        })

        # Save Guardian Supervision Record
        g_log = GuardianLog(
            id=f"guard_{int(time.time()*1000)}_{random.randint(100,999)}",
            timestamp=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            agent_name="Upsell Checkout Agent",
            action_type="UPSELL_RECOMMENDATION",
            payload=json.dumps(item),
            statistical_score=g_review["statisticalScore"],
            guardian_verdict=g_review["verdict"],
            risk_score=g_review["riskScore"],
            reasoning=g_review["reasoning"],
            is_demo_simulation=0
        )
        db.add(g_log)

        if g_review["verdict"] != "BLOCK":
            item["guardianStatus"] = g_review["verdict"]
            item["guardianReasoning"] = g_review["reasoning"]
            final_guardian_approved.append(item)

    # Step 5: Persist Audit Log in SQLite via SQLAlchemy
    audit_id = f"audit_{int(time.time() * 1000)}_{random.randint(1000, 9999)}"
    session_id = req.sessionId or f"sess_{int(time.time())}"

    audit_entry = AuditLog(
        id=audit_id,
        session_id=session_id,
        timestamp=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        cart_contents=json.dumps([
            {"id": i["id"], "name": i["name"], "qty": i.get("quantity", 1), "price": i["price"]}
            for i in req.cartItems
        ]),
        ml_candidates=json.dumps([
            {
                "id": c["product"]["id"],
                "name": c["product"]["name"],
                "price": c["product"]["price"],
                "ml_metrics": c["ml_metrics"]
            }
            for c in agent_candidates
        ]),
        rule_results=json.dumps(rule_evaluation["rule_results"]),
        final_suggestions=json.dumps(final_guardian_approved),
        user_action="pending",
        payment_status="pending",
        failure_reason=None
    )

    db.add(audit_entry)
    db.commit()

    return {
        "success": True,
        "auditId": audit_id,
        "cartSubtotal": cart_subtotal,
        "totalEvaluated": rule_evaluation["total_evaluated"],
        "passedCount": len(final_guardian_approved),
        "blockedCount": rule_evaluation["total_evaluated"] - len(final_guardian_approved),
        "ruleResults": rule_evaluation["rule_results"],
        "guardianReviews": guardian_reviews,
        "approvedSuggestions": final_guardian_approved
    }

@router.post("/suggest")
async def generate_suggestions_root(req: SuggestionRequest, db: Session = Depends(get_db)):
    return await process_suggestion_pipeline(req, db)

@router.post("/api/suggest")
async def generate_suggestions_api(req: SuggestionRequest, db: Session = Depends(get_db)):
    return await process_suggestion_pipeline(req, db)

@router.post("/suggest/action")
@router.post("/api/suggest/action")
def record_suggestion_action(req: ActionRequest, db: Session = Depends(get_db)):
    log_entry = db.query(AuditLog).filter(AuditLog.id == req.auditId).first()
    if log_entry:
        log_entry.user_action = req.action
        db.commit()
    return {"success": True, "auditId": req.auditId, "action": req.action}
