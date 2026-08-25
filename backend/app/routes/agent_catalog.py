import json
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import Product

router = APIRouter(tags=["Agent Catalog API"])

def generate_agent_catalog(db: Session):
    products = db.query(Product).all()
    
    agent_products = []
    for p in products:
        tags_list = json.loads(p.tags) if p.tags else []
        agent_products.append({
            "product_id": p.id,
            "title": p.name,
            "category": p.category,
            "unit_price_inr": p.price,
            "currency": "INR",
            "stock_quantity": p.stock,
            "in_stock": p.stock > 0,
            "attributes": {
                "tags": tags_list,
                "rating": p.rating,
                "sales_velocity_monthly": p.sales_velocity
            },
            "machine_readable_summary": f"{p.name} ({p.category}): ₹{p.price:,.0f}. {p.description}",
            "direct_checkout_supported": True
        })

    return {
        "schema_version": "2.0-agentic",
        "store_name": "SellSense Agentic Commerce Storefront",
        "description": "Machine-readable catalog schema optimized for autonomous AI buyer agents.",
        "supported_agent_actions": ["browse_catalog", "check_stock", "create_order", "verify_payment"],
        "total_items": len(agent_products),
        "products": agent_products
    }

@router.get("/catalog/agent")
def get_agent_readable_catalog_root(db: Session = Depends(get_db)):
    return generate_agent_catalog(db)

@router.get("/api/catalog/agent")
def get_agent_readable_catalog_api(db: Session = Depends(get_db)):
    return generate_agent_catalog(db)
