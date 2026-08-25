import os
import re
import json
from typing import List, Dict, Any, Optional
from openai import OpenAI

class ConversationalChatAgent:
    """
    SellSense Conversational Checkout Agent:
    Parses natural language shopper queries, extracts budget & category constraints,
    enforces HARD budget price filtering (price <= budget), and returns matching items with AI rationale.
    """
    def __init__(self):
        pass

    def extract_budget(self, message: str) -> Optional[float]:
        """
        Extracts budget constraint numerically from natural language strings.
        Supports phrases like:
        - "my budget is 500", "budget 500", "budget is 500 rupees"
        - "under 500", "below 500", "less than 500", "within 500"
        - "500 max", "max 500", "for 500", "around 500", "upto 500"
        - "₹500", "$500", "INR 500", "500 rs", "500 inr"
        """
        patterns = [
            r'(?:budget|max|limit|spending|price|val|cost|ceiling|cap)\s*(?:is|of|for|=|:|\approx)?\s*(?:₹|\$|inr|rs\.?|rupees)?\s*(\d+(?:\.\d+)?)',
            r'(?:under|below|less than|within|around|upto|up to|max|for)\s*(?:₹|\$|inr|rs\.?|rupees)?\s*(\d+(?:\.\d+)?)',
            r'(?:₹|\$|inr|rs\.?)\s*(\d+(?:\.\d+)?)',
            r'(\d+(?:\.\d+)?)\s*(?:rs|inr|rupees|max|budget)'
        ]

        for pat in patterns:
            match = re.search(pat, message, re.IGNORECASE)
            if match:
                try:
                    val = float(match.group(1))
                    if val > 0:
                        return val
                except ValueError:
                    continue

        return None

    async def process_chat(
        self, 
        message: str, 
        cart_items: List[Dict[str, Any]], 
        catalog: List[Dict[str, Any]], 
        api_key: str = None
    ) -> Dict[str, Any]:
        
        active_key = api_key or os.getenv("OPENAI_API_KEY")

        # 1. Extract budget constraint
        budget = self.extract_budget(message)

        # 2. Apply HARD BUDGET FILTER on catalog
        if budget is not None:
            within_budget_catalog = [p for p in catalog if p.get("stock", 0) > 0 and float(p.get("price", 0)) <= budget]
        else:
            within_budget_catalog = [p for p in catalog if p.get("stock", 0) > 0]

        # Handle case where budget is set but 0 products in catalog are <= budget
        if budget is not None and not within_budget_catalog:
            in_stock = [p for p in catalog if p.get("stock", 0) > 0]
            in_stock.sort(key=lambda x: float(x.get("price", 0)))
            fallback_items = in_stock[:3]
            lowest_price = fallback_items[0]["price"] if fallback_items else 0

            return {
                "reply": f"No products found under ₹{budget:,.0f}. Here are our lowest-priced available items (starting at ₹{lowest_price:,.0f}):",
                "recommendedProducts": fallback_items,
                "intentParsed": {"budget_extracted": budget, "is_budget_exceeded_fallback": True},
                "aiSource": "SellSense Budget Protection Filter"
            }

        # 3. LLM Intent Parsing if OpenAI key present
        if active_key and active_key.startswith("sk-"):
            try:
                client = OpenAI(api_key=active_key)
                prompt = f"""You are SellSense Conversational Shopping Assistant.
User Query: "{message}"
Extracted Budget Ceiling: {f'₹{budget:,.0f}' if budget else 'None'}
Cart Subtotal: ₹{sum(i['price']*i.get('quantity',1) for i in cart_items)}
Available Candidates (Filtered to price <= budget):
{json.dumps([{"id": p["id"], "name": p["name"], "category": p["category"], "price": p["price"], "stock": p["stock"]} for p in within_budget_catalog], indent=2)}

Extract intent and pick up to 3 best matching products from the candidates list.
Return strictly valid JSON:
{{
  "category": "Accessories",
  "max_budget": {budget if budget else 'null'},
  "reply": "I found these top-rated options within your budget!",
  "recommended_ids": ["prod-4"]
}}"""

                res = client.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=[
                        {"role": "system", "content": "You parse e-commerce user chat intent into valid JSON."},
                        {"role": "user", "content": prompt}
                    ],
                    temperature=0.3,
                    max_tokens=300
                )
                raw = res.choices[0].message.content or "{}"
                clean_json = raw.replace("```json", "").replace("```", "").strip()
                data = json.loads(clean_json)

                rec_ids = data.get("recommended_ids", [])
                
                # HARD VERIFICATION: Enforce price <= budget even on LLM outputs
                llm_matches = []
                for p in within_budget_catalog:
                    if p["id"] in rec_ids:
                        llm_matches.append(p)

                if llm_matches:
                    budget_text = f" under ₹{budget:,.0f}" if budget else ""
                    return {
                        "reply": data.get("reply") or f"Here are the best matches found{budget_text}:",
                        "recommendedProducts": llm_matches,
                        "intentParsed": {"category": data.get("category"), "max_budget": budget},
                        "aiSource": "SellSense OpenAI Conversational Agent"
                    }
            except Exception as e:
                print(f"[CHAT NOTE] OpenAI Chat LLM note: {e}, falling back to Python Intent Engine.")

        # 4. Python Agentic Intent & Keyword Matching Engine
        msg_lower = message.lower()
        matching = []

        for p in within_budget_catalog:
            name_cat = (p["name"] + " " + p["category"] + " " + " ".join(p.get("tags", []))).lower()
            
            # Keyword relevance score
            is_match = False
            for word in msg_lower.split():
                if len(word) >= 3 and word in name_cat:
                    is_match = True
                    break

            if is_match or not budget:
                matching.append(p)

        if not matching and within_budget_catalog:
            matching = within_budget_catalog

        # Sort matching by rating and price
        matching.sort(key=lambda x: x.get("rating", 4.5), reverse=True)
        top_matches = matching[:3]

        # Double check hard budget constraint
        final_valid = [p for p in top_matches if budget is None or p["price"] <= budget]

        budget_txt = f" under ₹{budget:,.0f}" if budget else ""
        reply = f"I found {len(final_valid)} product(s){budget_txt} matching your request:"

        return {
            "reply": reply,
            "recommendedProducts": final_valid,
            "intentParsed": {"budget_extracted": budget, "query_keywords": msg_lower},
            "aiSource": "SellSense Conversational Intent Agent"
        }

chat_agent = ConversationalChatAgent()
