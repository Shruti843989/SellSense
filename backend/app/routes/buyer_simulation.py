import sys
import os
from typing import Optional
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.db.database import get_db

# Ensure scripts directory is on sys.path
SCRIPTS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../scripts"))
if SCRIPTS_DIR not in sys.path:
    sys.path.append(SCRIPTS_DIR)

from simulate_ai_buyer import run_ai_buyer_simulation

router = APIRouter(prefix="/api/buyer-simulation", tags=["Autonomous AI Buyer Simulation"])

class SimulationRequest(BaseModel):
    persona: Optional[str] = "Tech enthusiast searching for a fast-charging accessory under INR 2,000"

@router.post("/run")
def trigger_buyer_simulation(req: SimulationRequest, db: Session = Depends(get_db)):
    """
    Triggers the Autonomous AI Buyer Agent simulation end-to-end:
    1. Browses /api/catalog/agent machine-readable schema.
    2. Uses Python Agent reasoning to select items within persona budget.
    3. Executes sandbox checkout autonomously.
    """
    persona = req.persona or "Tech enthusiast searching for a fast-charging accessory under INR 2,000"
    res = run_ai_buyer_simulation(persona=persona)
    return res
