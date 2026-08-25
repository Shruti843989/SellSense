import datetime
from sqlalchemy import Column, String, Float, Integer, Text, DateTime
from app.db.database import Base

class Product(Base):
    __tablename__ = "products"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    price = Column(Float, nullable=False)
    category = Column(String, nullable=False)
    image = Column(String, nullable=False)
    stock = Column(Integer, nullable=False, default=10)
    sales_velocity = Column(Integer, nullable=False, default=50) # Units sold per month (for KMeans clustering)
    tags = Column(Text, nullable=True)  # JSON string
    rating = Column(Float, default=4.5)

class SyntheticOrder(Base):
    __tablename__ = "synthetic_orders"

    id = Column(String, primary_key=True, index=True)
    product_ids = Column(Text, nullable=False)  # JSON array string e.g. ["prod-1", "prod-2"]
    created_at = Column(String, default=lambda: datetime.datetime.utcnow().isoformat())

class Campaign(Base):
    __tablename__ = "campaigns"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    target_product_ids = Column(Text, nullable=False) # JSON array
    discount_percent = Column(Float, nullable=False)
    duration_days = Column(Integer, nullable=False)
    rationale = Column(Text, nullable=False)
    status = Column(String, default="ACTIVE") # ACTIVE, EXPIRED, CANCELLED
    created_at = Column(String, default=lambda: datetime.datetime.utcnow().isoformat())

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String, primary_key=True, index=True)
    session_id = Column(String, index=True, nullable=False)
    timestamp = Column(String, nullable=False)
    cart_contents = Column(Text, nullable=False)  # JSON string
    ml_candidates = Column(Text, nullable=False)  # JSON string
    rule_results = Column(Text, nullable=False)    # JSON string
    final_suggestions = Column(Text, nullable=False) # JSON string
    user_action = Column(String, default="pending") # pending, accepted, skipped
    payment_status = Column(String, default="pending") # pending, success, failed
    failure_reason = Column(Text, nullable=True)

class Order(Base):
    __tablename__ = "orders"

    id = Column(String, primary_key=True, index=True)
    order_number = Column(String, unique=True, index=True, nullable=False)
    razorpay_order_id = Column(String, nullable=True)
    razorpay_payment_id = Column(String, nullable=True)
    total_amount = Column(Float, nullable=False)
    items = Column(Text, nullable=False)  # JSON string
    status = Column(String, nullable=False) # SUCCESS / FAILED
    failure_reason = Column(Text, nullable=True)
    created_at = Column(String, default=lambda: datetime.datetime.utcnow().isoformat())

class GuardianLog(Base):
    __tablename__ = "guardian_logs"

    id = Column(String, primary_key=True, index=True)
    timestamp = Column(String, nullable=False)
    agent_name = Column(String, nullable=False)  # e.g., "Upsell Agent", "AI Buyer Agent", "Chat Agent"
    action_type = Column(String, nullable=False)  # "UPSELL_RECOMMENDATION", "CHECKOUT_TRANSACTION", "CAMPAIGN_PROPOSAL"
    payload = Column(Text, nullable=False)        # JSON string of proposed action details
    statistical_score = Column(Float, default=0.0)
    guardian_verdict = Column(String, nullable=False) # "APPROVE", "FLAG_FOR_REVIEW", "BLOCK"
    risk_score = Column(Integer, default=0)       # 0-100 risk scale
    reasoning = Column(Text, nullable=False)
    is_demo_simulation = Column(Integer, default=0) # 1 if simulated misbehavior for demo
    created_at = Column(String, default=lambda: datetime.datetime.utcnow().isoformat())

