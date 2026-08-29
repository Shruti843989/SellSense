import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.db.database import SessionLocal, Base, engine
from app.db.models import User, CartItem, WishlistItem, Order

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

def test_signup_login_flow():
    # 1. Successful Signup
    signup_res = client.post("/api/auth/signup", json={
        "name": "Test Customer A",
        "email": "customer_a@example.com",
        "password": "password123"
    })
    assert signup_res.status_code == 200
    data = signup_res.json()
    assert data["success"] is True
    assert "token" in data
    assert data["user"]["email"] == "customer_a@example.com"
    assert data["user"]["role"] == "customer"
    assert "hashed_password" not in data["user"]

    token = data["token"]

    # 2. Duplicate Signup Rejection
    dup_res = client.post("/api/auth/signup", json={
        "name": "Duplicate User",
        "email": "customer_a@example.com",
        "password": "password123"
    })
    assert dup_res.status_code == 400
    assert "already exists" in dup_res.json()["detail"]

    # 3. Successful Login
    login_res = client.post("/api/auth/login", json={
        "email": "customer_a@example.com",
        "password": "password123"
    })
    assert login_res.status_code == 200
    assert login_res.json()["success"] is True

    # 4. /me endpoint verification
    me_res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200
    assert me_res.json()["user"]["email"] == "customer_a@example.com"

def test_user_data_isolation():
    # Signup Customer 1
    c1 = client.post("/api/auth/signup", json={
        "name": "Customer 1",
        "email": "user1@example.com",
        "password": "password123"
    }).json()
    t1 = c1["token"]

    # Signup Customer 2
    c2 = client.post("/api/auth/signup", json={
        "name": "Customer 2",
        "email": "user2@example.com",
        "password": "password123"
    }).json()
    t2 = c2["token"]

    # Seed product if products table empty
    from app.db.models import Product
    db = SessionLocal()
    if not db.query(Product).filter(Product.id == "prod-1").first():
        db.add(Product(id="prod-1", name="Test Prod 1", description="Desc", price=100.0, category="Test", image="img.jpg", stock=10))
        db.commit()
    db.close()

    # Customer 1 adds prod-1 to cart
    add_res = client.post("/api/cart/add", 
        json={"product_id": "prod-1", "quantity": 2},
        headers={"Authorization": f"Bearer {t1}"}
    )
    assert add_res.status_code == 200

    # Customer 2 fetches cart -> should be empty (isolated)
    c2_cart = client.get("/api/cart", headers={"Authorization": f"Bearer {t2}"}).json()
    assert len(c2_cart["items"]) == 0

    # Customer 1 fetches cart -> contains prod-1
    c1_cart = client.get("/api/cart", headers={"Authorization": f"Bearer {t1}"}).json()
    assert len(c1_cart["items"]) == 1
    assert c1_cart["items"][0]["id"] == "prod-1"

def test_admin_protection_and_user_management():
    db = SessionLocal()
    # Create Admin account directly
    admin_user = User(
        id="usr_test_admin",
        name="Test Admin",
        email="test_admin@sellsense.com",
        hashed_password="hashed_pass_test",
        role="admin",
        is_suspended=False
    )
    db.merge(admin_user)
    db.commit()
    db.close()

    # Login customer
    cust_res = client.post("/api/auth/signup", json={
        "name": "Ordinary Customer",
        "email": "ordinary@example.com",
        "password": "password123"
    })
    assert cust_res.status_code == 200
    cust_token = cust_res.json()["token"]

    # Customer trying to access Admin endpoint -> 403 Forbidden
    forbidden_res = client.get("/api/admin/users", headers={"Authorization": f"Bearer {cust_token}"})
    assert forbidden_res.status_code == 403

    # Generate token for Admin
    from app.auth import create_access_token
    admin_token = create_access_token({"sub": "usr_test_admin", "email": "test_admin@sellsense.com", "role": "admin"})

    # Admin accessing /api/admin/users -> 200 OK
    admin_users_res = client.get("/api/admin/users", headers={"Authorization": f"Bearer {admin_token}"})
    assert admin_users_res.status_code == 200
    assert admin_users_res.json()["success"] is True
    assert len(admin_users_res.json()["users"]) >= 1
