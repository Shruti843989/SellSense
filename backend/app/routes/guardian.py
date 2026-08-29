import json
import time
import random
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import GuardianLog
from app.guardian.guardian_agent import guardian_agent

router = APIRouter(tags=["Guardian Agent Oversight"])

class MisbehaviorSimulationRequest(BaseModel):
    simulationType: Optional[str] = "UNAUTHORIZED_DISCOUNT"  # "UNAUTHORIZED_DISCOUNT" or "BUDGET_BREACH" or "BEHAVIORAL_DRIFT"
    apiKey: Optional[str] = None

def fetch_guardian_logs(db: Session):
    logs_raw = db.query(GuardianLog).order_by(GuardianLog.created_at.desc()).all()

    logs = []
    approved_cnt = 0
    flagged_cnt = 0
    blocked_cnt = 0

    for l in logs_raw:
        if l.guardian_verdict == "APPROVE":
            approved_cnt += 1
        elif l.guardian_verdict == "FLAG_FOR_REVIEW":
            flagged_cnt += 1
        elif l.guardian_verdict == "BLOCK":
            blocked_cnt += 1

        logs.append({
            "id": l.id,
            "timestamp": l.timestamp,
            "agentName": l.agent_name,
            "actionType": l.action_type,
            "payload": json.loads(l.payload) if l.payload else {},
            "statisticalScore": l.statistical_score,
            "guardianVerdict": l.guardian_verdict,
            "riskScore": l.risk_score,
            "reasoning": l.reasoning,
            "isDemoSimulation": bool(l.is_demo_simulation)
        })

    # Priority 6: Include Behavioral Drift Status in Guardian Metrics
    _, _, drift_metrics = guardian_agent.check_behavioral_drift({})

    return {
        "success": True,
        "totalLogs": len(logs),
        "metrics": {
            "approvedCount": approved_cnt,
            "flaggedCount": flagged_cnt,
            "blockedCount": blocked_cnt,
            "safetyPassRate": f"{((approved_cnt / len(logs)) * 100):.1f}%" if logs else "100.0%",
            "driftStatus": drift_metrics["status"],
            "recentAvgPrice": drift_metrics["recentAvgPrice"],
            "priceShiftPct": drift_metrics["priceShiftPct"],
            "categoryConcentrationPct": drift_metrics["categoryConcentrationPct"],
            "driftReason": drift_metrics["driftReason"]
        },
        "logs": logs
    }

@router.get("/guardian/logs")
def get_guardian_logs_root(db: Session = Depends(get_db)):
    """
    GET /guardian/logs — View Guardian supervision trail & safety/drift metrics.
    """
    return fetch_guardian_logs(db)

@router.get("/api/guardian/logs")
def get_guardian_logs_api(db: Session = Depends(get_db)):
    """
    GET /api/guardian/logs — API alias for Guardian supervision logs & drift metrics.
    """
    return fetch_guardian_logs(db)

@router.post("/guardian/simulate-misbehavior")
@router.post("/api/guardian/simulate-misbehavior")
async def simulate_misbehaving_agent(req: MisbehaviorSimulationRequest, db: Session = Depends(get_db)):
    """
    Pitch Demo Trigger:
    Simulates a rogue agent or behavioral price shift and demonstrates Guardian Agent catching it in real time.
    """
    sim_type = req.simulationType or "UNAUTHORIZED_DISCOUNT"

    if sim_type == "UNAUTHORIZED_DISCOUNT":
        agent_name = "Rogue Upsell Agent (Simulated)"
        action_type = "UNAUTHORIZED_UPSELL_DISCOUNT"
        payload = {
            "productId": "prod-1",
            "productName": "AuraSound Pro Wireless Headphones",
            "price": 6999.0,
            "discountPercent": 25.0,  # Violates Guardian 15% discount ceiling!
            "suggestedDiscount": 25.0,
            "rationale": "Special flash discount generated autonomously by rogue main agent."
        }
        context = {"cartSubtotal": 7000.0}
    elif sim_type == "BEHAVIORAL_DRIFT":
        agent_name = "Drifting Upsell Agent (Simulated)"
        action_type = "PRICE_DRIFT_SPIKE"
        payload = {
            "productId": "prod-1",
            "productName": "AuraSound Pro Wireless Headphones",
            "price": 8999.0,
            "category": "Audio",
            "discountPercent": 10.0,
            "rationale": "High-value recommendation pushing price baseline upwards."
        }
        # Inject items to trigger drift
        for _ in range(10):
            guardian_agent.check_behavioral_drift({"price": 8999.0, "category": "Audio"})
        context = {"cartSubtotal": 9000.0}
    else:
        agent_name = "Rogue AI Buyer Agent (Simulated)"
        action_type = "PERSONA_BUDGET_OVERSPEND"
        payload = {
            "productId": "prod-1",
            "productName": "AuraSound Pro Wireless Headphones",
            "price": 6999.0,
            "discountPercent": 0.0,
            "rationale": "Buying premium audio headphones despite persona budget limit."
        }
        context = {"cartSubtotal": 7000.0, "personaBudget": 1500.0}

    # Execute Guardian Review Checkpoint
    review = await guardian_agent.review_action(
        agent_name=agent_name,
        action_type=action_type,
        payload=payload,
        context=context,
        api_key=req.apiKey
    )

    # Log in Guardian Audit Database
    log_id = f"guard_sim_{int(time.time() * 1000)}_{random.randint(100, 999)}"
    g_log = GuardianLog(
        id=log_id,
        timestamp=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        agent_name=agent_name,
        action_type=action_type,
        payload=json.dumps(payload),
        statistical_score=review["statisticalScore"],
        guardian_verdict=review["verdict"],
        risk_score=review["riskScore"],
        reasoning=review["reasoning"],
        is_demo_simulation=1
    )
    db.add(g_log)
    db.commit()

    return {
        "success": True,
        "demoScenario": sim_type,
        "agentName": agent_name,
        "attemptedPayload": payload,
        "guardianIntervention": review,
        "pitchDemoSummary": f"Guardian Agent caught action by {agent_name} and issued verdict '{review['verdict']}' (Risk Score: {review['riskScore']}/100). Reason: {review['reasoning']}"
    }

@router.post("/guardian/clear")
@router.post("/api/guardian/clear")
def clear_guardian_logs(db: Session = Depends(get_db)):
    db.query(GuardianLog).delete()
    db.commit()
    return {"success": True, "message": "Guardian oversight logs cleared successfully"}
