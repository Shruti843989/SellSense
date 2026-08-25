const express = require('express');
const router = express.Router();
const { 
  getProducts, 
  updateProductStock, 
  saveOrder, 
  saveAuditLog, 
  getAuditLogs, 
  clearAuditLogs 
} = require('../database');
const { getAISuggestions } = require('../services/aiAgentService');
const { evaluateRuleEngine } = require('../services/ruleEngineService');
const { createRazorpayOrder, verifyPaymentSignature, DEFAULT_KEY_ID } = require('../services/razorpayService');

// 1. GET /api/products - Fetch product catalog
router.get('/products', async (req, res) => {
  try {
    const products = await getProducts();
    res.json({ success: true, products });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. POST /api/suggest - Trigger AI Upsell Agent + Bounded & Gated Rule Engine
router.post('/suggest', async (req, res) => {
  try {
    const { cartItems, apiKey, sessionId = `sess_${Date.now()}` } = req.body;

    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      return res.status(400).json({ success: false, error: "Cart items array is required" });
    }

    // Calculate cart subtotal
    const cartSubtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Fetch full store catalog
    const catalog = await getProducts();

    // Step A: Request AI Candidates from LLM / Agent
    const rawCandidates = await getAISuggestions({ cartItems, catalog, apiKey });

    // Step B: Run Bounded & Gated Rule Engine
    const ruleEvaluation = evaluateRuleEngine({ candidates: rawCandidates, cartSubtotal });

    // Step C: Persist Audit Trail Entry
    const auditId = `audit_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    const auditEntry = {
      id: auditId,
      session_id: sessionId,
      timestamp: new Date().toISOString(),
      cart_items: cartItems.map(i => ({ id: i.id, name: i.name, qty: i.quantity, price: i.price })),
      candidates_evaluated: rawCandidates.map(c => ({
        id: c.product.id,
        name: c.product.name,
        price: c.product.price,
        stock: c.product.stock,
        aiSource: c.aiSource
      })),
      rule_results: ruleEvaluation.ruleResults,
      final_suggestions: ruleEvaluation.approvedSuggestions,
      user_action: 'pending',
      payment_status: 'pending',
      failure_reason: null
    };

    await saveAuditLog(auditEntry);

    res.json({
      success: true,
      auditId,
      cartSubtotal,
      rawCandidatesCount: rawCandidates.length,
      totalEvaluated: ruleEvaluation.totalCandidatesEvaluated,
      passedCount: ruleEvaluation.passedCount,
      blockedCount: ruleEvaluation.blockedCount,
      ruleResults: ruleEvaluation.ruleResults,
      approvedSuggestions: ruleEvaluation.approvedSuggestions
    });
  } catch (err) {
    console.error("Error in /api/suggest:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. POST /api/suggest/action - Log user response to AI suggestion
router.post('/suggest/action', async (req, res) => {
  try {
    const { auditId, action, acceptedProducts = [] } = req.body;
    if (!auditId) return res.status(400).json({ success: false, error: "Audit ID is required" });

    const logs = await getAuditLogs();
    const existingLog = logs.find(l => l.id === auditId);
    
    if (existingLog) {
      existingLog.user_action = action; // 'accepted', 'skipped'
      existingLog.accepted_products = acceptedProducts;
      await saveAuditLog(existingLog);
    }

    res.json({ success: true, auditId, action });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. POST /api/payment/create-order - Create Razorpay Order
router.post('/payment/create-order', async (req, res) => {
  try {
    const { amount, receiptId, keyId, keySecret } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, error: "Valid amount is required" });
    }

    const orderData = await createRazorpayOrder({ amount, receiptId, keyId, keySecret });
    res.json(orderData);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. POST /api/payment/verify - Confirm successful Razorpay payment
router.post('/payment/verify', async (req, res) => {
  try {
    const { 
      auditId, 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature, 
      items, 
      total_amount,
      keySecret 
    } = req.body;

    const isValid = verifyPaymentSignature({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      keySecret
    });

    if (!isValid) {
      return res.status(400).json({ success: false, error: "Invalid Razorpay payment signature" });
    }

    // Save successful order
    const orderId = `ord_${Date.now()}`;
    const orderNumber = `RZP-ORD-${Math.floor(100000 + Math.random() * 900000)}`;
    
    const newOrder = await saveOrder({
      id: orderId,
      order_number: orderNumber,
      razorpay_order_id,
      razorpay_payment_id: razorpay_payment_id || `pay_sim_${Date.now()}`,
      total_amount,
      items,
      status: 'SUCCESS',
      failure_reason: null,
      created_at: new Date().toISOString()
    });

    // Deduct stock for all ordered items
    if (items && Array.isArray(items)) {
      for (const item of items) {
        await updateProductStock(item.id, item.quantity || 1);
      }
    }

    // Update audit log status
    if (auditId) {
      const logs = await getAuditLogs();
      const existingLog = logs.find(l => l.id === auditId);
      if (existingLog) {
        existingLog.payment_status = 'success';
        await saveAuditLog(existingLog);
      }
    }

    res.json({
      success: true,
      message: "Payment verified & order completed successfully",
      order: newOrder
    });
  } catch (err) {
    console.error("Payment verify error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. POST /api/payment/simulate-failure - Gracefully log and handle Razorpay payment failure case
router.post('/payment/simulate-failure', async (req, res) => {
  try {
    const { 
      auditId, 
      razorpay_order_id, 
      items, 
      total_amount, 
      failureReason = "Payment declined by issuing bank (Test Mode Simulation)" 
    } = req.body;

    const orderId = `ord_failed_${Date.now()}`;
    const orderNumber = `RZP-FAIL-${Math.floor(100000 + Math.random() * 900000)}`;

    const failedOrder = await saveOrder({
      id: orderId,
      order_number: orderNumber,
      razorpay_order_id: razorpay_order_id || `order_fail_${Date.now()}`,
      razorpay_payment_id: null,
      total_amount: total_amount || 0,
      items: items || [],
      status: 'FAILED',
      failure_reason: failureReason,
      created_at: new Date().toISOString()
    });

    // Update audit log failure status
    if (auditId) {
      const logs = await getAuditLogs();
      const existingLog = logs.find(l => l.id === auditId);
      if (existingLog) {
        existingLog.payment_status = 'failed';
        existingLog.failure_reason = failureReason;
        await saveAuditLog(existingLog);
      }
    }

    res.json({
      success: false,
      isHandledFailure: true,
      order: failedOrder,
      message: "Payment failure recorded gracefully in audit trail",
      retrySuggestions: [
        "Try using a different payment method (UPI / Cards in Test Mode)",
        "Remove high-value items or try a smaller cart size",
        "Click 'Retry Payment' to attempt transaction again"
      ]
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 7. GET /api/logs - Admin Audit Trail API + Analytics Metrics
router.get('/logs', async (req, res) => {
  try {
    const logs = await getAuditLogs();

    // Compute metrics
    const totalLogs = logs.length;
    let acceptedCount = 0;
    let skippedCount = 0;
    let blockedCount = 0;
    let totalUpsellRevenue = 0;

    logs.forEach(log => {
      if (log.user_action === 'accepted') acceptedCount++;
      if (log.user_action === 'skipped') skippedCount++;
      
      const candidates = log.candidates_evaluated || [];
      const suggestions = log.final_suggestions || [];
      blockedCount += Math.max(0, candidates.length - suggestions.length);

      if (log.user_action === 'accepted' && Array.isArray(log.accepted_products)) {
        log.accepted_products.forEach(p => {
          totalUpsellRevenue += (p.finalPrice || p.price || 0);
        });
      }
    });

    const conversionRate = totalLogs > 0 ? ((acceptedCount / totalLogs) * 100).toFixed(1) : "0.0";

    res.json({
      success: true,
      logs,
      metrics: {
        totalLogs,
        acceptedCount,
        skippedCount,
        blockedCount,
        conversionRate: `${conversionRate}%`,
        totalUpsellRevenue
      },
      defaultKeyId: DEFAULT_KEY_ID
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 8. POST /api/logs/clear - Utility to clear audit logs
router.post('/logs/clear', async (req, res) => {
  try {
    await clearAuditLogs();
    res.json({ success: true, message: "Audit logs cleared successfully" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
