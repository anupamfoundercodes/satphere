import { pool } from "../config/db.js";
import Razorpay from "razorpay";
import crypto from "crypto";
import Insta from "instamojo-nodejs";
import axios from "axios";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

//instamozo start
export const createInstamojoOrder = async (req, res) => {
  try {
    const { amount, currency = "INR", user_id, plan_id } = req.body;

    if (!amount || !user_id || !plan_id) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }

    // InstaMojo Environment
    const baseUrl =
      process.env.INSTAMOJO_ENV === "PROD"
        ? "https://www.instamojo.com/api/1.1/payment-requests/"
        : "https://test.instamojo.com/api/1.1/payment-requests/";

    // Unique Transaction ID
    const txnId = "IM_" + Date.now();

    // Create Payment Request
    const response = await axios.post(
      baseUrl,
      {
        purpose: `Plan_${plan_id}`,
        amount: amount,
        currency: currency,
        buyer_name: `User_${user_id}`,
        email: `user${user_id}@example.com`,
        phone: "9999999999",
        send_email: true,
        send_sms: true,
        allow_repeated_payments: false,
        redirect_url: "https://pookichat.codescards.com/payment/success", // ✅ Update as per frontend
      },
      {
        headers: {
          "X-Api-Key": process.env.INSTAMOJO_API_KEY,
          "X-Auth-Token": process.env.INSTAMOJO_AUTH_TOKEN,
        },
      }
    );

    const order = response.data;

    // DB में Save
    await pool.query(
      `INSERT INTO payments (user_id, plan_id, order_id, amount, currency, status, gateway_type, created_at, expire_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), DATE_ADD(NOW(), INTERVAL 1 DAY))`,
      [user_id, plan_id, txnId, amount, currency, "created", "instamojo"]
    );

    return res.json({
      success: true,
      gateway: "instamojo",
      payment_url: order.payment_request.longurl, // ✅ Frontend इस URL को open करेगा
      order,
    });
  } catch (err) {
    console.error("InstaMojo Order Error:", err.response?.data || err.message);
    return res.status(500).json({
      success: false,
      message: "Failed to create InstaMojo order",
       error: err.response?.data || err.message,
    });
  }
};

//instammozo end
// ✅ Order Create (pehle se banaya)
export const razorpayorder = async (req, res) => {
  try {
    const { user_id, plan_id, amount } = req.body;

    const options = {
      amount: amount * 100,
      currency: "INR",
      receipt: "order_" + Date.now(),
    };

    const order = await razorpay.orders.create(options);

    await pool.query(
      `INSERT INTO payments (user_id, plan_id, order_id, amount, currency, status, gateway_type)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [user_id, plan_id, order.id, amount, "INR", "pending", "razorpay"]
    );

    return res.json({
      success: true,
      message: "Razorpay order created",
      data: {
        order_id: order.id,
        amount: order.amount,
        currency: order.currency,
        gateway: "razorpay",
      },
    });
  } catch (err) {
    console.error("Razorpay Order Create Error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to create Razorpay order",
    });
  }
};

// ✅ Payment Verify
export const verifyPayment = async (req, res) => {
  try {
    const { order_id, payment_id, signature } = req.body;

    // Generate expected signature
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(order_id + "|" + payment_id)
      .digest("hex");

    if (expectedSignature === signature) {
      // Success → update DB
      await pool.query(
        `UPDATE payments 
         SET payment_id=?, signature=?, status=? 
         WHERE order_id=?`,
        [payment_id, signature, "success", order_id]
      );

      return res.json({
        success: true,
        message: "Payment verified successfully",
      });
    } else {
      // Failed → update DB
      await pool.query(
        `UPDATE payments 
         SET payment_id=?, signature=?, status=? 
         WHERE order_id=?`,
        [payment_id, signature, "failed", order_id]
      );

      return res.json({
        success: false,
        message: "Payment verification failed",
      });
    }
  } catch (err) {
    console.error("Razorpay Verify Error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error during verification",
    });
  }
};

export const createCashfreeOrder = async (req, res) => {
  try {
    const { amount, currency = "INR", user_id, plan_id } = req.body;

    if (!amount || !user_id || !plan_id) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }

    // Cashfree Order ID
    const orderId = "CF_" + Date.now();

    // Cashfree Environment
    const baseUrl =
      process.env.CASHFREE_ENV === "PROD"
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

    const order = response.data;

    // DB में Save
    await pool.query(
      `INSERT INTO payments (user_id, plan_id, order_id, amount, currency, status, gateway_type, created_at, expire_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), DATE_ADD(NOW(), INTERVAL 1 DAY))`,
      [user_id, plan_id, orderId, amount, currency, "created", "cashfree"]
    );

    return res.json({
      success: true,
      gateway: "cashfree",
      order,
    });
  } catch (err) {
    console.error("Cashfree Order Error:", err.response?.data || err.message);
    return res.status(500).json({
      success: false,
      message: "Failed to create Cashfree order",
    });
  }
};

export const paymentcheck = async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT name, img, status FROM payment_gateways ORDER BY id ASC"
    );

    if (rows.length === 0) {
      return res.json({
        success: false,
        message: "No payment gateways found",
        gateways: []
      });
    }

    const gateways = rows.map(g => ({
      name: g.name,
      img: g.img,
      status: g.status === 1 ? "active" : "inactive"
    }));

    return res.json({
      success: true,
      message: "Payment gateways fetched successfully",
      gateways
    });
  } catch (err) {
    console.error("Get Payment Gateways Error:", err);
    return res.status(200).json({
      success: false,
      message: "Server error",
      gateways: []
    });
  }
};


////////instamozo



