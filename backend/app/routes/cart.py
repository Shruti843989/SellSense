import json
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import Product

router = APIRouter(tags=["Cart Management"])

class CartItem(BaseModel):
    id: str
    quantity: Optional[int] = 1

class CartRequest(BaseModel):
    items: List[CartItem]

def process_cart_validation(req: CartRequest, db: Session) -> Dict[str, Any]:
    if not req.items:
        return {
            "success": True,
            "cartSubtotal": 0.0,
            "totalItems": 0,
            "items": [],
            "outOfStockItems": []
        }

    validated_items = []
    out_of_stock = []
    subtotal = 0.0

    for item in req.items:
        prod = db.query(Product).filter(Product.id == item.id).first()
        if not prod:
            continue

        qty = max(1, item.quantity or 1)
        is_available = prod.stock >= qty

        item_data = {
            "id": prod.id,
            "name": prod.name,
            "description": prod.description,
            "price": prod.price,
            "category": prod.category,
            "image": prod.image,
            "stock": prod.stock,
            "quantity": qty,
            "lineTotal": prod.price * qty,
            "inStock": is_available
        }

        if is_available:
            validated_items.append(item_data)
            subtotal += prod.price * qty
        else:
            out_of_stock.append({
                "id": prod.id,
                "name": prod.name,
                "requestedQty": qty,
                "availableStock": prod.stock
            })

    return {
        "success": True,
        "cartSubtotal": subtotal,
        "totalItems": sum(i["quantity"] for i in validated_items),
        "items": validated_items,
        "outOfStockItems": out_of_stock
    }

@router.post("/cart")
def validate_cart_root(req: CartRequest, db: Session = Depends(get_db)):
    """
    POST /cart — Validate cart contents, check product stock, and compute cart subtotal.
    """
    return process_cart_validation(req, db)

@router.post("/api/cart")
def validate_cart_api(req: CartRequest, db: Session = Depends(get_db)):
    """
    POST /api/cart — API alias for cart management.
    """
    return process_cart_validation(req, db)
