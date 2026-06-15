import express from "express";

import auth from "../middleware/auth.js";
import { createCheckoutSession, verifyStripe } from "../controllers/paymentController.js";

const paymentRouter = express.Router();

paymentRouter.post("/create-checkout-session", auth, createCheckoutSession);
paymentRouter.post("/verify-stripe", auth, verifyStripe);

export default paymentRouter;