import express from "express";
import bodyParser from "body-parser";
import Insta from "instamojo-nodejs";
import { verifyPayment, createCashfreeOrder} from "../controllers/paymentController.js";

const router = express.Router();

// Payment gateway list API


router.post("/verifyPayment", verifyPayment);

router.post("/cashfree", createCashfreeOrder);

// --- API Key & Auth Token सेट करो ---
Insta.setKeys("YOUR_API_KEY", "YOUR_AUTH_TOKEN");

// Sandbox (test mode) on
Insta.isSandboxMode(true);

// -------- Payment Request API --------
router.post("/pay", (req, res) => {
  const { name, email, phone, amount } = req.body;

  var data = new Insta.PaymentData();

  data.purpose = "Test Payment"; // Payment reason
  data.amount = amount;          // Amount
  data.buyer_name = name;
  data.email = email;
  data.phone = phone;
  data.redirect_url = "http://localhost:5000/success"; // Success redirect
  data.send_email = true;
  data.send_sms = true;

  Insta.createPayment(data, function (error, response) {
    if (error) {
      console.log(error);
      res.status(500).json({ success: false, error });
    } else {
      const responseData = JSON.parse(response);
      const paymentUrl = responseData.payment_request.longurl;
      res.json({ success: true, paymentUrl });
    }
  });
});

// -------- Success Callback --------
router.get("/success", (req, res) => {
  // Instamojo sends payment_id & request_id in query
  res.send("Payment Success ✅ Details: " + JSON.stringify(req.query));
});

export default router;
