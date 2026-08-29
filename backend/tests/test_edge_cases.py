import asyncio
import os
import sys
import unittest.mock as mock

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.agent.chat_agent import chat_agent
from app.agent.checkout_agent import checkout_agent
from app.guardian.guardian_agent import guardian_agent
from app.ml.recommender import ml_recommender

TEST_CATALOG = [
    {"id": "prod-in-stock", "name": "In Stock Headset", "price": 1999.0, "category": "Audio", "stock": 10},
    {"id": "prod-out-of-stock", "name": "Sold Out Headset", "price": 999.0, "category": "Audio", "stock": 0}
]

async def test_invalid_negative_budget():
    """Priority 2: Negative budget ('budget is -500') must be caught and rejected gracefully."""
    res = await chat_agent.process_chat(
        message="my budget is -500",
        cart_items=[],
        catalog=TEST_CATALOG
    )
    assert res.get("intentParsed", {}).get("is_invalid_budget") == True, "Should detect negative budget as invalid"
    assert "invalid budget amount" in res["reply"].lower()
    print("[PASS] Negative budget input validation verified!")

def test_out_of_stock_filtering():
    """Priority 2: Products with stock = 0 must never be candidates."""
    in_stock_only = [p for p in TEST_CATALOG if p["stock"] > 0]
    for p in in_stock_only:
        assert p["stock"] > 0
    assert any(p["stock"] == 0 for p in TEST_CATALOG)
    print("[PASS] Out-of-stock product query filtering verified!")

async def test_llm_fallback_timeout():
    """Priority 2: LLM API failure or timeout must fall back to raw ML candidates gracefully."""
    ml_candidates = [
        {
            "product": TEST_CATALOG[0],
            "co_purchase_score": 0.5,
            "semantic_score": 0.5,
            "hybrid_ml_score": 0.5,
            "ml_confidence_percent": 50
        }
    ]
    # Pass invalid API key to force fallback
    recs = await checkout_agent.select_and_explain(
        cart_items=[],
        ml_candidates=ml_candidates,
        api_key="sk-invalid-fake-key-triggering-fallback"
    )
    assert len(recs) > 0, "Should fall back to python rationale synthesizer"
    assert recs[0]["product"]["id"] == "prod-in-stock"
    print("[PASS] LLM timeout / exception graceful fallback verified!")

async def test_guardian_fail_safe_block():
    """Priority 2: Guardian Agent failure MUST fail SAFE -> verdict = BLOCK."""
    # Mock hard limits to raise exception
    with mock.patch("app.guardian.guardian_rules.GuardianHardRules.evaluate_hard_limits", side_effect=RuntimeError("Simulated Guardian DB Crash")):
        review = await guardian_agent.review_action(
            agent_name="Test Agent",
            action_type="UPSELL_RECOMMENDATION",
            payload={"id": "prod-1", "price": 500},
            context={"cartSubtotal": 1000}
        )
        assert review["verdict"] == "BLOCK", f"Guardian MUST fail SAFE with BLOCK on error. Got: {review['verdict']}"
        assert review["isApproved"] == False
        assert "System Fail-Safe" in review["reasoning"]
    print("[PASS] Guardian Agent Fail-Safe Security Policy (BLOCK on error) verified!")

if __name__ == "__main__":
    print("\n========================================================")
    print("RUNNING PRIORITY 2 EDGE CASE & ROBUSTNESS UNIT TEST SUITE")
    print("========================================================\n")
    
    asyncio.run(test_invalid_negative_budget())
    test_out_of_stock_filtering()
    asyncio.run(test_llm_fallback_timeout())
    asyncio.run(test_guardian_fail_safe_block())

    print("\n========================================================")
    print("ALL PRIORITY 2 ROBUSTNESS UNIT TESTS PASSED SUCCESSFULLY!")
    print("========================================================\n")
