from typing import List, Dict, Any

class PythonRuleEngine:
    """
    Pure Python Bounded & Gated Rule Engine.
    Executes AFTER the ML Agent proposes candidates/campaigns and BEFORE presenting to customers or merchants.
    
    Cart Rules:
    1. Stock Gate: Candidate product stock > 0.
    2. 30% Cart Price Cap Gate: Candidate price <= 0.30 * cart_subtotal.
    3. Max Suggestions Gate: Maximum 2 suggestions allowed per checkout session.
    4. Discount Cap Gate: Suggested discount capped at max 10%.

    Campaign Rules:
    1. Campaign Discount Cap: Max 10% discount allowed.
    2. Campaign Duration Cap: Max 7 days duration allowed.
    3. Max Target Products Cap: Max 3 products per campaign.
    """

    MAX_PRICE_PERCENT = 0.30  # 30% of cart total
    MAX_DISCOUNT_PERCENT = 10.0  # 10%
    MAX_SUGGESTIONS_LIMIT = 2

    MAX_CAMPAIGN_DISCOUNT = 10.0
    MAX_CAMPAIGN_DURATION = 7  # Days
    MAX_CAMPAIGN_PRODUCTS = 3

    def evaluate(self, agent_candidates: List[Dict[str, Any]], cart_subtotal: float) -> Dict[str, Any]:
        rule_results = []
        approved_suggestions = []

        for candidate in agent_candidates:
            product = candidate["product"]
            rationale = candidate["rationale"]
            suggested_discount = candidate.get("suggestedDiscount", 10)
            ml_metrics = candidate.get("ml_metrics", {})
            ai_source = candidate.get("ai_source", "Python ML Agent")

            p_price = float(product["price"])
            p_stock = int(product["stock"])

            # Rule 1: Stock Check Gate
            stock_pass = p_stock > 0
            stock_detail = f"In stock ({p_stock} units left)" if stock_pass else f"OUT OF STOCK ({p_stock} units)"

            # Rule 2: 30% Cart Price Cap Gate
            max_allowed_price = cart_subtotal * self.MAX_PRICE_PERCENT
            price_ratio = (p_price / cart_subtotal * 100) if cart_subtotal > 0 else 100.0
            price_pass = p_price <= max_allowed_price
            price_detail = (
                f"Price ₹{p_price:.0f} is {price_ratio:.1f}% of cart total ₹{cart_subtotal:.0f} (Below 30% limit)"
                if price_pass
                else f"REJECTED: Price ₹{p_price:.0f} is {price_ratio:.1f}% of cart total ₹{cart_subtotal:.0f} (Exceeds 30% cap of ₹{max_allowed_price:.0f})"
            )

            # Rule 3: Discount Cap Gate
            effective_discount = min(suggested_discount, self.MAX_DISCOUNT_PERCENT)
            discount_pass = suggested_discount <= self.MAX_DISCOUNT_PERCENT
            discount_detail = (
                f"Discount {effective_discount}% within 10% limit"
                if discount_pass
                else f"Adjusted discount from {suggested_discount}% to 10% cap"
            )

            # Candidate Overall Evaluation
            overall_pass = stock_pass and price_pass

            evaluation_log = {
                "productId": product["id"],
                "productName": product["name"],
                "productPrice": p_price,
                "productStock": p_stock,
                "cartSubtotal": cart_subtotal,
                "ml_metrics": ml_metrics,
                "rules": {
                    "stockGate": {"pass": stock_pass, "detail": stock_detail},
                    "priceCapGate": {"pass": price_pass, "detail": price_detail},
                    "discountCapGate": {"pass": discount_pass, "detail": discount_detail}
                },
                "overallPass": overall_pass,
                "rejectionReason": None if overall_pass else ("Out of Stock" if not stock_pass else "Exceeds 30% Cart Price Threshold")
            }

            rule_results.append(evaluation_log)

            if overall_pass:
                final_price = round(p_price * (1 - effective_discount / 100.0))
                approved_suggestions.append({
                    "id": product["id"],
                    "name": product["name"],
                    "description": product["description"],
                    "price": p_price,
                    "finalPrice": final_price,
                    "discountPercent": effective_discount,
                    "category": product["category"],
                    "image": product["image"],
                    "stock": p_stock,
                    "rationale": rationale,
                    "ml_metrics": ml_metrics,
                    "ai_source": ai_source,
                    "ruleCheckSummary": {
                        "stockGate": "PASSED",
                        "priceCapGate": f"PASSED ({price_ratio:.1f}% of cart)",
                        "discountCapGate": f"PASSED ({effective_discount}%)"
                    }
                })

        capped_approved = approved_suggestions[:self.MAX_SUGGESTIONS_LIMIT]

        return {
            "rule_results": rule_results,
            "approved_suggestions": capped_approved,
            "total_evaluated": len(agent_candidates),
            "passed_count": len(capped_approved),
            "blocked_count": len(agent_candidates) - len(capped_approved)
        }

    def evaluate_campaign(self, campaign_proposal: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validates proposed AI Campaign against merchant risk gates.
        """
        raw_discount = float(campaign_proposal.get("proposed_discount", 10.0))
        raw_duration = int(campaign_proposal.get("duration_days", 7))
        target_prods = campaign_proposal.get("target_products", [])

        # Enforce Discount Cap
        effective_discount = min(raw_discount, self.MAX_CAMPAIGN_DISCOUNT)
        discount_gate = raw_discount <= self.MAX_CAMPAIGN_DISCOUNT

        # Enforce Duration Cap
        effective_duration = min(raw_duration, self.MAX_CAMPAIGN_DURATION)
        duration_gate = raw_duration <= self.MAX_CAMPAIGN_DURATION

        # Enforce Product Count Cap & Stock check
        valid_prods = [p for p in target_prods if p.get("stock", 0) > 0][:self.MAX_CAMPAIGN_PRODUCTS]
        prods_gate = len(valid_prods) > 0

        overall_pass = discount_gate and duration_gate and prods_gate

        return {
            "campaign_name": campaign_proposal.get("campaign_name", "AI Campaign"),
            "discount_percent": effective_discount,
            "duration_days": effective_duration,
            "target_products": valid_prods,
            "rationale": campaign_proposal.get("rationale"),
            "rules_check": {
                "discountCapGate": {"pass": discount_gate, "detail": f"{effective_discount}% (Max {self.MAX_CAMPAIGN_DISCOUNT}%)"},
                "durationCapGate": {"pass": duration_gate, "detail": f"{effective_duration} Days (Max {self.MAX_CAMPAIGN_DURATION} Days)"},
                "targetProductsGate": {"pass": prods_gate, "detail": f"{len(valid_prods)} In-Stock Items Selected (Max {self.MAX_CAMPAIGN_PRODUCTS})"}
            },
            "overallPass": overall_pass
        }

rule_engine = PythonRuleEngine()
