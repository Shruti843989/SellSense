import asyncio
import os
import sys

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.agent.chat_agent import chat_agent

TEST_CATALOG = [
    {"id": "prod-1", "name": "AuraSound Pro Headphones", "price": 6999.0, "category": "Audio", "stock": 15},
    {"id": "prod-2", "name": "UltraMag Power Bank", "price": 1899.0, "category": "Accessories", "stock": 25},
    {"id": "prod-3", "name": "Braided USB-C Cable (2-Pack)", "price": 499.0, "category": "Accessories", "stock": 50},
    {"id": "prod-4", "name": "NanoShield Screen Protector", "price": 349.0, "category": "Accessories", "stock": 40},
    {"id": "prod-5", "name": "Microfiber Pouch", "price": 199.0, "category": "Accessories", "stock": 30},
    {"id": "prod-6", "name": "Ergo Laptop Stand", "price": 1299.0, "category": "Accessories", "stock": 20}
]

def test_budget_extraction_phrases():
    """Verify natural language budget parsing across varied expressions."""
    assert chat_agent.extract_budget("my budget is 500, I want to order something") == 500.0
    assert chat_agent.extract_budget("budget 500") == 500.0
    assert chat_agent.extract_budget("under 500") == 500.0
    assert chat_agent.extract_budget("below 1000 rupees") == 1000.0
    assert chat_agent.extract_budget("for 2000 max") == 2000.0
    assert chat_agent.extract_budget("₹350 max price") == 350.0

async def test_chat_budget_hard_filter_enforcement():
    """
    Test: 'my budget is 500, I want to order something'
    Must ONLY return items with price <= 500.0 (e.g. ₹499, ₹349, ₹199).
    Must NEVER return ₹6999 or ₹1899 items.
    """
    query = "my budget is 500, I want to order something"
    res = await chat_agent.process_chat(
        message=query,
        cart_items=[],
        catalog=TEST_CATALOG
    )

    recommended = res.get("recommendedProducts", [])
    assert len(recommended) > 0, "Should return at least one item within budget"

    for prod in recommended:
        assert prod["price"] <= 500.0, f"VIOLATION: Returned product '{prod['name']}' at ₹{prod['price']} exceeds budget ceiling of ₹500"

async def test_chat_budget_no_matches_fallback():
    """
    Test: Budget ₹100 when lowest item is ₹199.
    Must return clear fallback explanation rather than silently matching expensive items.
    """
    query = "under 100 rupees"
    res = await chat_agent.process_chat(
        message=query,
        cart_items=[],
        catalog=TEST_CATALOG
    )

    assert "No products found under ₹100" in res["reply"]
    intent = res.get("intentParsed", {})
    assert intent.get("is_budget_exceeded_fallback") == True

if __name__ == "__main__":
    print("[RUNNING UNIT TESTS] Testing Conversational Chat Agent Budget Filter...")
    test_budget_extraction_phrases()
    print("[PASS] test_budget_extraction_phrases PASSED")
    
    asyncio.run(test_chat_budget_hard_filter_enforcement())
    print("[PASS] test_chat_budget_hard_filter_enforcement PASSED")

    asyncio.run(test_chat_budget_no_matches_fallback())
    print("[PASS] test_chat_budget_no_matches_fallback PASSED")

    print("\n========================================================")
    print("ALL BUDGET FILTER UNIT TESTS PASSED SUCCESSFULLY! (0 Violations)")
    print("========================================================\n")
