import uuid
import datetime
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import Product, CartItem as DBCartItem, User
from app.auth import get_current_user

router = APIRouter(prefix="/api/cart", tags=["Cart Management"])

class AddCartItemRequest(BaseModel):
    product_id: str
    quantity: Optional[int] = 1

class UpdateCartQtyRequest(BaseModel):
    product_id: str
    quantity: int

class LegacyCartItem(BaseModel):
    id: str
    quantity: Optional[int] = 1

class LegacyCartRequest(BaseModel):
    items: List[LegacyCartItem]

def format_user_cart(user_id: str, db: Session) -> Dict[str, Any]:
    db_items = db.query(DBCartItem).filter(DBCartItem.user_id == user_id).all()
    cart_items = []
    subtotal = 0.0
    total_qty = 0

    for ci in db_items:
        prod = db.query(Product).filter(Product.id == ci.product_id).first()
        if not prod:
            continue
        line_total = prod.price * ci.quantity
        subtotal += line_total
        total_qty += ci.quantity
        cart_items.append({
            "id": prod.id,
            "product_id": prod.id,
            "name": prod.name,
            "description": prod.description,
            "price": prod.price,
            "category": prod.category,
            "image": prod.image,
            "stock": prod.stock,
            "quantity": ci.quantity,
            "lineTotal": line_total
        })

    return {
        "success": True,
        "items": cart_items,
        "cartSubtotal": subtotal,
        "totalItems": total_qty
    }

@router.get("")
def get_user_cart(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Fetch persistent user cart from PostgreSQL database."""
    return format_user_cart(current_user.id, db)

@router.post("/add")
def add_to_cart(
    req: AddCartItemRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add an item or increment quantity in persistent DB cart."""
    prod = db.query(Product).filter(Product.id == req.product_id).first()
    if not prod:
        raise HTTPException(status_code=404, detail="Product not found")

    existing = db.query(DBCartItem).filter(
        DBCartItem.user_id == current_user.id,
        DBCartItem.product_id == req.product_id
    ).first()

    requested_qty = max(1, req.quantity or 1)

    if existing:
        new_qty = existing.quantity + requested_qty
        if new_qty > prod.stock:
            raise HTTPException(status_code=400, detail=f"Insufficient stock available. Only {prod.stock} in stock.")
        existing.quantity = new_qty
        existing.updated_at = datetime.datetime.utcnow().isoformat()
    else:
        if requested_qty > prod.stock:
            raise HTTPException(status_code=400, detail=f"Insufficient stock available. Only {prod.stock} in stock.")
        new_ci = DBCartItem(
            id=f"cart_{uuid.uuid4().hex[:12]}",
            user_id=current_user.id,
            product_id=prod.id,
            quantity=requested_qty
        )
        db.add(new_ci)

    db.commit()
    return format_user_cart(current_user.id, db)

@router.put("/update")
def update_cart_quantity(
    req: UpdateCartQtyRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update quantity for a product in persistent DB cart."""
    existing = db.query(DBCartItem).filter(
        DBCartItem.user_id == current_user.id,
        DBCartItem.product_id == req.product_id
    ).first()

    if not existing:
        raise HTTPException(status_code=404, detail="Item not found in cart")

    if req.quantity <= 0:
        db.delete(existing)
        db.commit()
        return format_user_cart(current_user.id, db)

    prod = db.query(Product).filter(Product.id == req.product_id).first()
    if prod and req.quantity > prod.stock:
        raise HTTPException(status_code=400, detail=f"Insufficient stock available. Only {prod.stock} in stock.")

    existing.quantity = req.quantity
    existing.updated_at = datetime.datetime.utcnow().isoformat()
    db.commit()
    return format_user_cart(current_user.id, db)

@router.delete("/item/{product_id}")
def remove_cart_item(
    product_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Remove a specific product from persistent DB cart."""
    existing = db.query(DBCartItem).filter(
        DBCartItem.user_id == current_user.id,
        DBCartItem.product_id == product_id
    ).first()

    if existing:
        db.delete(existing)
        db.commit()

    return format_user_cart(current_user.id, db)

@router.delete("/clear")
def clear_user_cart(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Clear all items in user's persistent DB cart."""
    db.query(DBCartItem).filter(DBCartItem.user_id == current_user.id).delete()
    db.commit()
    return {"success": True, "items": [], "cartSubtotal": 0.0, "totalItems": 0}

@router.post("/validate")
def validate_cart(req: LegacyCartRequest, db: Session = Depends(get_db)):
    """Validation endpoint for unauthenticated cart validation."""
    validated_items = []
    subtotal = 0.0
    for item in req.items:
        prod = db.query(Product).filter(Product.id == item.id).first()
        if not prod:
            continue
        qty = max(1, item.quantity or 1)
        subtotal += prod.price * qty
        validated_items.append({
            "id": prod.id,
            "name": prod.name,
            "price": prod.price,
            "quantity": qty,
            "stock": prod.stock
        })
    return {"success": True, "items": validated_items, "cartSubtotal": subtotal}
