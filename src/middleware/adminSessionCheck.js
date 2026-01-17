export default function adminSessionCheck(req, res, next) {
  if (!req.session || !req.session.admin) {
    return res.redirect("/login");
  }

  const MAX_IDLE_TIME = 12 * 60 * 1000; // 12 minutes
  const now = Date.now();

  if (!req.session.lastActivity) {
    req.session.lastActivity = now;
    return next();
  }

  if (now - req.session.lastActivity > MAX_IDLE_TIME) {
    return req.session.destroy(() => res.redirect("/login"));
  }

  req.session.lastActivity = now;
  next();
}
