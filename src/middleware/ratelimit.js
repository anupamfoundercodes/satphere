import rateLimit from 'express-rate-limit';


export const authLimiter = rateLimit({
windowMs: 15 * 60 * 1000,
max: 100
});


export const reportLimiter = rateLimit({
windowMs: 5 * 60 * 1000,
max: 20
});