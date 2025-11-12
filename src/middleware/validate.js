export const requireAdult = (req, res, next) => {
const { age } = req.body;
if (Number(age) < 18) return res.status(400).json({ success: false, msg: '18+ only' });
next();
};