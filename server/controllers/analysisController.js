import Analysis from "../models/Analysis.js";
import User from "../models/User.js";
import { scrapeUrl } from "../services/scraperService.js";
import { analyzeSeoData } from "../services/geminiService.js";

const FREE_DAILY_ANALYSIS_LIMIT = 5;

const isSameCalendarDay = (left, right) => left.toDateString() === right.toDateString();


// Analyze a URL
export const analyzeURL = async (req, res) => {
    try {
        const {url} = req.body;
        if(!url) return res.status(400).json({success: false, message: "URL is required."});

        const user = await User.findById(req.userId);
        if(!user) return res.status(404).json({success: false, message: "User not found."});

        const today = new Date();
        const lastAnalysisDate = user.lastAnalysisDate ? new Date(user.lastAnalysisDate) : null;

        if(user.plan === "free") {
            if(lastAnalysisDate && !isSameCalendarDay(lastAnalysisDate, today)) {
                user.analysisCount = 0;
            }

            if((user.analysisCount || 0) >= FREE_DAILY_ANALYSIS_LIMIT) {
                return res.status(403).json({
                    success: false,
                    message: `Free plan allows only ${FREE_DAILY_ANALYSIS_LIMIT} analysis scans per day. Upgrade to Pro for unlimited scans.`,
                });
            }
        }

        // Validate URL format
        let validURL;
        try {
            validURL = new URL(url.startsWith('http') ? url : `http://${url}`);
        } catch (error) {
            return res.status(400).json({success: false, message: "Invalid URL format."});
        }

        // Create analysis entry with pending status
        let analysis;
        try {
            analysis = await Analysis.create({
                userId: req.userId,
                url: validURL.href,
                status: "processing"
            });

            if(user.plan === "free") {
                user.analysisCount = (user.analysisCount || 0) + 1;
                user.lastAnalysisDate = today;
                await user.save();
            }
        } catch (saveError) {
            if(analysis?._id) {
                await Analysis.findByIdAndDelete(analysis._id).catch(() => {});
            }
            throw saveError;
        }

        // Send immediate response to client
        res.status(202).json({success: true, message: "Analysis started.", analysisId: analysis._id});

        // Run Scraping and analysis in background
        try {
            // 1. Scrape the URL with broserbase
            const scrapeResult = await scrapeUrl(validURL.href);
            if(!scrapeResult.success) {
                analysis.status = "failed";
                await analysis.save();
                return;
            }

            // 2. Analyze the result with Gemini AI
            const aiResult = await analyzeSeoData(scrapeResult.data);

            if(!aiResult.success || !aiResult.data) {
                analysis.status = "failed";
                await analysis.save();
                return;
            }

            // 3. Save results to DB
            analysis.overallScore = aiResult.data.overallScore || 0;
            analysis.categories = aiResult.data.categories || [];
            analysis.metaData = scrapeResult.data.metaData || {};
            analysis.headings = scrapeResult.data.headings || {};
            analysis.links = scrapeResult.data.links || {};
            analysis.images = scrapeResult.data.images || {};
            analysis.keywords = aiResult.data.keywords || [];
            analysis.issues = aiResult.data.issues || [];
            analysis.loadTime = scrapeResult.data.loadTime || 0;
            analysis.pageSize = scrapeResult.data.pageSize || 0;
            analysis.wordCount = scrapeResult.data.wordCount || 0;
            analysis.status = "completed";

            await analysis.save();
             
        } catch (bgError) {
            console.error("Background analysis error : ", bgError.message);
            try {
                analysis.status = "failed";
                await analysis.save();
            } catch (saveError) {
                console.error("Failed to save failed status : ", saveError.message);
            }
        } 
    } catch (error) {
            console.error("Analyze URL error : ", error.message);
            if(!res.headersSent) {
                res.status(500).json({success: false, message: "Internal Server error"});
            }
    }
}

// Get Analysis by ID
export const getAnalysis = async (req, res) => {
    try {
        const analysis = await Analysis.findOne({_id: req.params.id, userId: req.userId});

        if(!analysis) return res.status(404).json({success: false, message: "Analysis not found."});
        res.json({success: true, analysis});

    } catch (error) {
        console.error("Get Analysis error : ", error.message);
        res.status(500).json({success: false, message: "Internal Server error"});
    }
}

// Get all analysis for a user
export const getAllAnalyses = async (req, res) => {
    try {

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const analysis = await Analysis.find({userId: req.userId}).sort({createdAt : -1}).skip(skip).limit(limit).select("-issues -keywords");
        const total = await Analysis.countDocuments({userId: req.userId});

        res.json({success: true, analysis, pagination: {total, page, limit, pages: Math.ceil(total / limit)}});

    } catch (error) {
        console.error("Get Analyses error : ", error.message);
        res.status(500).json({success: false, message: "Internal Server error"});
    }
}

// Delete an analysis
export const deleteAnalysis = async (req, res) => {
    try {
        const analysis = await Analysis.findOneAndDelete({_id: req.params.id, userId: req.userId});

        if(!analysis) return res.status(404).json({success: false, message: "Analysis not found."});

        res.json({success: true, message: "Analysis deleted."});

    } catch (error) {
        console.error("Delete Analysis error : ", error.message);
        res.status(500).json({success: false, message: "Internal Server error"});
    }
}