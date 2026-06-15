import Stripe from "stripe";

import User from "../models/User.js";

const getStripe = () => {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if(!secretKey) {
        throw new Error("STRIPE_SECRET_KEY is not configured.");
    }

    return new Stripe(secretKey);
};

const getFrontendUrl = () => process.env.FRONTEND_URL || "http://localhost:5173";

const getProPriceId = () => process.env.STRIPE_PRO_PRICE_ID || process.env.STRIPE_PRICE_ID;

const getProPriceLineItem = () => {
    const priceId = getProPriceId();

    if(priceId) {
        return {
            price: priceId,
            quantity: 1,
        };
    }

    return {
        price_data: {
            currency: "usd",
            product_data: {
                name: "SEO Rank Tracker Pro",
                description: "Unlimited analysis scans, priority processing, competitor analysis, historical tracking, API access, and email reports.",
            },
            recurring: {
                interval: "month",
            },
            unit_amount: 1900,
        },
        quantity: 1,
    };
};

export const createCheckoutSession = async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if(!user) return res.status(404).json({ success: false, message: "User not found." });

        if(user.plan === "pro") {
            return res.status(400).json({ success: false, message: "You are already on the Pro plan." });
        }

        const stripe = getStripe();
        const frontendUrl = getFrontendUrl();

        const session = await stripe.checkout.sessions.create({
            mode: "subscription",
            customer_email: user.email,
            line_items: [getProPriceLineItem()],
            success_url: `${frontendUrl}/verify-stripe?success=true&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${frontendUrl}/dashboard`,
            metadata: {
                userId: String(user._id),
            },
        });

        return res.json({ success: true, url: session.url });
    } catch (error) {
        console.error("Create Stripe session error : ", error.message);
        return res.status(500).json({ success: false, message: error.message || "Unable to start Stripe checkout." });
    }
};

export const verifyStripe = async (req, res) => {
    try {
        const { success, sessionId } = req.body;

        if(success !== "true" || !sessionId) {
            return res.status(400).json({ success: false, message: "Invalid Stripe verification request." });
        }

        const stripe = getStripe();
        const session = await stripe.checkout.sessions.retrieve(sessionId);

        if(session.payment_status !== "paid") {
            return res.status(400).json({ success: false, message: "Payment is not completed yet." });
        }

        const userId = session.metadata?.userId;
        const user = await User.findById(userId);

        if(!user) {
            return res.status(404).json({ success: false, message: "User not found." });
        }

        user.plan = "pro";
        await user.save();

        return res.json({ success: true, message: "Your plan has been upgraded to Pro.", user });
    } catch (error) {
        console.error("Verify Stripe error : ", error.message);
        return res.status(500).json({ success: false, message: error.message || "Failed to verify Stripe payment." });
    }
};