# SellSense 🧠
### Python ML & Multi-User Agentic Commerce Platform with PostgreSQL & Guardian Safety Supervision

SellSense is an AI/ML-powered e-commerce platform built with **Python, FastAPI, scikit-learn, SQLAlchemy, PostgreSQL, and React**. SellSense combines **real machine learning (co-purchase cosine similarity + description TF-IDF embeddings + sales velocity popularity)** with a **Python AI Agent**, a **Pure Python Bounded & Gated Rule Engine**, an **Independent Guardian Safety Agent**, **JWT Authentication & PostgreSQL Persistence**, a **Permissioned Admin Panel**, **Agent-Readable Catalog API**, **Autonomous AI Buyer Agent Simulation**, **Test Mode payments**, and **SQLAlchemy audit logging**.

---

## 🔐 Multi-User Authentication, PostgreSQL & Admin Panel

SellSense includes full multi-user platform architecture:
- **PostgreSQL Database Support**: Read from environment variable `DATABASE_URL` (supporting Supabase, Neon, Railway, Render, or local Postgres) via SQLAlchemy & Alembic.
- **JWT User Authentication**: bcrypt password hashing, signed 7-day JWT access tokens, email validation, duplicate rejection, and rate-limited logins.
- **Account-Scoped Persistence**: Carts, wishlists, order histories, and multi-turn chat sessions persist across restarts and logins in PostgreSQL.
- **Admin Control Panel**: Permissioned admin endpoints (`/api/admin/*`) guarded by role-checking middleware. Admin UI for user management, account suspension/reactivation, account deletion (with order anonymization), and monitoring system-wide Guardian & Audit logs.

---

## 📐 End-to-End Pipeline Architecture Diagram

```mermaid
flowchart TD
    subgraph Clients["Client Layer"]
        FE["Storefront React UI (Auth Context, Sliding Carousels & Warm Pastel Light Theme)"]
        ADMIN["Admin Management Dashboard (User Directory, Suspend/Delete, Audit Logs)"]
        CHAT["Conversational Chat Widget (Budget & Memory Engine)"]
        BUYER["Autonomous AI Buyer Agent Script"]
    end

    subgraph API["FastAPI Backend Layer (port 5000)"]
        EP["FastAPI Endpoints<br/>(/auth, /cart, /wishlist, /orders, /admin, /suggest, /bundles, /chat)"]
    end

    subgraph Pipeline["Intelligence & Oversight Pipeline"]
        ML["1. Tri-Signal ML Recommender Engine<br/>(Cosine Similarity + TF-IDF Vectorizer + Sales Velocity Popularity + Wishlist Signal)"]
        AGENT["2. Main AI Agent Layer<br/>(Grounded LLM Selection & Rationale Synthesizer)"]
        RULES["3. Pure Python Bounded Rule Engine<br/>(Stock Gate, 30% Price Cap, Max 2 Upsells, 10% Discount Cap)"]
        GUARDIAN["4. Independent Guardian Safety Agent<br/>(Statistical Anomaly Z-Score + Drift Detector + LLM Risk Supervisor)"]
    end

    subgraph External["Payments & Database Layer"]
        RZP["Sandbox Payment Gateway"]
        PG[(PostgreSQL / SQLAlchemy Database & Alembic Migrations)]
    end

    FE --> EP
    ADMIN --> EP
    CHAT --> EP
    BUYER --> EP

    EP --> ML
    ML --> AGENT
    AGENT --> RULES
    RULES --> GUARDIAN

    GUARDIAN -->|Verdict: APPROVE| FE
    GUARDIAN -->|Verdict: APPROVE| BUYER
    GUARDIAN -->|Verdict: BLOCK / FLAG| PG
    GUARDIAN -->|Oversight Log| PG

    EP --> RZP
    RZP --> PG
```

---

## 🚀 Quick Start & Environment Setup

### Prerequisites
- Python 3.10+
- Node.js 18+
- PostgreSQL (Optional: fallback SQLite used if `DATABASE_URL` is omitted)

### 1. Environment Configuration (`backend/.env`)
```bash
# PostgreSQL Connection (e.g. Supabase, Neon, Railway, Render or local Postgres)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/sellsense_db

# JWT Secret Key
JWT_SECRET=sellsense_super_secret_jwt_key_2026_change_in_production
```

### 2. Install Backend Dependencies & Run Database Migrations
```bash
cd backend
pip install -r requirements.txt
alembic upgrade head
python -m app.scripts.seed_admin --email admin@sellsense.com --password admin123 --name "System Admin"
```

### 3. Run Pytest Test Suite
```bash
python -m pytest tests -v
```

### 4. Start Servers
```bash
# Terminal 1: Backend Server (Port 5000)
python run.py

# Terminal 2: Frontend Server (Port 5173)
cd frontend
npm run dev
```

---

## 🔑 Admin Credentials
- **Email**: `admin@sellsense.com`
- **Password**: `admin123`
- **Role**: `admin`

