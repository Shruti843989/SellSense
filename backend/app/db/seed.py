import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

import json
import random
import pandas as pd
import numpy as np
from app.db.database import engine, Base, SessionLocal
from app.db.models import Product, SyntheticOrder

INITIAL_PRODUCTS = [
  # --- Category 1: Audio ---
  {
    "id": "prod-1",
    "name": "AuraSound Pro Wireless Headphones",
    "description": "Active noise-canceling over-ear headphones with 40-hour battery life, high-fidelity drivers, and spatial audio.",
    "price": 6999.0,
    "category": "Audio",
    "image": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80",
    "stock": 15,
    "sales_velocity": 185,
    "tags": ["audio", "wireless", "premium", "bluetooth"],
    "rating": 4.8
  },
  {
    "id": "prod-2",
    "name": "SoundPulse Waterproof Bluetooth Speaker",
    "description": "IPX7 waterproof portable Bluetooth speaker with 360-degree bass radiator and 12-hour playtime.",
    "price": 2499.0,
    "category": "Audio",
    "image": "https://images.unsplash.com/photo-1545454675-3531b543be5d?w=600&auto=format&fit=crop&q=80",
    "stock": 14,
    "sales_velocity": 60,
    "tags": ["audio", "speaker", "waterproof", "bluetooth"],
    "rating": 4.7
  },
  {
    "id": "prod-3",
    "name": "StudioMaster ANC Wireless Earbuds",
    "description": "True wireless earbuds with active noise cancellation, dual mics, transparency mode, and wireless charging case.",
    "price": 3299.0,
    "category": "Audio",
    "image": "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&auto=format&fit=crop&q=80",
    "stock": 25,
    "sales_velocity": 120,
    "tags": ["audio", "earbuds", "wireless", "bluetooth"],
    "rating": 4.6
  },
  {
    "id": "prod-4",
    "name": "ProBass Magnetic Neckband Headphones",
    "description": "Flex-neckband bluetooth earphones with fast charging, magnetic earbuds, and HD bass clarity.",
    "price": 1199.0,
    "category": "Audio",
    "image": "https://images.unsplash.com/photo-1572536147248-ac59a8abfa4b?w=600&auto=format&fit=crop&q=80",
    "stock": 40,
    "sales_velocity": 160,
    "tags": ["audio", "neckband", "sports", "budget"],
    "rating": 4.4
  },

  # --- Category 2: Accessories ---
  {
    "id": "prod-5",
    "name": "UltraMag 10,000mAh Magnetic Power Bank",
    "description": "Compact 15W MagSafe fast-charging external battery pack with dual USB-C ports and LED battery percentage indicator.",
    "price": 1899.0,
    "category": "Accessories",
    "image": "https://images.unsplash.com/photo-1609592424109-dd9892f1b177?w=600&auto=format&fit=crop&q=80",
    "stock": 22,
    "sales_velocity": 140,
    "tags": ["accessories", "charging", "powerbank", "magsafe"],
    "rating": 4.6
  },
  {
    "id": "prod-6",
    "name": "Braided Nylon USB-C SuperFast Cable (2-Pack)",
    "description": "Reinforced 100W Power Delivery charging & 480Mbps data sync cable set with tangle-free braided armor.",
    "price": 499.0,
    "category": "Accessories",
    "image": "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=600&auto=format&fit=crop&q=80",
    "stock": 50,
    "sales_velocity": 210,
    "tags": ["accessories", "cable", "usbc", "fast-charging"],
    "rating": 4.5
  },
  {
    "id": "prod-7",
    "name": "ErgoComfort Aluminum Laptop Stand",
    "description": "Adjustable aluminum ergonomic laptop elevator for desks, supporting laptops up to 17 inches with heat dissipation slots.",
    "price": 1299.0,
    "category": "Accessories",
    "image": "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600&auto=format&fit=crop&q=80",
    "stock": 35,
    "sales_velocity": 80,
    "tags": ["desk", "stand", "ergonomic", "accessories"],
    "rating": 4.9
  },
  {
    "id": "prod-8",
    "name": "NanoShield Screen Protection Kit",
    "description": "9H Hardness tempered glass screen guard with automatic dust-elimination installation tray and microfiber cloth.",
    "price": 349.0,
    "category": "Accessories",
    "image": "https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=600&auto=format&fit=crop&q=80",
    "stock": 45,
    "sales_velocity": 90,
    "tags": ["accessories", "protection", "screenguard"],
    "rating": 4.4
  },
  {
    "id": "prod-9",
    "name": "VelvetTouch Microfiber Cleaning Pouch",
    "description": "Ultra-soft anti-static scratchless pouch for cleaning camera lenses, smart glasses, and smartphone touchscreens.",
    "price": 199.0,
    "category": "Accessories",
    "image": "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600&auto=format&fit=crop&q=80",
    "stock": 30,
    "sales_velocity": 50,
    "tags": ["accessories", "cleaning", "budget"],
    "rating": 4.2
  },
  {
    "id": "prod-10",
    "name": "MagSafe Wireless Car Charging Mount",
    "description": "Air-vent magnetic car phone holder with 15W fast wireless charging and 360-degree rotation ball joint.",
    "price": 1599.0,
    "category": "Accessories",
    "image": "https://images.unsplash.com/photo-1586105251261-72a756497a11?w=600&auto=format&fit=crop&q=80",
    "stock": 18,
    "sales_velocity": 75,
    "tags": ["accessories", "car", "magsafe", "charging"],
    "rating": 4.6
  },
  {
    "id": "prod-11",
    "name": "Genuine Leather Smartwatch Strap",
    "description": "Premium top-grain leather replacement band with quick-release stainless steel buckle for 20mm/22mm watches.",
    "price": 799.0,
    "category": "Accessories",
    "image": "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600&auto=format&fit=crop&q=80",
    "stock": 28,
    "sales_velocity": 65,
    "tags": ["accessories", "watch", "leather", "straps"],
    "rating": 4.5
  },

  # --- Category 3: Bags ---
  {
    "id": "prod-12",
    "name": "TravelTech Pro Anti-Theft Backpack",
    "description": "Water-resistant 30L travel backpack with TSA lock, hidden passport pocket, and built-in external USB charging port.",
    "price": 2899.0,
    "category": "Bags",
    "image": "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&auto=format&fit=crop&q=80",
    "stock": 20,
    "sales_velocity": 110,
    "tags": ["bags", "backpack", "travel", "anti-theft"],
    "rating": 4.8
  },
  {
    "id": "prod-13",
    "name": "ProProtector Padded Laptop Sleeve (15-Inch)",
    "description": "Shockproof plush fleece lining laptop pouch with water-resistant polyester exterior and zippered accessory pocket.",
    "price": 899.0,
    "category": "Bags",
    "image": "https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=600&auto=format&fit=crop&q=80",
    "stock": 35,
    "sales_velocity": 95,
    "tags": ["bags", "laptop", "sleeve", "protection"],
    "rating": 4.6
  },
  {
    "id": "prod-14",
    "name": "UrbanCommute Canvas Messenger Bag",
    "description": "Vintage canvas shoulder bag with magnetic snaps, tablet compartment, and padded shoulder strap.",
    "price": 1999.0,
    "category": "Bags",
    "image": "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&auto=format&fit=crop&q=80",
    "stock": 16,
    "sales_velocity": 70,
    "tags": ["bags", "messenger", "canvas", "office"],
    "rating": 4.7
  },
  {
    "id": "prod-15",
    "name": "Weekender Waterproof Travel Duffel",
    "description": "Spacious 45L gym & travel duffel bag with separate ventilated shoe compartment and wet pocket.",
    "price": 2399.0,
    "category": "Bags",
    "image": "https://images.unsplash.com/photo-1512413912139-91415f42d90c?w=600&auto=format&fit=crop&q=80",
    "stock": 12,
    "sales_velocity": 55,
    "tags": ["bags", "duffel", "travel", "gym"],
    "rating": 4.5
  },
  {
    "id": "prod-16",
    "name": "Minimalist Slim Crossbody Sling Pouch",
    "description": "Lightweight water-repellent chest pouch for phone, wallet, keys, and compact power bank.",
    "price": 699.0,
    "category": "Bags",
    "image": "https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?w=600&auto=format&fit=crop&q=80",
    "stock": 40,
    "sales_velocity": 130,
    "tags": ["bags", "crossbody", "sling", "budget"],
    "rating": 4.4
  },

  # --- Category 4: Electronics ---
  {
    "id": "prod-17",
    "name": "PulseFit Pro Smartwatch",
    "description": "AMOLED fitness tracker with SpO2 sensor, optical heart rate monitor, GPS navigation, and 7-day endurance.",
    "price": 4499.0,
    "category": "Electronics",
    "image": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80",
    "stock": 10,
    "sales_velocity": 90,
    "tags": ["fitness", "smartwatch", "wearables", "tech"],
    "rating": 4.7
  },
  {
    "id": "prod-18",
    "name": "SonicGlide RGB Mechanical Keyboard",
    "description": "Compact 75% hot-swappable tactile wireless mechanical gaming keyboard with customizable RGB per-key backlighting.",
    "price": 3899.0,
    "category": "Electronics",
    "image": "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&auto=format&fit=crop&q=80",
    "stock": 8,
    "sales_velocity": 75,
    "tags": ["electronics", "keyboard", "gaming", "desk"],
    "rating": 4.8
  },
  {
    "id": "prod-19",
    "name": "AirGlide Precision Wireless Mouse",
    "description": "Ergonomic 4000 DPI silent optical wireless mouse with multi-device Bluetooth switching.",
    "price": 1499.0,
    "category": "Electronics",
    "image": "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=600&auto=format&fit=crop&q=80",
    "stock": 20,
    "sales_velocity": 85,
    "tags": ["electronics", "mouse", "wireless", "desk"],
    "rating": 4.6
  },
  {
    "id": "prod-20",
    "name": "UltraClear 4K HDR USB Webcam",
    "description": "Autofocus 4K streaming webcam with dual noise-reduction microphones and magnetic privacy shutter.",
    "price": 4999.0,
    "category": "Electronics",
    "image": "https://images.unsplash.com/photo-1587826080692-f439cd0b70da?w=600&auto=format&fit=crop&q=80",
    "stock": 15,
    "sales_velocity": 65,
    "tags": ["electronics", "webcam", "video", "desk"],
    "rating": 4.7
  },

  # --- Category 5: Wearables ---
  {
    "id": "prod-21",
    "name": "ActiveRing Health & Sleep Tracker",
    "description": "Lightweight titanium smart ring monitoring continuous HRV, sleep stages, body temperature, and recovery score.",
    "price": 8999.0,
    "category": "Wearables",
    "image": "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600&auto=format&fit=crop&q=80",
    "stock": 8,
    "sales_velocity": 45,
    "tags": ["wearables", "smartring", "health", "premium"],
    "rating": 4.9
  },
  {
    "id": "prod-22",
    "name": "FitStep Waterproof Fitness Band",
    "description": "Slim OLED fitness wristband with step counter, sleep tracker, call alerts, and 14-day battery life.",
    "price": 1499.0,
    "category": "Wearables",
    "image": "https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=600&auto=format&fit=crop&q=80",
    "stock": 30,
    "sales_velocity": 140,
    "tags": ["wearables", "fitnessband", "tracker", "budget"],
    "rating": 4.5
  },

  # --- Category 6: Fitness ---
  {
    "id": "prod-23",
    "name": "ProGrip Heavy Resistance Bands Set (5-Pack)",
    "description": "100% natural latex exercise bands with door anchor, foam handles, ankle straps, and travel carrying bag.",
    "price": 899.0,
    "category": "Fitness",
    "image": "https://images.unsplash.com/photo-1598289431512-b97b0917affc?w=600&auto=format&fit=crop&q=80",
    "stock": 35,
    "sales_velocity": 105,
    "tags": ["fitness", "gym", "workout", "bands"],
    "rating": 4.6
  },
  {
    "id": "prod-24",
    "name": "SmartCount Speed Jump Rope",
    "description": "Tangle-free ball bearing speed rope with digital jump counter, calorie burner calculator, and weighted handles.",
    "price": 599.0,
    "category": "Fitness",
    "image": "https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=600&auto=format&fit=crop&q=80",
    "stock": 40,
    "sales_velocity": 115,
    "tags": ["fitness", "jumprope", "cardio", "budget"],
    "rating": 4.4
  },
  {
    "id": "prod-25",
    "name": "EcoGrip Non-Slip TPE Yoga Mat (6mm)",
    "description": "Eco-friendly extra thick non-slip exercise yoga mat with alignment guidelines and carrying strap.",
    "price": 1299.0,
    "category": "Fitness",
    "image": "https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=600&auto=format&fit=crop&q=80",
    "stock": 25,
    "sales_velocity": 85,
    "tags": ["fitness", "yoga", "mat", "workout"],
    "rating": 4.7
  },

  # --- Category 7: Home ---
  {
    "id": "prod-26",
    "name": "TempControl Smart Thermal Desk Mug",
    "description": "App-controlled heated coffee mug keeping drinks at your exact preferred temperature for up to 2 hours.",
    "price": 3499.0,
    "category": "Home",
    "image": "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80",
    "stock": 12,
    "sales_velocity": 50,
    "tags": ["home", "mug", "smart", "desk"],
    "rating": 4.8
  },
  {
    "id": "prod-27",
    "name": "LuminaLED Dimmable Smart Desk Lamp",
    "description": "Eye-caring LED architect desk lamp with wireless smartphone charging pad and touch brightness control.",
    "price": 2199.0,
    "category": "Home",
    "image": "https://images.unsplash.com/photo-1534353473418-4cfa6c56fd38?w=600&auto=format&fit=crop&q=80",
    "stock": 22,
    "sales_velocity": 75,
    "tags": ["home", "lamp", "desk", "lighting"],
    "rating": 4.7
  },

  # --- Category 8: Stationery ---
  {
    "id": "prod-28",
    "name": "ReSmart Reusable Digital Notebook",
    "description": "Erasable 36-page smart notebook with cloud auto-sync app integration and erasable Frixion pen.",
    "price": 1699.0,
    "category": "Stationery",
    "image": "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80",
    "stock": 25,
    "sales_velocity": 90,
    "tags": ["stationery", "notebook", "digital", "office"],
    "rating": 4.6
  },
  {
    "id": "prod-29",
    "name": "Executive Matte Aluminum Pen Set",
    "description": "Refillable rollerball and ballpoint metallic executive pen duo in presentation gift case.",
    "price": 499.0,
    "category": "Stationery",
    "image": "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=600&auto=format&fit=crop&q=80",
    "stock": 45,
    "sales_velocity": 120,
    "tags": ["stationery", "pen", "gift", "budget"],
    "rating": 4.5
  },
  {
    "id": "prod-30",
    "name": "ErgoLeather Desk Blotter & Pad",
    "description": "Waterproof PU leather desk mat protector (90x40cm) for keyboard, mouse, and writing surface.",
    "price": 799.0,
    "category": "Stationery",
    "image": "https://images.unsplash.com/photo-1517842645767-c639042777db?w=600&auto=format&fit=crop&q=80",
    "stock": 30,
    "sales_velocity": 100,
    "tags": ["stationery", "deskpad", "leather", "office"],
    "rating": 4.7
  }
]

# Real co-purchase pairing logic for synthetic dataset generation
CO_PURCHASE_GROUPS = [
  # Audio + Power Bank + Cable + Screen Protector
  ["prod-1", "prod-5", "prod-6", "prod-8"],
  ["prod-3", "prod-5", "prod-6"],
  # Laptop Bag + Sleeve + Wireless Mouse + Stand
  ["prod-12", "prod-13", "prod-19", "prod-7"],
  ["prod-14", "prod-13", "prod-19"],
  # Keyboard + Mouse + Desk Lamp + Desk Pad
  ["prod-18", "prod-19", "prod-27", "prod-30"],
  # Smartwatch + Leather Strap + Screen Guard
  ["prod-17", "prod-11", "prod-8"],
  ["prod-22", "prod-11"],
  # Fitness: Yoga Mat + Resistance Bands + Jump Rope + Water Bottle
  ["prod-25", "prod-23", "prod-24"],
  # Stationery: Digital Notebook + Pen Set + Desk Pad
  ["prod-28", "prod-29", "prod-30"]
]

def seed_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # Seed products (replace existing to update catalog to 30 items)
    db.query(Product).delete()
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
    print(f"[SUCCESS] {len(INITIAL_PRODUCTS)} Products seeded successfully across 8 categories.")

    # Generate 400 Realistic Synthetic Orders
    db.query(SyntheticOrder).delete()
    random.seed(42)
    np.random.seed(42)

    orders_list = []
    all_prod_ids = [p["id"] for p in INITIAL_PRODUCTS]

    for i in range(400):
        order_items = set()
        # Choose a realistic co-purchase group 75% of the time
        if random.random() < 0.75:
            group = random.choice(CO_PURCHASE_GROUPS)
            k = random.randint(1, min(len(group), 3))
            selected = random.sample(group, k)
            order_items.update(selected)
        else:
            primary = random.choice(all_prod_ids)
            order_items.add(primary)
            if random.random() < 0.40:
                order_items.add(random.choice(all_prod_ids))

        order_id = f"synth_ord_{i+1:04d}"
        order_items_json = json.dumps(list(order_items))

        synth_obj = SyntheticOrder(
            id=order_id,
            product_ids=order_items_json
        )
        db.add(synth_obj)
        orders_list.append({"id": order_id, "products": list(order_items)})

    db.commit()
    print(f"[SUCCESS] {len(orders_list)} Synthetic Orders generated with realistic co-purchase patterns.")

    # Export to CSV for inspection/audit
    df_orders = pd.DataFrame([
        {"order_id": o["id"], "products_json": json.dumps(o["products"])} for o in orders_list
    ])
    csv_path = "synthetic_orders.csv"
    df_orders.to_csv(csv_path, index=False)
    print(f"[DATA] Saved synthetic purchase history dataset to '{csv_path}'.")

    db.close()

if __name__ == "__main__":
    seed_database()
