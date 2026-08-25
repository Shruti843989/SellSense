import json
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import Product

router = APIRouter(tags=["Products"])

def get_all_products(db: Session):
    products = db.query(Product).all()
    result = []
    for p in products:
        tags_list = json.loads(p.tags) if p.tags else []
        result.append({
            "id": p.id,
            "name": p.name,
            "description": p.description,
            "price": p.price,
            "category": p.category,
            "image": p.image,
            "stock": p.stock,
            "tags": tags_list,
            "rating": p.rating
        })
    return {"success": True, "products": result}

@router.get("/products")
def list_products_root(db: Session = Depends(get_db)):
    return get_all_products(db)

@router.get("/api/products")
def list_products_api(db: Session = Depends(get_db)):
    return get_all_products(db)
