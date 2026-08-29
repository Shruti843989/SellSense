import uuid
import datetime
from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.db.models import Product, WishlistItem as DBWishlistItem, User
from app.auth import get_current_user

router = APIRouter(prefix="/api/wishlist", tags=["Wishlist Management"])

class WishlistToggleRequest(BaseModel):
    product_id: str

def format_user_wishlist(user_id: str, db: Session) -> Dict[str, Any]:
    db_items = db.query(DBWishlistItem).filter(DBWishlistItem.user_id == user_id).all()
    wishlist_products = []

    for wi in db_items:
        prod = db.query(Product).filter(Product.id == wi.product_id).first()
        if not prod:
            continue
        wishlist_products.append({
            "id": prod.id,
            "name": prod.name,
            "description": prod.description,
            "price": prod.price,
            "category": prod.category,
            "image": prod.image,
            "stock": prod.stock,
            "rating": prod.rating
        })

    return {
        "success": True,
        "items": wishlist_products,
        "totalItems": len(wishlist_products)
    }

@router.get("")
def get_user_wishlist(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Fetch persistent user wishlist from PostgreSQL database."""
    return format_user_wishlist(current_user.id, db)

@router.post("/toggle")
def toggle_wishlist_item(
    req: WishlistToggleRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Toggle a product in user's persistent DB wishlist."""
    prod = db.query(Product).filter(Product.id == req.product_id).first()
    if not prod:
        raise HTTPException(status_code=404, detail="Product not found")

    existing = db.query(DBWishlistItem).filter(
        DBWishlistItem.user_id == current_user.id,
        DBWishlistItem.product_id == req.product_id
    ).first()

    if existing:
        db.delete(existing)
    else:
        new_wi = DBWishlistItem(
            id=f"wish_{uuid.uuid4().hex[:12]}",
            user_id=current_user.id,
            product_id=prod.id
        )
        db.add(new_wi)

    db.commit()
    return format_user_wishlist(current_user.id, db)

@router.delete("/{product_id}")
def remove_wishlist_item(
    product_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Remove item from user's persistent DB wishlist."""
    existing = db.query(DBWishlistItem).filter(
        DBWishlistItem.user_id == current_user.id,
        DBWishlistItem.product_id == product_id
    ).first()

    if existing:
        db.delete(existing)
        db.commit()

    return format_user_wishlist(current_user.id, db)
