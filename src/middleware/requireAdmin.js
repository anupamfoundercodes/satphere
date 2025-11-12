// src/middleware/requireAdmin.js
export default function requireAdmin(req, res, next) {
  if (!res.locals.admin) {
    return res.redirect('/login');
  }
  next();
}
