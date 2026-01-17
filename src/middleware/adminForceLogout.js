import jwt from "jsonwebtoken";
import { pool } from "../config/db.js";

export default async function adminForceLogout(req, res, next) {
  const token = req.cookies.token;
  if (!token) return res.redirect("/login");

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const [rows] = await pool.query(
      "SELECT updated_at FROM admin WHERE id = ? AND status = 'active'",
      [decoded.id]
    );

    if (!rows.length) {
      res.clearCookie("token");
      return res.redirect("/login");
    }

    const dbTime = new Date(rows[0].updated_at).getTime();
    const jwtTime = new Date(decoded.login_time).getTime();

    // 🔥 password / profile change detected
    if (dbTime !== jwtTime) {
      res.clearCookie("token");
      return res.redirect("/login");
    }

    next();
  } catch (err) {
    res.clearCookie("token");
    return res.redirect("/login");
  }
}
