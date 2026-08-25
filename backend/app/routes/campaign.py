import json
import time
import random
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import Product, Campaign, AuditLog
from app.ml.clustering import kmeans_clusterer
from app.agent.campaign_agent import campaign_agent
from app.rules.rule_engine import rule_engine

router = APIRouter(prefix="/api/campaign", tags=["Campaign Orchestrator"])

class CampaignRequest(BaseModel):
    apiKey: Optional[str] = None

@router.get("/clusters")
def get_inventory_clusters(db: Session = Depends(get_db)):
    """
    Returns scikit-learn KMeans Inventory Clustering breakdown.
    """
    products_db = db.query(Product).all()
    products_list = [
        {
            "id": p.id,
            "name": p.name,
            "description": p.description,
            "price": p.price,
            "category": p.category,
            "stock": p.stock,
            "sales_velocity": p.sales_velocity,
            "image": p.image
        }
        for p in products_db
    ]

    clustering_result = kmeans_clusterer.cluster_inventory(products_list)
    return {
        "success": True,
        "clusters": clustering_result["cluster_summaries"],
        "slowMovingCount": len(clustering_result["slow_moving_products"]),
        "slowMovingProducts": clustering_result["slow_moving_products"],
        "clusteredProducts": clustering_result["clustered_products"]
    }

@router.post("/suggest")
async def generate_campaign_suggestion(req: CampaignRequest, db: Session = Depends(get_db)):
    """
    KMeans Inventory Clustering -> Campaign AI Agent -> Bounded Rule Engine -> Campaign Creation
    """
    products_db = db.query(Product).all()
    products_list = [
        {
            "id": p.id,
            "name": p.name,
            "description": p.description,
            "price": p.price,
            "category": p.category,
            "stock": p.stock,
            "sales_velocity": p.sales_velocity,
            "image": p.image
        }
        for p in products_db
    ]

    # Step 1: Run KMeans Inventory Clustering
    clustering_result = kmeans_clusterer.cluster_inventory(products_list)
    slow_moving = clustering_result["slow_moving_products"]

    # Step 2: Run Campaign AI Agent
    raw_proposal = await campaign_agent.propose_campaign(slow_moving, api_key=req.apiKey)

    # Step 3: Run Bounded & Gated Rule Engine
    validated_campaign = rule_engine.evaluate_campaign(raw_proposal)

    # Step 4: Persist Campaign in DB
    c_id = f"camp_{int(time.time() * 1000)}"
    target_ids = [p["id"] for p in validated_campaign["target_products"]]

    db_campaign = Campaign(
        id=c_id,
        name=validated_campaign["campaign_name"],
        target_product_ids=json.dumps(target_ids),
        discount_percent=validated_campaign["discount_percent"],
        duration_days=validated_campaign["duration_days"],
        rationale=validated_campaign["rationale"],
        status="ACTIVE"
    )
    db.add(db_campaign)

    # Log in Audit Log table as well
    audit_id = f"audit_camp_{int(time.time() * 1000)}"
    audit_entry = AuditLog(
        id=audit_id,
        session_id="campaign_orchestrator",
        timestamp=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        cart_contents=json.dumps([{"campaign": validated_campaign["campaign_name"]}]),
        ml_candidates=json.dumps([{"slow_moving_count": len(slow_moving)}]),
        rule_results=json.dumps(validated_campaign["rules_check"]),
        final_suggestions=json.dumps(validated_campaign["target_products"]),
        user_action="accepted",
        payment_status="success",
        failure_reason=None
    )
    db.add(audit_entry)
    db.commit()

    return {
        "success": True,
        "campaignId": c_id,
        "kmeansSummary": clustering_result["cluster_summaries"],
        "slowMovingCount": len(slow_moving),
        "validatedCampaign": validated_campaign
    }
