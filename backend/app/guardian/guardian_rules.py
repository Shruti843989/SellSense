from typing import Dict, Any, List, Tuple

class GuardianHardRules:
    """
    Pure Python Guardian Hard Ceiling Constraints.
    These limits are non-negotiable rules enforced by the Guardian Agent BEFORE LLM reasoning.
    No LLM call can override a hard BLOCK triggered by this module.
    """
    # Hard ceiling limits
    MAX_ABSOLUTE_DISCOUNT_PERCENT = 15.0  # Discounts > 15% are strictly forbidden
    MAX_PRICE_RATIO_TO_CART = 0.50        # Item price > 50% of cart total is forbidden
    MAX_RECENT_ACTIONS_PER_MINUTE = 5     # Runaway agent protection (>5 actions in 30s)

    @classmethod
    def evaluate_hard_limits(
        cls, 
        action_type: str, 
        payload: Dict[str, Any], 
        context: Dict[str, Any]
    ) -> Tuple[bool, str, int]:
        """
        Evaluates hard bounds. Returns: (passed: bool, failure_reason: str, risk_score: int)
        """
        discount_pct = float(payload.get("discountPercent", payload.get("suggestedDiscount", 0)))
        item_price = float(payload.get("price", payload.get("finalPrice", 0)))
        cart_subtotal = float(context.get("cartSubtotal", context.get("total_amount", 0)))
        persona_budget = context.get("personaBudget")

        # 1. Discount Ceiling Gate (> 15%)
        if discount_pct > cls.MAX_ABSOLUTE_DISCOUNT_PERCENT:
            return (
                False, 
                f"GUARDIAN HARD BLOCK: Proposed discount of {discount_pct:.1f}% exceeds absolute Guardian safety ceiling of {cls.MAX_ABSOLUTE_DISCOUNT_PERCENT}%.", 
                95
            )

        # 2. Price Ratio Ceiling Gate (> 50% of Cart)
        if cart_subtotal > 0 and item_price > (cart_subtotal * cls.MAX_PRICE_RATIO_TO_CART):
            ratio = (item_price / cart_subtotal) * 100
            return (
                False, 
                f"GUARDIAN HARD BLOCK: Item price ₹{item_price:.0f} is {ratio:.1f}% of cart total (Exceeds Guardian 50% ratio ceiling).", 
                90
            )

        # 3. Persona Budget Contradiction Gate (AI Buyer overspend)
        if persona_budget and item_price > persona_budget:
            return (
                False, 
                f"GUARDIAN HARD BLOCK: Proposed transaction amount ₹{item_price:.0f} violates buyer persona max budget ceiling of ₹{persona_budget:.0f}.", 
                100
            )

        # 4. Rate Limiting Check
        recent_action_count = context.get("recentActionCount", 0)
        if recent_action_count >= cls.MAX_RECENT_ACTIONS_PER_MINUTE:
            return (
                False, 
                f"GUARDIAN HARD FLAG: Detected rapid execution rate ({recent_action_count} actions in window). Pausing agent activity for safety audit.", 
                80
            )

        return (True, "All Guardian hard safety ceiling checks passed.", 10)
