import os
import json
import time
import numpy as np
from typing import List, Dict, Any, Tuple
from openai import OpenAI

from app.guardian.guardian_rules import GuardianHardRules

class GuardianAgent:
    """
    Guardian Agent:
    Independent AI oversight layer supervising main agents (Upsell Agent, AI Buyer, Chat Assistant).
    Performs statistical anomaly detection + LLM risk reasoning + hard rule enforcement.
    """
    def __init__(self):
        # Historical baseline statistics for z-score anomaly calculation
        self.baseline_discounts = [0.0, 5.0, 10.0, 8.0, 10.0, 5.0, 10.0, 0.0]
        self.baseline_price_ratios = [0.10, 0.15, 0.20, 0.25, 0.18, 0.22, 0.12]

    def compute_statistical_anomaly(self, payload: Dict[str, Any], context: Dict[str, Any]) -> Tuple[float, List[str]]:
        """
        Stage 1: Statistical Anomaly Engine (Pure Python stats, no LLM)
        Computes z-score deviation against historical baseline.
        Returns: (anomaly_score: float, anomaly_flags: List[str])
        """
        discount_pct = float(payload.get("discountPercent", payload.get("suggestedDiscount", 0)))
        item_price = float(payload.get("price", payload.get("finalPrice", 0)))
        cart_subtotal = float(context.get("cartSubtotal", context.get("total_amount", 1000)))

        flags = []
        scores = []

        # 1. Discount Z-Score
        if len(self.baseline_discounts) >= 3:
            mean_disc = np.mean(self.baseline_discounts)
            std_disc = np.std(self.baseline_discounts) or 1.0
            z_disc = (discount_pct - mean_disc) / std_disc
            if z_disc > 2.0:
                flags.append(f"Statistical Anomaly: Discount {discount_pct}% is {z_disc:.2f} std-devs above mean ({mean_disc:.1f}%)")
            scores.append(abs(z_disc) * 15.0)

        # 2. Cart Price Ratio Z-Score
        if cart_subtotal > 0 and len(self.baseline_price_ratios) >= 3:
            ratio = item_price / cart_subtotal
            mean_ratio = np.mean(self.baseline_price_ratios)
            std_ratio = np.std(self.baseline_price_ratios) or 0.05
            z_ratio = (ratio - mean_ratio) / std_ratio
            if z_ratio > 2.0:
                flags.append(f"Statistical Anomaly: Cart price ratio {ratio*100:.1f}% is {z_ratio:.2f} std-devs above average")
            scores.append(abs(z_ratio) * 15.0)

        total_anomaly_score = float(np.clip(np.sum(scores), 0, 100))
        return round(total_anomaly_score, 2), flags

    async def review_action(
        self, 
        agent_name: str, 
        action_type: str, 
        payload: Dict[str, Any], 
        context: Dict[str, Any],
        api_key: str = None
    ) -> Dict[str, Any]:
        """
        Main Guardian Review Checkpoint.
        Processes proposed action through:
        1. Hard Ceiling Rules
        2. Statistical Anomaly Engine
        3. LLM Safety Supervisor
        Returns: { verdict: "APPROVE"|"FLAG_FOR_REVIEW"|"BLOCK", risk_score: int, reasoning: str }
        """
        # Step 1: Evaluate Pure Python Hard Ceilings FIRST
        passed_hard, hard_reason, hard_risk = GuardianHardRules.evaluate_hard_limits(action_type, payload, context)
        if not passed_hard:
            verdict = "BLOCK" if "BLOCK" in hard_reason else "FLAG_FOR_REVIEW"
            return {
                "verdict": verdict,
                "riskScore": hard_risk,
                "statisticalScore": 85.0,
                "reasoning": hard_reason,
                "stage": "Guardian Hard Safety Ceiling",
                "isApproved": False
            }

        # Step 2: Compute Statistical Anomaly Score
        stat_score, stat_flags = self.compute_statistical_anomaly(payload, context)

        # Step 3: LLM Reasoning Safety Check
        active_key = api_key or os.getenv("OPENAI_API_KEY")
        reasoning = ""
        verdict = "APPROVE"
        risk_score = int(stat_score)

        if active_key and active_key.startswith("sk-"):
            try:
                client = OpenAI(api_key=active_key)
                prompt = f"""You are the NudgeAI Guardian Safety Supervisor Agent.
Supervised Agent: {agent_name}
Action Type: {action_type}
Proposed Action Payload: {json.dumps(payload, indent=2)}
Context: {json.dumps(context, indent=2)}
Statistical Anomaly Score: {stat_score}/100
Statistical Flags: {json.dumps(stat_flags)}

Analyze if this proposed action is safe, bounded, and ethical for customer checkout.
Return ONLY valid JSON:
{{
  "verdict": "APPROVE",
  "risk_score": 15,
  "explanation": "Action is within normal operating bounds. Discount and item price ratio are appropriate."
}}"""
                res = client.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=[
                        {"role": "system", "content": "You are an independent AI safety supervisor. Return strictly valid JSON."},
                        {"role": "user", "content": prompt}
                    ],
                    temperature=0.3,
                    max_tokens=250
                )
                raw = res.choices[0].message.content or "{}"
                clean = raw.replace("```json", "").replace("```", "").strip()
                parsed = json.loads(clean)

                verdict = parsed.get("verdict", "APPROVE").upper()
                risk_score = int(parsed.get("risk_score", stat_score))
                reasoning = parsed.get("explanation") or "Guardian LLM supervision verified action safety."
            except Exception as e:
                print(f"[GUARDIAN NOTE] LLM call note: {e}, using Python Guardian Safety Synthesizer.")

        if not reasoning:
            # Fallback Python Guardian Safety Synthesizer
            if stat_flags:
                verdict = "FLAG_FOR_REVIEW"
                risk_score = max(risk_score, 60)
                reasoning = f"Guardian flagged action due to statistical deviation: {'; '.join(stat_flags)}"
            else:
                verdict = "APPROVE"
                risk_score = min(risk_score, 20)
                reasoning = f"Guardian verified: Action by {agent_name} strictly respects price caps, stock limits, and statistical baselines."

        is_approved = verdict == "APPROVE"

        return {
            "verdict": verdict,
            "riskScore": risk_score,
            "statisticalScore": stat_score,
            "reasoning": reasoning,
            "stage": "Guardian Dual-Stage Audit (Stats + LLM)",
            "isApproved": is_approved
        }

guardian_agent = GuardianAgent()
