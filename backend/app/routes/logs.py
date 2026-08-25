import json
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import AuditLog
from app.payments.razorpay_service import DEFAULT_KEY_ID

router = APIRouter(tags=["Logs"])

def fetch_logs_data(db: Session):
    logs_raw = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).all()

    logs = []
    total_logs = len(logs_raw)
    accepted_count = 0
    skipped_count = 0
    blocked_count = 0
    total_upsell_revenue = 0.0

    for l in logs_raw:
        cart_items = json.loads(l.cart_contents) if l.cart_contents else []
        ml_candidates = json.loads(l.ml_candidates) if l.ml_candidates else []
        rule_results = json.loads(l.rule_results) if l.rule_results else []
        final_suggestions = json.loads(l.final_suggestions) if l.final_suggestions else []

        if l.user_action == "accepted":
            accepted_count += 1
            for sug in final_suggestions:
                total_upsell_revenue += float(sug.get("finalPrice", sug.get("price", 0)))
        elif l.user_action == "skipped":
            skipped_count += 1

        blocked_count += max(0, len(ml_candidates) - len(final_suggestions))

        logs.append({
            "id": l.id,
            "session_id": l.session_id,
            "timestamp": l.timestamp,
            "cart_items": cart_items,
            "candidates_evaluated": ml_candidates,
            "rule_results": rule_results,
            "final_suggestions": final_suggestions,
            "user_action": l.user_action,
            "payment_status": l.payment_status,
            "failure_reason": l.failure_reason
        })

    conversion_rate = f"{(accepted_count / total_logs * 100):.1f}%" if total_logs > 0 else "0.0%"

    return {
        "success": True,
        "logs": logs,
        "metrics": {
            "totalLogs": total_logs,
            "acceptedCount": accepted_count,
            "skippedCount": skipped_count,
            "blockedCount": blocked_count,
            "conversionRate": conversion_rate,
            "totalUpsellRevenue": round(total_upsell_revenue, 2)
        },
        "defaultKeyId": DEFAULT_KEY_ID
    }

@router.get("/logs")
def get_logs_root(db: Session = Depends(get_db)):
    return fetch_logs_data(db)

@router.get("/api/logs")
def get_logs_api(db: Session = Depends(get_db)):
    return fetch_logs_data(db)

@router.post("/logs/clear")
def clear_logs(db: Session = Depends(get_db)):
    db.query(AuditLog).delete()
    db.commit()
    return {"success": True, "message": "Audit logs cleared successfully"}
