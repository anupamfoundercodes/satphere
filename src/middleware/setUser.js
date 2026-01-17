

import jwt from "jsonwebtoken";
import { pool } from "../config/db.js";

export default async function setUser(req, res, next) {
  res.locals.admin = null; // default

  const token = req.cookies.token;
  if (!token) return next();

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const adminId = decoded.id;

    const [results] = await pool.query(
      "SELECT * FROM admin WHERE id = ? AND status = 'active'",
      [adminId]
    );

    if (results.length === 0) {
      res.locals.admin = null;
    } else {
      res.locals.admin = results[0];
    }
  } catch (err) {
    res.locals.admin = null;
  }

  next();
}
