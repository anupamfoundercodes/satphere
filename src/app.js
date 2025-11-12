import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
// import './cron/dailyCoins.js';
import cloudinary from './config/cloudinary.js'; //upload image in cloud
import userRoutes from "./routes/user.routes.js";
import authRoutes from "./routes/auth.routes.js";
import imageRoutes from "./routes/image.routes.js";
import horoscopeRoutes from "./routes/horoscope.routes.js";
import socialRoutes from "./routes/social.routes.js";
import blogRoutes from "./routes/blog.js";
import adminRoutes from "./routes/admin.routes.js";
import setUser from "./middleware/setUser.js";
import agoraRoutes from "./routes/agora.routes.js";
import friendRoutes from "./routes/friend.routes.js";
import planRoutes from "./routes/plan.routes.js";
import referralRoutes from "./routes/referral.routes.js";
import socketRoutes from "./routes/socket.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import instamojoRoutes from "./routes/instamojo.routes.js";
import firebaseRoutes from "./routes/firebase.routes.js";
import forgateRoutes from "./routes/forgate.routes.js";
import matchRoutes from "./routes/match.routes.js";
import walletRoutes from "./routes/wallet.routes.js";
import mediaRoutes from './routes/media.routes.js';
import listRoutes from "./routes/list.routes.js";
import path from "path";
import { fileURLToPath } from "url";
import cookieParser from "cookie-parser";
const app = express();
// __dirname support (ESM me)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 👇 ye add karo — userimage ko static serve karega
// view engine set karo
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views")); // yeh src/views point karega


app.use("/userimage", express.static(path.join(__dirname, "../userimage")));
app.use(express.static(path.join(__dirname, "../public")));
// Middleware
app.use(cors());


app.use(express.json({ limit: "200mb" }));
app.use(express.urlencoded({ limit: "200mb", extended: true }));
app.use(express.json()); // JSON body ke liye
app.use(express.urlencoded({ extended: true })); // <---- yeh add karo form-data ke liye
app.use(cookieParser());

// app.use(bodyParser.json({ limit: "100mb" }));
// app.use(bodyParser.urlencoded({ limit: "100mb", extended: true }));
app.use(setUser); 
// Test Route
app.get("/ok", (req, res) => {
  res.send(`PookiChat API is running 🚀 https://root.satphere.com`);
});

app.use("/", blogRoutes);
app.use("/", adminRoutes);
app.use("/api", agoraRoutes);
app.use("/api", userRoutes);
app.use("/api", authRoutes);
app.use("/api", imageRoutes);
app.use("/api", horoscopeRoutes);
app.use("/api", socialRoutes);
app.use("/api", friendRoutes);
app.use("/api", planRoutes);
app.use("/api", referralRoutes);
app.use("/api", notificationRoutes);
app.use("/api", paymentRoutes);
app.use("/api", firebaseRoutes);
app.use("/api", instamojoRoutes);
app.use("/api", forgateRoutes);
app.use("/api", matchRoutes);
app.use("/api", walletRoutes)
app.use("/api", mediaRoutes);
app.use("/api", listRoutes);
app.use("/", socketRoutes);
export default app;
