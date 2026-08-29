import datetime
from sqlalchemy import Column, String, Float, Integer, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from app.db.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="customer", nullable=False)  # "customer" or "admin"
    is_suspended = Column(Boolean, default=False, nullable=False)
    created_at = Column(String, default=lambda: datetime.datetime.utcnow().isoformat())

    # Relationships
    cart_items = relationship("CartItem", back_populates="user", cascade="all, delete-orphan")
    wishlist_items = relationship("WishlistItem", back_populates="user", cascade="all, delete-orphan")
    chat_memory = relationship("ChatMemory", back_populates="user", uselist=False, cascade="all, delete-orphan")
    orders = relationship("Order", back_populates="user")
    audit_logs = relationship("AuditLog", back_populates="user")

class CartItem(Base):
    __tablename__ = "cart_items"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    product_id = Column(String, ForeignKey("products.id"), nullable=False)
    quantity = Column(Integer, default=1, nullable=False)
    created_at = Column(String, default=lambda: datetime.datetime.utcnow().isoformat())
    updated_at = Column(String, default=lambda: datetime.datetime.utcnow().isoformat())

    user = relationship("User", back_populates="cart_items")
    product = relationship("Product")

class WishlistItem(Base):
    __tablename__ = "wishlist_items"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    product_id = Column(String, ForeignKey("products.id"), nullable=False)
    created_at = Column(String, default=lambda: datetime.datetime.utcnow().isoformat())

    user = relationship("User", back_populates="wishlist_items")
    product = relationship("Product")

class ChatMemory(Base):
    __tablename__ = "chat_memories"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), unique=True, index=True, nullable=False)
    messages = Column(Text, nullable=False, default="[]")  # JSON string array of {role, content, timestamp}
    updated_at = Column(String, default=lambda: datetime.datetime.utcnow().isoformat())

    user = relationship("User", back_populates="chat_memory")

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
    user_id = Column(String, ForeignKey("users.id", ondelete="SET NULL"), index=True, nullable=True)
    timestamp = Column(String, nullable=False)
    cart_contents = Column(Text, nullable=False)  # JSON string
    ml_candidates = Column(Text, nullable=False)  # JSON string
    rule_results = Column(Text, nullable=False)    # JSON string
    final_suggestions = Column(Text, nullable=False) # JSON string
    user_action = Column(String, default="pending") # pending, accepted, skipped
    payment_status = Column(String, default="pending") # pending, success, failed
    failure_reason = Column(Text, nullable=True)

    user = relationship("User", back_populates="audit_logs")

class Order(Base):
    __tablename__ = "orders"

    id = Column(String, primary_key=True, index=True)
    order_number = Column(String, unique=True, index=True, nullable=False)
    user_id = Column(String, ForeignKey("users.id", ondelete="SET NULL"), index=True, nullable=True)
    razorpay_order_id = Column(String, nullable=True)
    razorpay_payment_id = Column(String, nullable=True)
    total_amount = Column(Float, nullable=False)
    items = Column(Text, nullable=False)  # JSON string
    status = Column(String, nullable=False) # SUCCESS / FAILED
    failure_reason = Column(Text, nullable=True)
    created_at = Column(String, default=lambda: datetime.datetime.utcnow().isoformat())

    user = relationship("User", back_populates="orders")

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


