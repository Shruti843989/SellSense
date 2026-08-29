import pytest
import asyncio
import os
import sys

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.agent.chat_agent import chat_agent


TEST_CATALOG = [
    {"id": "prod-1", "name": "AuraSound Pro Headphones", "price": 6999.0, "category": "Audio", "stock": 15, "rating": 4.8},
    {"id": "prod-2", "name": "UltraMag Power Bank", "price": 1899.0, "category": "Accessories", "stock": 25, "rating": 4.6},
    {"id": "prod-3", "name": "Braided USB-C Cable (2-Pack)", "price": 499.0, "category": "Accessories", "stock": 50, "rating": 4.5},
    {"id": "prod-4", "name": "NanoShield Screen Protector", "price": 349.0, "category": "Accessories", "stock": 40, "rating": 4.4},
    {"id": "prod-5", "name": "Microfiber Pouch", "price": 199.0, "category": "Accessories", "stock": 30, "rating": 4.2},
    {"id": "prod-6", "name": "Ergo Laptop Stand", "price": 1299.0, "category": "Accessories", "stock": 20, "rating": 4.9},
    {"id": "prod-7", "name": "SonicGlide RGB Keyboard", "price": 3899.0, "category": "Electronics", "stock": 8, "rating": 4.8},
    {"id": "prod-8", "name": "ProGrip Resistance Bands", "price": 899.0, "category": "Fitness", "stock": 35, "rating": 4.6}
]

def test_budget_extraction_phrases():
    """Verify natural language budget parsing across 20+ varied query expressions."""
    test_cases = [
        ("my budget is 500, I want to order something", 500.0),
        ("budget 500", 500.0),
        ("under 500", 500.0),
        ("below 1000 rupees", 1000.0),
        ("for 2000 max", 2000.0),
        ("₹350 max price", 350.0),
        ("$1500 limit", 1500.0),
        ("INR 750 ceiling", 750.0),
        ("500 rs budget", 500.0),
        ("looking for headphones under 2500", 2500.0),
        ("need a power bank around 1800", 1800.0),
        ("spending limit 1200", 1200.0),
        ("cost is 800", 800.0),
        ("upto 3000 rs", 3000.0),
        ("within 400", 400.0),
        ("cap is 1500", 1500.0),
        ("find something under ₹2000 for my desk", 2000.0),
        ("give me laptop stand max 1300", 1300.0),
        ("price under 900", 900.0),
        ("500 rupees max", 500.0)
    ]

    for phrase, expected in test_cases:
        extracted = chat_agent.extract_budget(phrase)
        assert extracted == expected, f"Failed on phrase: '{phrase}'. Expected {expected}, got {extracted}"

    print(f"[PASS] Successfully verified budget extraction across {len(test_cases)} diverse phrasing expressions!")

@pytest.mark.asyncio
async def test_chat_budget_hard_filter_enforcement():
    """
    Test: Hard budget filter enforcement.
    Must ONLY return items with price <= budget.
    Must NEVER return items above budget.
    """
    test_budgets = [500.0, 1000.0, 2000.0]

    for budget in test_budgets:
        query = f"my budget is {budget:,.0f}, show me options"
        res = await chat_agent.process_chat(
            message=query,
            cart_items=[],
            catalog=TEST_CATALOG
        )

        recommended = res.get("recommendedProducts", [])
        assert len(recommended) > 0, f"Should return at least one item within budget {budget}"

        for prod in recommended:
            assert prod["price"] <= budget, f"VIOLATION: Returned product '{prod['name']}' at ₹{prod['price']} exceeds budget ceiling of ₹{budget}"

    print("[PASS] Hard budget price filter enforcement verified across multiple price caps!")

@pytest.mark.asyncio
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
    print("[PASS] No-matches fallback protection verified!")

@pytest.mark.asyncio
async def test_category_keyword_matching():

    """
    Test: Category-specific query matching (Audio, Electronics, Fitness).
    """
    query = "need good headphones under 7000"
    res = await chat_agent.process_chat(
        message=query,
        cart_items=[],
        catalog=TEST_CATALOG
    )
    recommended = res.get("recommendedProducts", [])
    assert any("Headphones" in p["name"] for p in recommended), "Should match headphones product"
    print("[PASS] Category keyword matching verified!")

if __name__ == "__main__":
    print("\n========================================================")
    print("RUNNING EXTENDED CONVERSATIONAL CHAT AGENT UNIT TEST SUITE")
    print("========================================================\n")
    
    test_budget_extraction_phrases()
    asyncio.run(test_chat_budget_hard_filter_enforcement())
    asyncio.run(test_chat_budget_no_matches_fallback())
    asyncio.run(test_category_keyword_matching())

    print("\n========================================================")
    print("ALL 20+ BUDGET FILTER & INTENT UNIT TESTS PASSED SUCCESSFULLY! (0 Violations)")
    print("========================================================\n")
