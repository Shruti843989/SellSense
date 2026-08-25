import os
import json
from typing import List, Dict, Any
from openai import OpenAI

class CampaignOrchestratorAgent:
    """
    AI Campaign Orchestrator Agent:
    Takes slow-moving stock clusters identified by scikit-learn KMeans
    and proposes a targeted discount campaign with AI rationale.
    """
    def __init__(self):
        pass

    async def propose_campaign(
        self, 
        slow_moving_products: List[Dict[str, Any]], 
        api_key: str = None
    ) -> Dict[str, Any]:
        
        active_key = api_key or os.getenv("OPENAI_API_KEY")

        if not slow_moving_products:
            return {
                "campaign_name": "Standard Store Boost",
                "proposed_discount": 5.0,
                "duration_days": 3,
                "target_products": [],
                "rationale": "Inventory sales velocity is healthy across all categories."
            }

        target_prods = slow_moving_products[:3]  # Max 3 target items
        prod_names = ", ".join([p["name"] for p in target_prods])

        # Attempt OpenAI API call if key available
        if active_key and active_key.startswith("sk-"):
            try:
                client = OpenAI(api_key=active_key)
                prompt = f"""You are NudgeAI Campaign Orchestrator Agent.
scikit-learn KMeans clustering identified these slow-moving / overstocked products:
{json.dumps([{"id": p["id"], "name": p["name"], "stock": p["stock"], "sales_velocity": p.get("sales_velocity", 10)} for p in target_prods], indent=2)}

Propose an automated clearance discount campaign (Max 10% discount cap, max 7 days duration).
Return strictly JSON:
{{
  "campaign_name": "Overstock Velocity Clearance",
  "proposed_discount": 10.0,
  "duration_days": 7,
  "rationale": "Targeted 10% discount to accelerate turnover for slow-moving accessories with over 30 units in stock."
}}"""

                res = client.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=[
                        {"role": "system", "content": "You are a retail marketing AI orchestrator returning valid JSON."},
                        {"role": "user", "content": prompt}
                    ],
                    temperature=0.7,
                    max_tokens=300
                )
                raw = res.choices[0].message.content or "{}"
                clean_json = raw.replace("```json", "").replace("```", "").strip()
                data = json.loads(clean_json)

                return {
                    "campaign_name": data.get("campaign_name", "AI Inventory Velocity Boost"),
                    "proposed_discount": float(data.get("proposed_discount", 10.0)),
                    "duration_days": int(data.get("duration_days", 7)),
                    "target_products": target_prods,
                    "rationale": data.get("rationale") or f"Accelerate sales velocity for slow-moving items ({prod_names}).",
                    "ai_source": "OpenAI Campaign Agent"
                }
            except Exception as e:
                print(f"[CAMPAIGN NOTE] OpenAI Campaign LLM note: {e}, using Python Agentic Campaign Synthesizer.")

        # Fallback Python Agentic Campaign Synthesizer
        return {
            "campaign_name": "KMeans Slow-Stock Velocity Flash Sale",
            "proposed_discount": 10.0,
            "duration_days": 7,
            "target_products": target_prods,
            "rationale": f"KMeans clustering flagged overstocked inventory ({prod_names}). Applying automated 10% discount cap for 7 days to optimize turnover.",
            "ai_source": "Python KMeans & Agentic Campaign Synthesizer"
        }

campaign_agent = CampaignOrchestratorAgent()
