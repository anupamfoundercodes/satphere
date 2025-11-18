import { pool } from "../config/db.js";
import crypto from "crypto";
import axios from "axios";

// ✅ Payment Verify
export const verifyPayment = async (req, res) => {
  try {
    const { order_id, status } = req.body;

    // Validate
    if (!order_id) return res.status(400).json({ message: "order_id is required" });
    if (!status) return res.status(400).json({ message: "status is required" });

    if (!["pending","success", "failed"].includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    // Fetch payment
    const [rows] = await pool.query(
      "SELECT * FROM payments WHERE order_id = ? LIMIT 1",
      [order_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: `No payment found with order_id: ${order_id}` });
    }

    const payment = rows[0];
    const plan_id = payment.plan_id; // ⭐ यहीं से plan_id ले रहे हैं

    // Only pending can be updated
		if (!["pending", "created"].includes(payment.status)) {
		  return res.status(400).json({
			message: "Only pending or created payments can be updated",
		  });
		}

    // ---------- SUCCESS CASE ----------
    if (status === "success") {

      // fetch plan from DB
      const [planRows] = await pool.query(
        "SELECT perks, days FROM plans WHERE id = ? LIMIT 1",
        [plan_id]
      );

      if (planRows.length === 0) {
        return res.status(404).json({ message: "Plan not found" });
      }

      const plan = planRows[0];

      // Parse perks JSON safely
      let perks = {};
      try {
        perks = JSON.parse(plan.perks || "{}");
      } catch (e) {
        console.error("Invalid perks JSON:", plan.perks);
      }

      // Dates
      const days = plan.days;
      const createdAt = new Date();
      const expireAt = new Date();
      expireAt.setDate(expireAt.getDate() + (plan.days || 0));

      // Normalize
      const normalize = (val) => {
        if (val === true) return "true";
        if (val === false) return "false";
        if (typeof val === "number") return val.toString();
        if (typeof val === "string" && val.trim() !== "") return val.trim();
        return "false";
      };

      // Update payment
      await pool.query(
        `UPDATE payments 
         SET day=?, status=?, created_at=?, expire_at=?,
             Filter_Both=?, Filter_Gender=?, Filter_Region=?, 
             No_Ads=?, Rear_Camra=?
         WHERE order_id=?`,
        [
          days,
          status,
          createdAt,
          expireAt,
          normalize(perks["Swipe"]),
          normalize(perks["Message"]),
          normalize(perks["Profile"]),
          normalize(perks["Audio"]),
          normalize(perks["Video"]),
          order_id
        ]
      );

      return res.status(200).json({
        message: "Payment verified and updated successfully",
        updated_status: status,
        plan_id: plan_id,
      });
    }

    // ---------- FAILED CASE ----------
    await pool.query(
      "UPDATE payments SET status=? WHERE order_id=?",
      [status, order_id]
    );

    return res.status(200).json({
      message: `Payment marked as ${status}`,
      plan_id: plan_id,
    });

  } catch (error) {
    console.error("Error in verifyPayment:", error);
    return res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
};


export const createCashfreeOrder = async (req, res) => {
  try {
    const { amount, currency = "INR", user_id, plan_id } = req.body;

    if (!amount || !user_id || !plan_id) {
      return res
        .status(400)
        .json({  message: "Missing required fields" });
    }

    // Cashfree Order ID
    const orderId = "CF_" + Date.now();

    // Cashfree Environment
    const baseUrl =
      process.env.CASHFREE_ENV == "PROD"
        ? "https://api.cashfree.com/pg/orders"
        : "https://sandbox.cashfree.com/pg/orders";

    // API Call to Cashfree
    const response = await axios.post(
      baseUrl,
      {
        order_id: orderId,
        order_amount: amount,
        order_currency: currency,
        customer_details: {
          customer_id: String(user_id),
          customer_email: `user${user_id}@example.com`,
          customer_phone: "9999999999",
        },
      },
      {
        headers: {
          "x-client-id": process.env.CASHFREE_APP_ID,
          "x-client-secret": process.env.CASHFREE_SECRET_KEY,
          "x-api-version": "2022-09-01",
          "Content-Type": "application/json",
        },
      }
    );

    const data = response.data;

    // DB में Save
    await pool.query(
      `INSERT INTO payments (user_id, plan_id, order_id, amount, currency, status, gateway_type, created_at, expire_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), DATE_ADD(NOW(), INTERVAL 1 DAY))`,
      [user_id, plan_id, orderId, amount, currency, "created", "cashfree"]
    );

    return res.json({
      success: true,
      gateway: "cashfree",
      data,
    });
  } catch (err) {
    console.error("Cashfree Order Error:", err.response?.data || err.message);
    return res.status(500).json({
      success: err.message,
      message: "Failed to create Cashfree order",
    });
  }
};


