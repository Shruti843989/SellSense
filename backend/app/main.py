import json
import time
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.db.database import SessionLocal, engine, Base
from app.db.seed import seed_database
from app.db.models import Product, SyntheticOrder
from app.ml.recommender import ml_recommender
from app.routes import products, suggest, checkout, logs, agent_catalog, chat, campaign, buyer_simulation, cart, guardian, bundles, abandoned_cart, orders

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize Database & Train ML Models
    print("[INIT] Initializing SellSense Database & ML Recommender...")
    seed_database()

    db = SessionLocal()
    products_db = db.query(Product).all()
    orders_db = db.query(SyntheticOrder).all()

    products_list = [
        {
            "id": p.id,
            "name": p.name,
            "description": p.description,
            "price": p.price,
            "category": p.category,
            "image": p.image,
            "stock": p.stock,
            "sales_velocity": p.sales_velocity,
            "tags": json.loads(p.tags) if p.tags else [],
            "rating": p.rating
        }
        for p in products_db
    ]

    orders_list = [
        {
            "id": o.id,
            "product_ids": json.loads(o.product_ids) if o.product_ids else []
        }
        for o in orders_db
    ]
    db.close()

    # Train scikit-learn Cosine Similarity & Description Embedding matrices
    ml_recommender.train(products_list, orders_list)
    print("[SUCCESS] SellSense Startup Complete - Ready for Inference & Agentic Commerce!")
    yield
    print("[SHUTDOWN] SellSense Backend Shutdown.")

app = FastAPI(
    title="SellSense Platform API",
    description="Python ML + Agentic Commerce Platform Backend (scikit-learn + FastAPI + Razorpay)",
    version="2.0.0",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Router mounts (Root and /api prefix)
app.include_router(products.router)
app.include_router(cart.router)
app.include_router(suggest.router)
app.include_router(checkout.router)
app.include_router(logs.router)
app.include_router(agent_catalog.router)
app.include_router(chat.router)
app.include_router(campaign.router)
app.include_router(buyer_simulation.router)
app.include_router(guardian.router)
app.include_router(bundles.router)
app.include_router(abandoned_cart.router)
app.include_router(orders.router)

# Mount with /api prefix as well
app.include_router(bundles.router, prefix="/api")
app.include_router(abandoned_cart.router, prefix="/api")
app.include_router(orders.router, prefix="/api")

@app.get("/health")
def health_check():
    return {
        "status": "OK",
        "app": "SellSense Python FastAPI ML Platform",
        "ml_engines": [
            "scikit-learn Cosine Similarity Matrix",
            "TF-IDF Vector Embeddings",
            "scikit-learn KMeans Inventory Clusterer"
        ],
        "agent_capabilities": [
            "Real-time Upsell Agent",
            "Conversational Checkout Assistant",
            "KMeans Campaign Orchestrator",
            "Agent-Readable Catalog API",
            "Autonomous AI Buyer Simulator"
        ],
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    }
