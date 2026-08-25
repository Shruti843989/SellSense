import os
import json
from typing import List, Dict, Any
from openai import OpenAI

class PythonCheckoutAgent:
    def __init__(self):
        pass

    async def select_and_explain(
        self, 
        cart_items: List[Dict[str, Any]], 
        ml_candidates: List[Dict[str, Any]], 
        api_key: str = None
    ) -> List[Dict[str, Any]]:
        
        active_key = api_key or os.getenv("OPENAI_API_KEY")
        
        if not ml_candidates:
            return []

        if active_key and active_key.startswith("sk-"):
            try:
                client = OpenAI(api_key=active_key)
                
                cart_summary = "\n".join([
                    f"- {i['name']} ({i['category']}, Price: ₹{i['price']}, Qty: {i.get('quantity', 1)})"
                    for i in cart_items
                ])
                
                candidates_summary = "\n".join([
                    f"- ID: {c['product']['id']} | Name: {c['product']['name']} | ML Hybrid Score: {c['ml_confidence_percent']}% | Price: ₹{c['product']['price']}"
                    for c in ml_candidates[:4]
                ])

                prompt = f"""You are NudgeAI, an expert agentic commerce checkout assistant.
Customer Cart:
{cart_summary}

Ranked ML Recommendation Candidates (scikit-learn cosine similarity + embeddings):
{candidates_summary}

Select the best 1-2 candidate products that complement the customer's cart.
For each selected candidate, generate a compelling 1-sentence human-readable explanation focusing on utility and pair compatibility.

Return ONLY a valid JSON array:
[
  {{
    "productId": "prod-2",
    "rationale": "Perfect high-speed 10,000mAh magnetic power bank to keep your headphones powered on long commutes.",
    "suggestedDiscount": 10
  }}
]"""

                response = client.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=[
                        {"role": "system", "content": "You are a helpful e-commerce AI assistant that returns strictly valid JSON arrays."},
                        {"role": "user", "content": prompt}
                    ],
                    temperature=0.7,
                    max_tokens=400
                )

                raw_text = response.choices[0].message.content or "[]"
                clean_json = raw_text.replace("```json", "").replace("```", "").strip()
                parsed = json.loads(clean_json)

                if isinstance(parsed, list) and len(parsed) > 0:
                    agent_results = []
                    for item in parsed:
                        p_id = item.get("productId")
                        ml_match = next((c for c in ml_candidates if c["product"]["id"] == p_id), None)
                        if ml_match:
                            agent_results.append({
                                "product": ml_match["product"],
                                "ml_metrics": {
                                    "co_purchase_score": ml_match["co_purchase_score"],
                                    "semantic_score": ml_match["semantic_score"],
                                    "hybrid_ml_score": ml_match["hybrid_ml_score"],
                                    "ml_confidence_percent": ml_match["ml_confidence_percent"]
                                },
                                "rationale": item.get("rationale") or f"Recommended complementary addition for items in your cart.",
                                "suggestedDiscount": item.get("suggestedDiscount", 10),
                                "ai_source": "OpenAI GPT-3.5 Agent"
                            })
                    if agent_results:
                        return agent_results
            except Exception as e:
                print(f"[AGENT NOTE] OpenAI Agent call note: {e}, falling back to Python Agent Rationale Synthesizer.")

        agent_results = []
        for c in ml_candidates[:3]:
            prod = c["product"]
            conf = c["ml_confidence_percent"]
            cat = prod["category"]
            
            cart_categories = [i["category"] for i in cart_items]
            cart_names = " ".join([i["name"].lower() for i in cart_items])

            if "Audio" in cart_categories and cat == "Accessories":
                rationale = f"ML Co-purchase model matched this accessory ({conf}% match) as an essential companion for your audio gear."
            elif "Electronics" in cart_categories and "charging" in prod.get("tags", []):
                rationale = f"High-rated power solution ({conf}% similarity) frequently ordered alongside smart electronics."
            elif "keyboard" in cart_names or "mouse" in cart_names:
                rationale = f"Top-rated desk ergonomic pairing ({conf}% ML confidence) to complete your setup."
            else:
                rationale = f"High-confidence cross-sell recommendation ({conf}% ML score) based on past buyer purchase vectors."

            agent_results.append({
                "product": prod,
                "ml_metrics": {
                    "co_purchase_score": c["co_purchase_score"],
                    "semantic_score": c["semantic_score"],
                    "hybrid_ml_score": c["hybrid_ml_score"],
                    "ml_confidence_percent": c["ml_confidence_percent"]
                },
                "rationale": rationale,
                "suggestedDiscount": 10,
                "ai_source": "Python ML & Agentic Synthesizer"
            })

        return agent_results

checkout_agent = PythonCheckoutAgent()
