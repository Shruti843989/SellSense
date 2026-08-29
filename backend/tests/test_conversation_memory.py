import asyncio
import os
import sys
import time

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.agent.chat_agent import chat_agent

TEST_CATALOG = [
    {"id": "prod-1", "name": "AuraSound Pro Wireless Headphones", "price": 6999.0, "category": "Audio", "stock": 15},
    {"id": "prod-3", "name": "StudioMaster ANC Wireless Earbuds", "price": 3299.0, "category": "Audio", "stock": 25},
    {"id": "prod-4", "name": "ProBass Magnetic Neckband Headphones", "price": 1199.0, "category": "Audio", "stock": 40},
    {"id": "prod-7", "name": "UltraMag Power Bank", "price": 1899.0, "category": "Accessories", "stock": 22},
    {"id": "prod-8", "name": "USB-C SuperFast Cable", "price": 499.0, "category": "Accessories", "stock": 50}
]

async def test_three_message_conversation_memory():
    session_id = "test_sess_mem_101"
    
    # Message 1: Budget statement
    res1 = await chat_agent.process_chat(
        message="my budget is 2000",
        cart_items=[],
        catalog=TEST_CATALOG,
        session_id=session_id
    )
    intent1 = res1.get("intentParsed", {})
    assert intent1.get("budget_extracted") == 2000.0, f"Msg 1 failed to extract budget 2000. Got: {intent1}"
    print("[PASS] Msg 1: Extracted budget 2000.0")

    # Message 2: Category preference statement without budget
    res2 = await chat_agent.process_chat(
        message="show me headphones",
        cart_items=[],
        catalog=TEST_CATALOG,
        session_id=session_id
    )
    rec2 = res2.get("recommendedProducts", [])
    assert len(rec2) > 0, "Msg 2 should recommend products matching merged budget and category"
    for prod in rec2:
        assert prod["price"] <= 2000.0, f"VIOLATION: Msg 2 product '{prod['name']}' at ₹{prod['price']} exceeds session budget 2000"
        assert prod["category"] == "Audio", f"Msg 2 product '{prod['name']}' should match Audio category"
    print("[PASS] Msg 2: Successfully merged session budget (2000.0) + category (Audio)")

    # Message 3: Budget override statement
    res3 = await chat_agent.process_chat(
        message="actually my budget is 4000",
        cart_items=[],
        catalog=TEST_CATALOG,
        session_id=session_id
    )
    rec3 = res3.get("recommendedProducts", [])
    assert len(rec3) > 0, "Msg 3 should return items under new budget 4000"
    
    # Verify higher-priced item (StudioMaster ANC Wireless Earbuds @ 3299) is now included
    found_higher = any(p["id"] == "prod-3" for p in rec3)
    assert found_higher, "Msg 3 should include StudioMaster ANC Wireless Earbuds (₹3,299) after budget override to 4000"
    
    for prod in rec3:
        assert prod["price"] <= 4000.0, f"VIOLATION: Msg 3 product '{prod['name']}' at ₹{prod['price']} exceeds overridden budget 4000"
        assert prod["category"] == "Audio", f"Msg 3 product '{prod['name']}' should retain Audio category from session memory"

    print("[PASS] Msg 3: Successfully overridden budget to 4000.0 while retaining category (Audio)")

def test_session_ttl_expiry():
    session_id = "test_sess_ttl_202"
    sess = chat_agent.memory.get_or_create_session(session_id)
    sess["budget"] = 5000.0
    
    # Manually backdate timestamp by 31 minutes
    sess["last_active"] = time.time() - 1900
    
    # Retrieving session should reset it
    new_sess = chat_agent.memory.get_or_create_session(session_id)
    assert new_sess["budget"] is None, "Session memory should reset after 30 minutes TTL"
    print("[PASS] Session TTL 30-minute sliding window expiry verified!")

if __name__ == "__main__":
    print("\n========================================================")
    print("RUNNING CONVERSATION MEMORY UNIT TEST SUITE")
    print("========================================================\n")
    
    asyncio.run(test_three_message_conversation_memory())
    test_session_ttl_expiry()

    print("\n========================================================")
    print("ALL CONVERSATION MEMORY UNIT TESTS PASSED SUCCESSFULLY!")
    print("========================================================\n")
