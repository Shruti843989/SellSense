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
    Performs statistical anomaly detection + rolling window behavioral drift detection + LLM risk reasoning.
    Fails SAFE by defaulting to BLOCK if an error occurs.
    """
    def __init__(self):
        # Historical baseline statistics for z-score anomaly calculation
        self.baseline_discounts = [0.0, 5.0, 10.0, 8.0, 10.0, 5.0, 10.0, 0.0]
        self.baseline_price_ratios = [0.10, 0.15, 0.20, 0.25, 0.18, 0.22, 0.12]
        self.baseline_avg_price = 1500.0

        # Rolling window history for Behavioral Drift Detection (Priority 6)
        self.recent_history: List[Dict[str, Any]] = []
        self.max_window_size = 20

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

    def check_behavioral_drift(self, payload: Dict[str, Any]) -> Tuple[bool, str, Dict[str, Any]]:
        """
        Priority 6: Rolling Window Behavioral Drift Detector (Last 20 suggestions).
        Detects sudden price spikes (>35% shift) or category hyper-concentration (>70%).
        Returns: (drift_detected: bool, drift_reason: str, metrics: Dict)
        """
        item_price = float(payload.get("price", payload.get("finalPrice", 0)))
        item_category = payload.get("category", "General")

        if item_price > 0:
            self.recent_history.append({
                "price": item_price,
                "category": item_category,
                "timestamp": time.time()
            })
            if len(self.recent_history) > self.max_window_size:
                self.recent_history.pop(0)

        n = len(self.recent_history)
        if n < 5:
            return False, "Insufficient history for drift analysis", {
                "status": "HEALTHY",
                "sampleCount": n,
                "recentAvgPrice": item_price,
                "priceShiftPct": 0.0,
                "categoryConcentrationPct": 0.0
            }

        prices = [i["price"] for i in self.recent_history]
        recent_avg = float(np.mean(prices))
        price_shift_pct = (recent_avg - self.baseline_avg_price) / self.baseline_avg_price

        # Category concentration ratio
        cat_counts = {}
        for i in self.recent_history:
            c = i["category"]
            cat_counts[c] = cat_counts.get(c, 0) + 1
        max_cat_count = max(cat_counts.values()) if cat_counts else 0
        cat_concentration = max_cat_count / n

        drift_detected = False
        drift_reason = ""

        if price_shift_pct > 0.35:
            drift_detected = True
            drift_reason = f"Behavioral Drift: Average suggested price (₹{recent_avg:,.0f}) has increased {price_shift_pct*100:.1f}% above baseline in last {n} recommendations."
        elif cat_concentration > 0.70:
            drift_detected = True
            drift_reason = f"Behavioral Drift: High category concentration ({cat_concentration*100:.1f}% in single category) detected in last {n} recommendations."

        metrics = {
            "status": "DRIFT_DETECTED" if drift_detected else "HEALTHY",
            "sampleCount": n,
            "recentAvgPrice": round(recent_avg, 2),
            "priceShiftPct": round(price_shift_pct * 100, 1),
            "categoryConcentrationPct": round(cat_concentration * 100, 1),
            "driftReason": drift_reason if drift_detected else "Operating within normal behavioral baseline bounds"
        }

        return drift_detected, drift_reason, metrics

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
        3. Rolling Window Behavioral Drift Detection (Priority 6)
        4. LLM Safety Supervisor
        Fails SAFE by blocking by default on any error.
        """
        try:
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

            # Step 3: Priority 6 Behavioral Drift Check
            drift_detected, drift_reason, drift_metrics = self.check_behavioral_drift(payload)

            # Step 4: LLM Reasoning Safety Check
            active_key = api_key or os.getenv("OPENAI_API_KEY")
            reasoning = ""
            verdict = "APPROVE"
            risk_score = int(stat_score)

            if active_key and active_key.startswith("sk-"):
                try:
                    client = OpenAI(api_key=active_key, timeout=5.0)
                    prompt = f"""You are the SellSense Guardian Safety Supervisor Agent.
Supervised Agent: {agent_name}
Action Type: {action_type}
Proposed Action Payload: {json.dumps(payload, indent=2)}
Context: {json.dumps(context, indent=2)}
Statistical Anomaly Score: {stat_score}/100
Statistical Flags: {json.dumps(stat_flags)}
Behavioral Drift Status: {drift_metrics['status']} ({drift_metrics['driftReason']})

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
                    print(f"[GUARDIAN NOTE] LLM call note/timeout ({e}), using Python Guardian Safety Synthesizer.")

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

            # Priority 6: Drift Flagging (FLAG_FOR_REVIEW alert, not auto-block)
            if drift_detected and verdict == "APPROVE":
                verdict = "FLAG_FOR_REVIEW"
                risk_score = max(risk_score, 65)
                reasoning = f"{reasoning} | {drift_reason}"

            is_approved = verdict == "APPROVE"

            return {
                "verdict": verdict,
                "riskScore": risk_score,
                "statisticalScore": stat_score,
                "reasoning": reasoning,
                "driftMetrics": drift_metrics,
                "stage": "Guardian Dual-Stage Audit (Stats + Drift + LLM)",
                "isApproved": is_approved
            }

        except Exception as err:
            # FAIL-SAFE SECURITY POLICY: Fail SAFE (BLOCK by default on any error)
            print(f"[GUARDIAN CRITICAL] Guardian Agent exception encountered ({err}). FAILING SAFE -> BLOCKED.")
            return {
                "verdict": "BLOCK",
                "riskScore": 100,
                "statisticalScore": 100.0,
                "reasoning": f"System Fail-Safe: Guardian Safety Agent error encountered ({str(err)}). Action blocked for safety.",
                "stage": "Guardian Fail-Safe Exception Handler",
                "isApproved": False
            }

guardian_agent = GuardianAgent()
