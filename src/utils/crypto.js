import bcrypt from 'bcryptjs';


export const hash = async (str) => bcrypt.hash(str, 10);
export const compare = async (str, h) => bcrypt.compare(str, h);


export const generateReferralCode = (userId) => {
// Short, human-readable code
const rnd = Math.floor(Math.random() * 1e8).toString(36).toUpperCase();
return (userId.toString(36) + rnd).slice(0, 8).toUpperCase();
};