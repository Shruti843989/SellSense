import json
import random
import pandas as pd
import numpy as np
from app.db.database import engine, Base, SessionLocal
from app.db.models import Product, SyntheticOrder

INITIAL_PRODUCTS = [
  {
    "id": "prod-1",
    "name": "AuraSound Pro Wireless Headphones",
    "description": "Active noise-canceling over-ear headphones with 40-hour battery life, high-fidelity drivers, and spatial audio.",
    "price": 6999.0,
    "category": "Audio",
    "image": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80",
    "stock": 15,
    "sales_velocity": 185,  # Fast-moving
    "tags": ["audio", "wireless", "premium", "bluetooth"],
    "rating": 4.8
  },
  {
    "id": "prod-2",
    "name": "UltraMag 10,000mAh Magnetic Power Bank",
    "description": "Compact 15W MagSafe fast-charging external battery pack with dual USB-C ports and LED battery percentage indicator.",
    "price": 1899.0,
    "category": "Accessories",
    "image": "https://images.unsplash.com/photo-1609592424109-dd9892f1b177?w=600&auto=format&fit=crop&q=80",
    "stock": 25,
    "sales_velocity": 140,  # Fast-moving
    "tags": ["accessories", "charging", "powerbank", "magsafe"],
    "rating": 4.6
  },
  {
    "id": "prod-3",
    "name": "PulseFit Pro Smartwatch",
    "description": "AMOLED fitness tracker with SpO2 sensor, optical heart rate monitor, GPS navigation, and 7-day endurance.",
    "price": 4499.0,
    "category": "Electronics",
    "image": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80",
    "stock": 10,
    "sales_velocity": 90,   # Regular-moving
    "tags": ["fitness", "smartwatch", "wearables", "tech"],
    "rating": 4.7
  },
  {
    "id": "prod-4",
    "name": "Braided Nylon USB-C SuperFast Cable (2-Pack)",
    "description": "Reinforced 100W Power Delivery charging & 480Mbps data sync cable set with tangle-free braided armor.",
    "price": 499.0,
    "category": "Accessories",
    "image": "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=600&auto=format&fit=crop&q=80",
    "stock": 50,
    "sales_velocity": 210,  # Fast-moving
    "tags": ["accessories", "cable", "usbc", "fast-charging"],
    "rating": 4.5
  },
  {
    "id": "prod-5",
    "name": "ErgoComfort Aluminum Laptop Stand",
    "description": "Adjustable aluminum ergonomic laptop elevator for desks, supporting laptops up to 17 inches with heat dissipation slots.",
    "price": 1299.0,
    "category": "Accessories",
    "image": "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600&auto=format&fit=crop&q=80",
    "stock": 35,
    "sales_velocity": 12,   # Slow-moving / Overstocked (KMeans cluster candidate)
    "tags": ["desk", "stand", "ergonomic", "accessories"],
    "rating": 4.9
  },
  {
    "id": "prod-6",
    "name": "NanoShield Screen Protection Kit",
    "description": "9H Hardness tempered glass screen guard with automatic dust-elimination installation tray and microfiber cloth.",
    "price": 349.0,
    "category": "Accessories",
    "image": "https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=600&auto=format&fit=crop&q=80",
    "stock": 45,
    "sales_velocity": 8,    # Slow-moving / Overstocked (KMeans cluster candidate)
    "tags": ["accessories", "protection", "screenguard"],
    "rating": 4.4
  },
  {
    "id": "prod-7",
    "name": "SonicGlide RGB Mechanical Keyboard",
    "description": "Compact 75% hot-swappable tactile wireless mechanical gaming keyboard with customizable RGB per-key backlighting.",
    "price": 3899.0,
    "category": "Electronics",
    "image": "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&auto=format&fit=crop&q=80",
    "stock": 8,
    "sales_velocity": 75,   # Regular-moving
    "tags": ["electronics", "keyboard", "gaming", "desk"],
    "rating": 4.8
  },
  {
    "id": "prod-8",
    "name": "VelvetTouch Microfiber Cleaning Pouch",
    "description": "Ultra-soft anti-static scratchless pouch for cleaning camera lenses, smart glasses, and smartphone touchscreens.",
    "price": 199.0,
    "category": "Accessories",
    "image": "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600&auto=format&fit=crop&q=80",
    "stock": 0,             # Out of stock
    "sales_velocity": 5,    # Slow-moving
    "tags": ["accessories", "cleaning", "budget"],
    "rating": 4.2
  },
  {
    "id": "prod-9",
    "name": "AirGlide Precision Wireless Mouse",
    "description": "Ergonomic 4000 DPI silent optical wireless mouse with multi-device Bluetooth switching.",
    "price": 1499.0,
    "category": "Electronics",
    "image": "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=600&auto=format&fit=crop&q=80",
    "stock": 20,
    "sales_velocity": 85,   # Regular-moving
    "tags": ["electronics", "mouse", "wireless", "desk"],
    "rating": 4.6
  },
  {
    "id": "prod-10",
    "name": "SoundPulse Waterproof Bluetooth Speaker",
    "description": "IPX7 waterproof portable Bluetooth speaker with 360-degree bass radiator and 12-hour playtime.",
    "price": 2499.0,
    "category": "Audio",
    "image": "https://images.unsplash.com/photo-1545454675-3531b543be5d?w=600&auto=format&fit=crop&q=80",
    "stock": 14,
    "sales_velocity": 60,   # Regular-moving
    "tags": ["audio", "speaker", "waterproof", "bluetooth"],
    "rating": 4.7
  }
]

CO_PURCHASE_PAIRS = [
  ("prod-1", "prod-2", 0.65),
  ("prod-1", "prod-4", 0.55),
  ("prod-3", "prod-2", 0.60),
  ("prod-3", "prod-4", 0.50),
  ("prod-7", "prod-5", 0.70),
  ("prod-7", "prod-9", 0.65),
  ("prod-9", "prod-5", 0.50),
  ("prod-10", "prod-4", 0.45)
]

def seed_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    existing_count = db.query(Product).count()
    if existing_count == 0:
        for p in INITIAL_PRODUCTS:
            prod_obj = Product(
                id=p["id"],
                name=p["name"],
                description=p["description"],
                price=p["price"],
                category=p["category"],
                image=p["image"],
                stock=p["stock"],
                sales_velocity=p["sales_velocity"],
                tags=json.dumps(p["tags"]),
                rating=p["rating"]
            )
            db.add(prod_obj)
        db.commit()
        print("[SUCCESS] 10 Products seeded successfully.")

    existing_orders = db.query(SyntheticOrder).count()
    if existing_orders == 0:
        random.seed(42)
        np.random.seed(42)

        orders_list = []
        all_prod_ids = [p["id"] for p in INITIAL_PRODUCTS]

        for i in range(120):
            order_items = set()
            primary = random.choice(all_prod_ids)
            order_items.add(primary)

            for p1, p2, prob in CO_PURCHASE_PAIRS:
                if primary == p1 and random.random() < prob:
                    order_items.add(p2)
                elif primary == p2 and random.random() < prob:
                    order_items.add(p1)

            if random.random() < 0.20:
                order_items.add(random.choice(all_prod_ids))

            order_id = f"synth_ord_{i+1:03d}"
            order_items_json = json.dumps(list(order_items))

            synth_obj = SyntheticOrder(
                id=order_id,
                product_ids=order_items_json
            )
            db.add(synth_obj)
            orders_list.append({"id": order_id, "products": list(order_items)})

        db.commit()
        print(f"[SUCCESS] {len(orders_list)} Synthetic Orders created for ML model training.")

        df_orders = pd.DataFrame([
            {"order_id": o["id"], "products_json": json.dumps(o["products"])} for o in orders_list
        ])
        csv_path = "synthetic_orders.csv"
        df_orders.to_csv(csv_path, index=False)
        print(f"[DATA] Exported synthetic order history to '{csv_path}'.")

    db.close()

if __name__ == "__main__":
    seed_database()
