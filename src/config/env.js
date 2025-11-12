import dotenv from 'dotenv';
dotenv.config();


export const env = {
PORT: process.env.PORT || 2027,
NODE_ENV: process.env.NODE_ENV || 'development',
DB_HOST: process.env.DB_HOST,
DB_PORT: Number(process.env.DB_PORT || 3306),
DB_USER: process.env.DB_USER,
DB_PASS: process.env.DB_PASS,
DB_NAME: process.env.DB_NAME,
JWT_SECRET: process.env.JWT_SECRET,
JWT_EXPIRES: process.env.JWT_EXPIRES || '7d',
RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID,
RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET,
APP_URL: process.env.APP_URL
};