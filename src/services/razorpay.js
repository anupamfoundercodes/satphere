import Razorpay from 'razorpay';
import { env } from '../config/env.js';
import { pool } from "../config/db.js";

export const rzp = new Razorpay({
key_id: env.RAZORPAY_KEY_ID,
key_secret: env.RAZORPAY_KEY_SECRET
});


export const createOrder = async ({ amount, currency = 'INR', notes = {} }) => {
return rzp.orders.cre
}