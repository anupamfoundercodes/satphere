//middleware/auth.js

import { verifyJWT } from '../services/jwt.js';


export const authRequired = (req, res, next) => {
const token = req.headers.authorization?.split(' ')[1] || req.cookies?.token;
if (!token) return res.status(401).json({ success: false, msg: 'Unauthorized' });
try {
const decoded = verifyJWT(token);
req.user = decoded; // { id, email, is_admin }
next();
} catch (e) {
return res.status(401).json({ success: false, msg: 'Invalid token' });
}
};