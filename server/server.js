import express from "express";
import cors from "cors";
import 'dotenv/config'; // Corrected ES Module dotenv import
import helmet from "helmet";
import rateLimit from "express-rate-limit";

import connectDB from "./config/db.js";
import authRouter from "./routes/authRoutes.js";
import rankRouter from "./routes/rankRoutes.js";
import analysisRouter from "./routes/analysisRoutes.js";
import paymentRouter from "./routes/paymentRoutes.js";
import { startRankTrackingCron } from "./cron/rankTrackingCron.js";

connectDB();

const app = express();

// 1. Helmet: Secures HTTP headers and hides your Express framework
app.use(helmet());

// 2. CORS: Restrict access to your local frontend and future Vercel domain
const corsOptions = {
  origin: [
    "http://localhost:5173", // Assuming Vite's default local port
    process.env.FRONTEND_URL // We will add this to Render later
  ],
  credentials: true, // Required if you are using cookies/sessions
};
app.use(cors(corsOptions));

// 3. Rate Limiting: Prevent brute-force and DDoS attacks
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: "Too many requests from this IP, please try again later."
});
app.use('/api', limiter); // Apply only to API routes

// 4. Body Parser
app.use(express.json());


// --- Routes Below ---
app.get('/', (req, res) => res.send("Server is running.."));
// ... keep your app.use routes and the rest of the file exactly the same
app.use('/api/auth', authRouter);
app.use('/api/rank', rankRouter);
app.use('/api/analysis', analysisRouter);
app.use('/api/payment', paymentRouter);

// Start the cron job for rank tracking
startRankTrackingCron();

const PORT = process.env.PORT || 8000;

app.listen(PORT, ()=> console.log(`Server is running on port ${PORT}`));