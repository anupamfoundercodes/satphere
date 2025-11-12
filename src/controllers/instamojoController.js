import { pool } from "../config/db.js";

export const createManualPayment = async (req, res) => {
  try {
    const { user_id, plan_id, amount, currency = "INR", day } = req.body;

    if (!user_id || !plan_id || !amount) {
      return res.status(200).json({
        success: false,
        message: "Missing required fields",
      });
    }

    if (!day) {
      return res.status(200).json({
        success: false,
        message: "Missing day field",
      });
    }

    // Unique order id for manual payment
    const orderId = "ORD" + Date.now();

    // Insert into payments table
    await pool.query(
      `INSERT INTO payments 
        (user_id, plan_id, order_id, amount, currency, status, gateway_type, created_at, expire_at, day) 
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), DATE_ADD(NOW(), INTERVAL ? DAY), ?)`,

      [user_id, plan_id, orderId, amount, currency, "pending", "manual", day, day]
    );

    // Fetch admin UPI details
    const [adminRows] = await pool.query(
      `SELECT qr_code, upi_id FROM admin LIMIT 1`
    );

    let qrCodeUrl = null;
    let upiId = null;

    if (adminRows.length > 0) {
      qrCodeUrl = adminRows[0].qr_code
        ? `${process.env.APP_URL}${adminRows[0].qr_code}`
        : null;
      upiId = adminRows[0].upi_id || null;
    }

    return res.json({
      success: true,
      message: "Manual payment request created, wait for admin verification.",
      order_id: orderId,
      payment: {
        user_id,
        plan_id,
        amount,
        currency,
        status: "pending",
        gateway_type: "manual",
        day,
      },
      admin_payment_details: {
        qr_code: qrCodeUrl,
        upi_id: upiId,
      },
    });
  } catch (err) {
    console.error("Manual Payment Error:", err.message);
    return res.status(200).json({
      success: false,
      message: "Something went wrong",
      error: err.message,
    });
  }
};


// ---------------- Submit Payment ----------------
export const submitPayment = async (req, res) => {
  try {
    const { order_id, payment_id } = req.body;

    if (!order_id || !payment_id) {
      return res.status(200).json({ success: false, message: "order_id and payment_id required" });
    }

    // 1️⃣ Check if order exists
    const [orderRows] = await pool.query("SELECT * FROM payments WHERE order_id = ?", [order_id]);
    if (orderRows.length === 0) {
      return res.status(200).json({ success: false, message: "Order not found" });
    }

    // 2️⃣ Check if this order already has a payment
    if (orderRows[0].payment_id) {
      return res.status(200).json({ success: false, message: "Payment already submitted for this order" });
    }

    // 3️⃣ Check if this payment_id is already used for another order
    const [paymentRows] = await pool.query("SELECT * FROM payments WHERE payment_id = ?", [payment_id]);
    if (paymentRows.length > 0) {
      return res.status(200).json({ success: false, message: "Payment ID already exists for another order" });
    }

    // 4️⃣ Update the payment
    await pool.query(
      "UPDATE payments SET payment_id = ? WHERE order_id = ?",
      [payment_id, order_id]
    );

    return res.json({
      success: true,
      message: "Payment submitted successfully",
      data: { order_id, payment_id },
    });
  } catch (error) {
    console.error("Submit Payment Error:", error);
    return res.status(200).json({ success: false, message: "Something went wrong", error: error.message });
  }
};

