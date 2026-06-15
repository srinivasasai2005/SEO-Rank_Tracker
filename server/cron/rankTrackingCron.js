import cron from "node-cron";

import KeywordTracking from "../models/keywordTracking.js";
import { keywordTracking } from "../services/keywordTrackingService.js";

export const startRankTrackingCron = () => {
    cron.schedule('0 6 * * *', async (params) => {
        console.log("Starting rank tracking cron job...");
        try {
            const activeTrackings = await KeywordTracking.find({ active: true, status: { $ne: "checking" } });
            for (const tracking of activeTrackings) {
                tracking.status = "checking";
                await tracking.save();
                const result = await keywordTracking(tracking);

                // Delay between requests to avoid hitting rate limits
                await new Promise((r)=>setTimeout(r, 10000 + Math.random() * 5000));
            }
        } catch (error) {
            console.error("Error in rank tracking cron : ", error.message);
        }
    });
    console.log("Rank tracking cron job scheduled to run every day at 6 AM.");
};