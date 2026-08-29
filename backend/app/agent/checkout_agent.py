import os
import json
from typing import List, Dict, Any
from openai import OpenAI

class PythonCheckoutAgent:
    """
    SellSense Agentic Commerce Checkout Assistant:
    Strictly re-ranks and synthesizes grounded rationales for top ML recommendation candidates.
    Never overrides ML candidates with invented products; grounds explanations in specific ML signals.
    """
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

        # Grounded LLM Agent Re-Ranking via OpenAI
        if active_key and active_key.startswith("sk-"):
            try:
                client = OpenAI(api_key=active_key)
                
                cart_summary = "\n".join([
                    f"- {i['name']} ({i['category']}, Price: ₹{i['price']}, Qty: {i.get('quantity', 1)})"
                    for i in cart_items
                ])
                
                candidates_summary = "\n".join([
                    f"- ID: {c['product']['id']} | Name: {c['product']['name']} | Category: {c['product']['category']} | "
                    f"Hybrid Score: {c['ml_confidence_percent']}% (Co-Purchase: {c['co_purchase_score']}, Semantic: {c['semantic_score']}) | Price: ₹{c['product']['price']}"
                    for c in ml_candidates[:4]
                ])

                prompt = f"""You are SellSense, an expert agentic commerce checkout assistant.

Customer Cart:
{cart_summary}

Ranked ML Recommendation Candidates (scikit-learn cosine similarity + TF-IDF embeddings):
{candidates_summary}

INSTRUCTIONS:
1. Select the top 1-2 candidate products ONLY from the list of ML candidates provided above. Do NOT invent or recommend any product ID outside this list.
2. For each selected candidate, generate a compelling 1-sentence grounded rationale that references the actual underlying signal:
   - If co-purchase score is high, mention "frequently bought together with items in your cart based on customer order history".
   - If semantic embedding score is high, mention "matches the specifications, features, and material profile of items in your cart".

Return ONLY a valid JSON array matching this exact schema:
[
  {{
    "productId": "prod-7",
    "rationale": "Frequently bought together with laptop accessories, giving you 10,000mAh portable fast-charging on the go.",
    "suggestedDiscount": 10
  }}
]"""

                response = client.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=[
                        {"role": "system", "content": "You are a grounded e-commerce AI assistant that returns strictly valid JSON arrays based on provided candidate IDs."},
                        {"role": "user", "content": prompt}
                    ],
                    temperature=0.3,
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
                                "ai_source": "OpenAI GPT-3.5 Agent (Grounded)"
                            })
                    if agent_results:
                        return agent_results
            except Exception as e:
                print(f"[AGENT NOTE] OpenAI Agent call note: {e}, falling back to Python Grounded Rationale Synthesizer.")

        # Grounded Python Agent Rationale Synthesizer Fallback
        agent_results = []
        for c in ml_candidates[:3]:
            prod = c["product"]
            conf = c["ml_confidence_percent"]
            co_score = c["co_purchase_score"]
            sem_score = c["semantic_score"]
            
            if co_score > sem_score:
                rationale = f"Frequently bought together with items in your cart based on 1,000+ transaction order patterns ({conf}% ML confidence)."
            else:
                rationale = f"Matches the feature set, specifications, and material profile of items in your cart ({conf}% NLP similarity)."

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
                "ai_source": "SellSense Grounded ML Engine"
            })

        return agent_results

checkout_agent = PythonCheckoutAgent()
