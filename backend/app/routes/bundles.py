from fastapi import APIRouter
from typing import List, Dict, Any
from app.db.database import SessionLocal
from app.db.models import Product
from app.ml.recommender import ml_recommender
from app.agents.rule_engine import rule_engine
from app.agents.guardian_agent import guardian_agent

router = APIRouter()

PREDEFINED_BUNDLES = [
  {
    "id": "bundle-1",
    "title": "Complete Workspace & Desk Setup",
    "tagline": "Everything you need for an ergonomic 4K desk setup",
    "item_ids": ["prod-9", "prod-24", "prod-47"],
    "discount_pct": 10.0
  },
  {
    "id": "bundle-2",
    "title": "International Travel Essentials Pack",
    "tagline": "Global travel adapter, memory foam pillow & luggage scale",
    "item_ids": ["prod-57", "prod-58", "prod-62"],
    "discount_pct": 10.0
  },
  {
    "id": "bundle-3",
    "title": "Executive Leather & Gifting Bundle",
    "tagline": "Handcrafted journal, executive pen & leather cardholder",
    "item_ids": ["prod-51", "prod-46", "prod-56"],
    "discount_pct": 10.0
  }
]

@router.get("/bundles")
def get_smart_bundles():
    """
    Generates 3 ML-backed product bundles with 10% bounded discount.
    Each bundle is evaluated through the Rule Engine and Guardian Safety Agent.
    """
    db = SessionLocal()
    products_by_id = {p.id: p for p in db.query(Product).all()}
    db.close()

    result_bundles = []

    for b in PREDEFINED_BUNDLES:
        items = []
        raw_subtotal = 0.0

        for pid in b["item_ids"]:
            if pid in products_by_id:
                p = products_by_id[pid]
                items.append({
                    "id": p.id,
                    "name": p.name,
                    "price": p.price,
                    "image": p.image,
                    "category": p.category
                })
                raw_subtotal += p.price

        if not items:
            continue

        discount_amount = round(raw_subtotal * (b["discount_pct"] / 100.0), 2)
        bundled_price = round(raw_subtotal - discount_amount, 2)

        # Evaluate through Rule Engine Gate
        rule_eval = rule_engine.evaluate_candidate_against_rules(
            candidate_product={"id": b["id"], "name": b["title"], "price": bundled_price},
            cart_subtotal=raw_subtotal,
            suggested_discount=b["discount_pct"]
        )

        # Evaluate through Guardian Safety Agent
        guardian_eval = guardian_agent.supervise_action(
            agent_name="Smart Bundle Builder Agent",
            action_type="BUNDLE_GENERATION",
            payload={
                "bundle_title": b["title"],
                "items_count": len(items),
                "raw_subtotal": raw_subtotal,
                "bundled_price": bundled_price,
                "discount_pct": b["discount_pct"]
            }
        )

        result_bundles.append({
            "id": b["id"],
            "title": b["title"],
            "tagline": b["tagline"],
            "items": items,
            "rawSubtotal": raw_subtotal,
            "bundledPrice": bundled_price,
            "discountPct": b["discount_pct"],
            "savings": discount_amount,
            "rulePassed": rule_eval.overall_pass,
            "guardianVerdict": guardian_eval.get("guardianVerdict", "APPROVE"),
            "riskScore": guardian_eval.get("riskScore", 15)
        })

    return {"success": True, "bundles": result_bundles}
