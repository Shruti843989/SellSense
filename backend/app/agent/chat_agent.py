import os
import re
import json
import time
from typing import List, Dict, Any, Optional, Set, Tuple
from openai import OpenAI

SESSION_TTL_SECONDS = 1800  # 30 Minutes

class SessionMemoryStore:
    """
    In-memory session context store for conversational agent.
    Tracks budget, category preferences, search keywords, and shown product IDs with 30-min TTL.
    """
    def __init__(self, ttl: float = SESSION_TTL_SECONDS):
        self.sessions: Dict[str, Dict[str, Any]] = {}
        self.ttl = ttl

    def get_or_create_session(self, session_id: str) -> Dict[str, Any]:
        now = time.time()
        if session_id in self.sessions:
            sess = self.sessions[session_id]
            if now - sess.get("last_active", 0) <= self.ttl:
                sess["last_active"] = now
                return sess
            else:
                del self.sessions[session_id]

        new_sess = {
            "budget": None,
            "category": None,
            "keywords": [],
            "shown_product_ids": [],
            "last_active": now
        }
        self.sessions[session_id] = new_sess
        return new_sess

    def reset_session(self, session_id: str):
        if session_id in self.sessions:
            del self.sessions[session_id]

class ConversationalChatAgent:
    """
    SellSense Conversational Checkout Agent:
    Parses natural language shopper queries, tracks multi-turn session memory,
    enforces HARD budget price filtering (price <= budget), and handles invalid inputs & edge cases.
    """
    def __init__(self):
        self.memory = SessionMemoryStore()

    def parse_budget_input(self, message: str) -> Tuple[Optional[float], bool]:
        """
        Extracts budget constraint numerically from natural language strings.
        Returns: (budget_val, is_invalid_negative)
        """
        # Check for negative budget explicitly (Priority 2 edge case)
        neg_patterns = [
            r'(?:budget|max|price|cost|spending)\s*(?:is|=|:)?\s*-\s*\d+',
            r'-\s*\$?\s*\d+\s*(?:rs|rupees|inr|max|budget)?'
        ]
        for pat in neg_patterns:
            if re.search(pat, message, re.IGNORECASE):
                return None, True

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
                        return val, False
                except ValueError:
                    continue

        return None, False

    def extract_budget(self, message: str) -> Optional[float]:
        val, is_invalid = self.parse_budget_input(message)
        return val

    def extract_category_and_keywords(self, message: str, catalog: List[Dict[str, Any]]) -> Tuple[Optional[str], List[str]]:
        msg_lower = message.lower()
        known_categories = list(set(p.get("category", "") for p in catalog if p.get("category")))
        
        detected_category = None
        for cat in known_categories:
            if cat.lower() in msg_lower:
                detected_category = cat
                break

        # Category keyword aliases
        if not detected_category:
            if any(w in msg_lower for w in ["headphone", "headphones", "earbud", "earbuds", "speaker", "audio", "mic"]):
                detected_category = "Audio"
            elif any(w in msg_lower for w in ["bag", "backpack", "sleeve", "duffel", "sling", "pouch"]):
                detected_category = "Bags"
            elif any(w in msg_lower for w in ["watch", "ring", "fitnessband", "wearable", "tracker"]):
                detected_category = "Wearables"
            elif any(w in msg_lower for w in ["keyboard", "mouse", "webcam", "hub", "screenbar"]):
                detected_category = "Electronics"
            elif any(w in msg_lower for w in ["yoga", "mat", "jumprope", "resistance", "massage", "bottle"]):
                detected_category = "Fitness"
            elif any(w in msg_lower for w in ["lamp", "mug", "humidifier", "plug", "pillow"]):
                detected_category = "Home"
            elif any(w in msg_lower for w in ["notebook", "pen", "deskpad", "journal", "planner"]):
                detected_category = "Stationery"
            elif any(w in msg_lower for w in ["powerbank", "cable", "charger", "stand", "screenguard"]):
                detected_category = "Accessories"

        keywords = [w for w in msg_lower.split() if len(w) >= 3 and w not in ["the", "and", "for", "with", "show", "need", "want", "some", "budget", "under", "below"]]

        return detected_category, keywords

    async def process_chat(
        self, 
        message: str, 
        cart_items: List[Dict[str, Any]], 
        catalog: List[Dict[str, Any]], 
        session_id: Optional[str] = None,
        api_key: str = None
    ) -> Dict[str, Any]:
        
        active_key = api_key or os.getenv("OPENAI_API_KEY")
        
        # Priority 2 Edge Case: Check invalid negative budget input
        extracted_budget, is_invalid_negative = self.parse_budget_input(message)
        if is_invalid_negative:
            return {
                "reply": "I noticed an invalid budget amount. Could you please specify your budget as a positive number (e.g., 'my budget is 500')?",
                "recommendedProducts": [],
                "intentParsed": {"is_invalid_budget": True},
                "aiSource": "SellSense Input Validation Filter"
            }

        # Priority 1: Multi-Turn Conversation Memory Retrieval
        sess = None
        if session_id:
            sess = self.memory.get_or_create_session(session_id)

        # Update Session Memory (New values override old ones, unspecified values retain session memory)
        if sess is not None:
            if extracted_budget is not None:
                sess["budget"] = extracted_budget  # Override budget
            
            new_cat, new_kw = self.extract_category_and_keywords(message, catalog)
            if new_cat:
                sess["category"] = new_cat
            if new_kw:
                sess["keywords"] = list(set(sess["keywords"] + new_kw))
            
            effective_budget = sess["budget"]
            effective_category = sess["category"]
            effective_keywords = sess["keywords"]
        else:
            effective_budget = extracted_budget
            effective_category, effective_keywords = self.extract_category_and_keywords(message, catalog)

        # Priority 2: Filter catalog (Price <= Budget AND Stock > 0)
        in_stock_catalog = [p for p in catalog if p.get("stock", 0) > 0]
        
        if effective_budget is not None:
            within_budget_catalog = [p for p in in_stock_catalog if float(p.get("price", 0)) <= effective_budget]
        else:
            within_budget_catalog = in_stock_catalog

        # Handle case where budget is set but 0 products in catalog are <= budget
        if effective_budget is not None and not within_budget_catalog:
            in_stock_catalog.sort(key=lambda x: float(x.get("price", 0)))
            fallback_items = in_stock_catalog[:3]
            lowest_price = fallback_items[0]["price"] if fallback_items else 0

            return {
                "reply": f"No products found under ₹{effective_budget:,.0f}. Here are our lowest-priced available items (starting at ₹{lowest_price:,.0f}):",
                "recommendedProducts": fallback_items,
                "intentParsed": {"budget_extracted": effective_budget, "is_budget_exceeded_fallback": True},
                "aiSource": "SellSense Budget Protection Filter"
            }

        # Filter by Category & Keywords if present in session memory
        matching_candidates = within_budget_catalog
        if effective_category:
            cat_matches = [p for p in within_budget_catalog if p.get("category", "").lower() == effective_category.lower()]
            if cat_matches:
                matching_candidates = cat_matches

        # OpenAI LLM Intent Parsing with 5s Timeout (Priority 2 Robustness)
        if active_key and active_key.startswith("sk-"):
            try:
                client = OpenAI(api_key=active_key, timeout=5.0)
                prompt = f"""You are SellSense Conversational Shopping Assistant.
User Query: "{message}"
Merged Session Memory: Budget=₹{effective_budget if effective_budget else 'Any'}, Category={effective_category if effective_category else 'Any'}
Cart Subtotal: ₹{sum(i['price']*i.get('quantity',1) for i in cart_items)}
Available Candidates (Filtered price <= budget):
{json.dumps([{"id": p["id"], "name": p["name"], "category": p["category"], "price": p["price"], "stock": p["stock"]} for p in matching_candidates[:10]], indent=2)}

Select top 3 best matching items matching session memory & query. Return strictly valid JSON:
{{
  "category": "{effective_category or 'Accessories'}",
  "max_budget": {effective_budget if effective_budget else 'null'},
  "reply": "I found these top-rated options within your budget!",
  "recommended_ids": ["prod-1"]
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
                llm_matches = [p for p in matching_candidates if p["id"] in rec_ids]

                if llm_matches:
                    if sess:
                        sess["shown_product_ids"].extend([p["id"] for p in llm_matches])
                    budget_text = f" under ₹{effective_budget:,.0f}" if effective_budget else ""
                    return {
                        "reply": data.get("reply") or f"Here are the best matches found{budget_text}:",
                        "recommendedProducts": llm_matches,
                        "intentParsed": {"category": effective_category, "max_budget": effective_budget, "sessionId": session_id},
                        "aiSource": "SellSense OpenAI Conversational Agent"
                    }
            except Exception as e:
                print(f"[CHAT NOTE] OpenAI Chat LLM note/timeout ({e}), falling back to Python Grounded Intent Engine.")

        # Python Grounded Intent & Keyword Matching Engine
        scored = []
        for p in matching_candidates:
            score = float(p.get("rating", 4.5))
            p_text = (p["name"] + " " + p["category"] + " " + p.get("description", "")).lower()
            
            for kw in effective_keywords:
                if kw in p_text:
                    score += 1.0

            scored.append((score, p))

        scored.sort(key=lambda x: x[0], reverse=True)
        top_matches = [p for s, p in scored[:3]]

        # Record shown product IDs into session memory
        if sess:
            sess["shown_product_ids"].extend([p["id"] for p in top_matches])

        budget_txt = f" under ₹{effective_budget:,.0f}" if effective_budget else ""
        cat_txt = f" in {effective_category}" if effective_category else ""
        reply = f"I found {len(top_matches)} product(s){cat_txt}{budget_txt} matching your request:"

        return {
            "reply": reply,
            "recommendedProducts": top_matches,
            "intentParsed": {
                "budget_extracted": effective_budget, 
                "category_extracted": effective_category,
                "sessionId": session_id
            },
            "aiSource": "SellSense Conversational Session Agent"
        }

chat_agent = ConversationalChatAgent()
