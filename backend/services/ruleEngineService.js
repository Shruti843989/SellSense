/**
 * Bounded & Gated Rule Engine Service
 * Enforces strict business and safety bounds on AI-generated suggestions BEFORE displaying them.
 * 
 * Rules:
 * 1. Stock Gate: Candidate item must have stock > 0.
 * 2. Price Cap Gate: Candidate item price must not exceed 30% of cart total subtotal.
 * 3. Max Suggestions Gate: Maximum 2 suggestions allowed per checkout session.
 * 4. Discount Cap Gate: Suggested discount rate capped at max 10%.
 */

function evaluateRuleEngine({ candidates, cartSubtotal }) {
  const MAX_PRICE_PERCENT = 0.30; // 30%
  const MAX_DISCOUNT_PERCENT = 10; // 10%
  const MAX_SUGGESTIONS_LIMIT = 2; // Max 2 suggestions

  const ruleResults = [];
  const approvedSuggestions = [];

  for (const candidate of candidates) {
    const { product, rationale, suggestedDiscount, aiSource } = candidate;
    
    // Check 1: In Stock Gate
    const stockPass = product.stock > 0;
    const stockDetail = stockPass 
      ? `In stock (${product.stock} units available)` 
      : `OUT OF STOCK (${product.stock} units left)`;

    // Check 2: 30% Price Cap Gate
    const maxAllowedPrice = cartSubtotal * MAX_PRICE_PERCENT;
    const priceRatio = cartSubtotal > 0 ? (product.price / cartSubtotal) * 100 : 100;
    const priceCapPass = product.price <= maxAllowedPrice;
    const priceCapDetail = priceCapPass
      ? `Price ₹${product.price} is ${priceRatio.toFixed(1)}% of cart total ₹${cartSubtotal.toFixed(0)} (Below 30% threshold)`
      : `REJECTED: Price ₹${product.price} is ${priceRatio.toFixed(1)}% of cart total ₹${cartSubtotal.toFixed(0)} (Exceeds 30% cap of ₹${maxAllowedPrice.toFixed(0)})`;

    // Check 3: Discount Cap Gate
    const effectiveDiscount = Math.min(suggestedDiscount || 0, MAX_DISCOUNT_PERCENT);
    const discountCapPass = (suggestedDiscount || 0) <= MAX_DISCOUNT_PERCENT;
    const discountCapDetail = discountCapPass
      ? `Discount ${effectiveDiscount}% within 10% limit`
      : `Adjusted discount from ${suggestedDiscount}% down to 10% cap`;

    // Overall candidate pass
    const overallPass = stockPass && priceCapPass;

    const evaluationLog = {
      productId: product.id,
      productName: product.name,
      productPrice: product.price,
      productStock: product.stock,
      cartSubtotal,
      rules: {
        stockGate: { pass: stockPass, detail: stockDetail },
        priceCapGate: { pass: priceCapPass, detail: priceCapDetail },
        discountCapGate: { pass: discountCapPass, detail: discountCapDetail }
      },
      overallPass,
      rejectionReason: !overallPass 
        ? (!stockPass ? "Out of Stock" : "Exceeds 30% Cart Price Threshold")
        : null
    };

    ruleResults.push(evaluationLog);

    if (overallPass) {
      // Calculate discounted price
      const finalPrice = Math.round(product.price * (1 - effectiveDiscount / 100));
      approvedSuggestions.push({
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        finalPrice,
        discountPercent: effectiveDiscount,
        category: product.category,
        image: product.image,
        stock: product.stock,
        rationale,
        aiSource,
        ruleCheckSummary: {
          stockGate: "PASSED",
          priceCapGate: `PASSED (${priceRatio.toFixed(1)}% of cart)`,
          discountCapGate: `PASSED (${effectiveDiscount}%)`
        }
      });
    }
  }

  // Check 4: Max Suggestions Limit Gate (Slice top 2)
  const cappedSuggestions = approvedSuggestions.slice(0, MAX_SUGGESTIONS_LIMIT);

  return {
    ruleResults,
    approvedSuggestions: cappedSuggestions,
    totalCandidatesEvaluated: candidates.length,
    passedCount: cappedSuggestions.length,
    blockedCount: candidates.length - cappedSuggestions.length,
    maxSuggestionsLimitApplied: approvedSuggestions.length > MAX_SUGGESTIONS_LIMIT
  };
}

module.exports = {
  evaluateRuleEngine
};
