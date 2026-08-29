import urllib.request
import json

BASE_URL = "http://localhost:5000"

TEST_CASES = [
    {
        "name": "Cart 1: Gaming / Desk Keyboard",
        "cart": [{"id": "prod-23", "name": "SonicGlide RGB Mechanical Keyboard", "price": 3899.0, "category": "Electronics"}]
    },
    {
        "name": "Cart 2: Smartphone Power Bank",
        "cart": [{"id": "prod-7", "name": "UltraMag 10,000mAh Magnetic Power Bank", "price": 1899.0, "category": "Accessories"}]
    },
    {
        "name": "Cart 3: Studio Wireless Headphones",
        "cart": [{"id": "prod-1", "name": "AuraSound Pro Wireless Headphones", "price": 6999.0, "category": "Audio"}]
    },
    {
        "name": "Cart 4: Yoga Mat Fitness Setup",
        "cart": [{"id": "prod-36", "name": "EcoGrip Non-Slip TPE Yoga Mat (6mm)", "price": 1299.0, "category": "Fitness"}]
    },
    {
        "name": "Cart 5: Smart Desk Lamp Workspace",
        "cart": [{"id": "prod-41", "name": "LuminaLED Dimmable Smart Desk Lamp", "price": 2199.0, "category": "Home"}]
    }
]

def run_cart_recommendation_tests():
    print("\n=========================================================================")
    print("  VERIFYING CART RECOMMENDATION AFFINITY & RATIONALE GROUNDING (5 CARTS)")
    print("=========================================================================\n")

    for tc in TEST_CASES:
        payload = json.dumps({"cartItems": tc["cart"]}).encode("utf-8")
        req = urllib.request.Request(f"{BASE_URL}/suggest", data=payload, headers={"Content-Type": "application/json"})
        
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode("utf-8"))

        recs = data.get("approvedSuggestions", [])
        print(f"--- {tc['name']} ---")
        print(f"Cart Input: {[i['name'] for i in tc['cart']]}")
        print("Model & Agent Top Recommendations:")

        for r in recs:
            metrics = r.get("ml_metrics", {})
            rationale_clean = str(r.get('rationale', '')).replace("₹", "INR ")
            print(f"  * {r['name']} (Category: {r['category']}, Price: INR {r['price']}, Final: INR {r.get('finalPrice')})")
            print(f"    - ML Confidence: {metrics.get('ml_confidence_percent')}% | Co-Purchase: {metrics.get('co_purchase_score')} | Semantic: {metrics.get('semantic_score')}")
            print(f"    - Grounded Rationale: \"{rationale_clean}\"")
        print()

if __name__ == "__main__":
    run_cart_recommendation_tests()
