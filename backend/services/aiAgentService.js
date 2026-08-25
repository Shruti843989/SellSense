const { OpenAI } = require('openai');

/**
 * AI Agent Service: Formats prompt, queries OpenAI API (or runs semantic fallback engine),
 * and returns candidate suggestions with human-readable rationale.
 */

// Category complementary mapping for smart fallback logic
const COMPLEMENTARY_RULES = {
  "Audio": ["Accessories", "Electronics"],
  "Electronics": ["Accessories", "Audio"],
  "Accessories": ["Electronics", "Audio"]
};

async function getAISuggestions({ cartItems, catalog, apiKey }) {
  const activeApiKey = apiKey || process.env.OPENAI_API_KEY;
  const cartIds = new Set(cartItems.map(item => item.id));
  const availableCandidates = catalog.filter(prod => !cartIds.has(prod.id));

  if (availableCandidates.length === 0) {
    return [];
  }

  // Attempt OpenAI API call if key is provided
  if (activeApiKey && activeApiKey.startsWith('sk-')) {
    try {
      const openai = new OpenAI({ apiKey: activeApiKey });
      const prompt = `You are an expert e-commerce AI checkout agent.
Customer Cart Contents:
${cartItems.map(item => `- ${item.name} (${item.category}, Price: ₹${item.price}, Qty: ${item.quantity})`).join('\n')}

Available Product Catalog Candidates:
${availableCandidates.map(prod => `- ID: ${prod.id} | Name: ${prod.name} | Category: ${prod.category} | Price: ₹${prod.price} | Stock: ${prod.stock}`).join('\n')}

Select up to 3 candidate products that are most relevant to cross-sell or upsell with the current cart.
Return ONLY a valid JSON array in this exact format:
[
  {
    "productId": "prod-2",
    "rationale": "High-speed 10,000mAh magnetic power bank perfect for on-the-go charging alongside your smartwatch.",
    "suggestedDiscount": 10
  }
]`;

      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "You are a helpful e-commerce AI assistant that outputs strictly valid JSON arrays without markdown standard text." },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 400
      });

      const rawText = response.choices[0]?.message?.content || "[]";
      const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);

      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map(item => {
          const product = availableCandidates.find(p => p.id === item.productId);
          return {
            product,
            rationale: item.rationale || `Recommended addition for items in your cart.`,
            suggestedDiscount: item.suggestedDiscount || 10,
            aiSource: "OpenAI GPT-3.5"
          };
        }).filter(item => item.product);
      }
    } catch (err) {
      console.warn("⚠️ OpenAI API call failed or unconfigured, proceeding with AI Fallback Engine:", err.message);
    }
  }

  // Fallback Semantic Recommendation Engine
  // Analyzes cart categories and builds high-converting recommendations
  const cartCategories = [...new Set(cartItems.map(i => i.category))];
  const cartNames = cartItems.map(i => i.name.toLowerCase()).join(' ');

  const scoredCandidates = availableCandidates.map(prod => {
    let score = 0;
    let rationale = `Frequently bought with items in your cart.`;

    // Cross-category relevance score
    if (cartCategories.includes("Audio") && prod.category === "Accessories") {
      score += 40;
      rationale = `Essential pairing for your wireless audio experience.`;
    } else if (cartCategories.includes("Electronics") && prod.tags.includes("charging")) {
      score += 35;
      rationale = `Keep your electronic devices powered up with fast charging.`;
    } else if (cartCategories.includes("Accessories") && prod.category === "Electronics") {
      score += 30;
      rationale = `Upgrade your tech setup with this top-rated add-on.`;
    }

    // Specific item pairings
    if (cartNames.includes("headphone") || cartNames.includes("audio")) {
      if (prod.name.includes("Power Bank") || prod.name.includes("Cable")) {
        score += 25;
        rationale = `Keep your headphones charged on long commutes.`;
      }
    }
    if (cartNames.includes("smartwatch") || cartNames.includes("keyboard")) {
      if (prod.name.includes("Stand") || prod.name.includes("Cleaning")) {
        score += 20;
        rationale = `Maintain peak condition and ergonomics for your gear.`;
      }
    }

    // Small price items convert better
    if (prod.price <= 2000) score += 15;

    return {
      product: prod,
      score,
      rationale,
      suggestedDiscount: 10,
      aiSource: "AI Rule-Guided Recommender"
    };
  });

  // Sort by highest AI score
  scoredCandidates.sort((a, b) => b.score - a.score);

  // Return top candidates
  return scoredCandidates.slice(0, 3).map(c => ({
    product: c.product,
    rationale: c.rationale,
    suggestedDiscount: c.suggestedDiscount,
    aiSource: c.aiSource
  }));
}

module.exports = {
  getAISuggestions
};
