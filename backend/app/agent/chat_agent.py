import os
import re
import json
from typing import List, Dict, Any
from openai import OpenAI

class ConversationalChatAgent:
    """
    Conversational Checkout Agent:
    Parses natural language shopper messages, extracts budget & category constraints,
    queries catalog, and returns matching items with assistant rationale.
    """
    def __init__(self):
        pass

    async def process_chat(
        self, 
        message: str, 
        cart_items: List[Dict[str, Any]], 
        catalog: List[Dict[str, Any]], 
        api_key: str = None
    ) -> Dict[str, Any]:
        
        active_key = api_key or os.getenv("OPENAI_API_KEY")

        # Parse budget using regex heuristic as fallback/parser
        budget = None
        budget_match = re.search(r'(?:under|below|less than|within|around|₹|\$)\s*(\d+)', message, re.IGNORECASE)
        if budget_match:
            try:
                budget = float(budget_match.group(1))
            except ValueError:
                pass

        # Attempt OpenAI LLM Intent Parsing if key provided
        if active_key and active_key.startswith("sk-"):
            try:
                client = OpenAI(api_key=active_key)
                prompt = f"""You are NudgeAI Conversational Shopping Assistant.
User Query: "{message}"
Cart Subtotal: ₹{sum(i['price']*i.get('quantity',1) for i in cart_items)}
Available Catalog:
{json.dumps([{"id": p["id"], "name": p["name"], "category": p["category"], "price": p["price"], "stock": p["stock"]} for p in catalog], indent=2)}

Extract intent:
1. Target Category or Product Keywords
2. Max Budget constraint (if mentioned)
3. Friendly helpful reply text explaining recommendations.

Return strictly JSON:
{{
  "category": "Accessories",
  "max_budget": 2000,
  "reply": "I found these top-rated power banks under ₹2,000 that pair great with your gear!",
  "recommended_ids": ["prod-2"]
}}"""

                res = client.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=[
                        {"role": "system", "content": "You parse e-commerce user chat intent into valid JSON."},
                        {"role": "user", "content": prompt}
                    ],
                    temperature=0.7,
                    max_tokens=300
                )
                raw = res.choices[0].message.content or "{}"
                clean_json = raw.replace("```json", "").replace("```", "").strip()
                data = json.loads(clean_json)

                rec_ids = data.get("recommended_ids", [])
                matching_prods = [p for p in catalog if p["id"] in rec_ids and p["stock"] > 0]
                
                if matching_prods:
                    return {
                        "reply": data.get("reply") or f"Here are the top matches found for '{message}':",
                        "recommendedProducts": matching_prods,
                        "intentParsed": {"category": data.get("category"), "max_budget": data.get("max_budget")},
                        "aiSource": "OpenAI Conversational Agent"
                    }
            except Exception as e:
                print(f"[CHAT NOTE] OpenAI Chat LLM note: {e}, using Python Agentic Intent Parser.")

        # Fallback Python Agentic Intent Parser & Recommendation Engine
        matching = []
        msg_lower = message.lower()

        for p in catalog:
            if p["stock"] <= 0:
                continue

            name_cat = (p["name"] + " " + p["category"] + " " + " ".join(p.get("tags", []))).lower()
            
            # Check price budget constraint
            if budget and p["price"] > budget:
                continue

            # Check keyword relevance
            is_match = False
            for word in msg_lower.split():
                if len(word) >= 3 and word in name_cat:
                    is_match = True
                    break

            if is_match or not budget:
                matching.append(p)

        # Sort matching by rating
        matching.sort(key=lambda x: x.get("rating", 4.5), reverse=True)
        top_matches = matching[:3]

        if not top_matches:
            # Fallback top products
            top_matches = [p for p in catalog if p["stock"] > 0][:2]
            reply = f"I couldn't find exact matches under ₹{budget if budget else 'your budget'}, but here are our top available items:"
        else:
            budget_txt = f" under ₹{budget:,.0f}" if budget else ""
            reply = f"I found {len(top_matches)} great product(s){budget_txt} matching your request:"

        return {
            "reply": reply,
            "recommendedProducts": top_matches,
            "intentParsed": {"budget_extracted": budget, "query_keywords": msg_lower},
            "aiSource": "Python Conversational Intent Agent"
        }

chat_agent = ConversationalChatAgent()
