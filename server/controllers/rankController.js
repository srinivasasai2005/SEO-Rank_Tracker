import KeywordTracking from "../models/keywordTracking.js";
import { keywordTracking } from "../services/keywordTrackingService.js"


// Add a keyword to track
export const addKeyword = async (req, res) => {
    try {
        const {keyword, url} = req.body;

        if(!keyword || !url) return res.status(400).json({ success : false, message : "Keyword and URL are required." });

        // Extract URL from domain
        let domain;
        try {
            const urlObj = new URL(url.startsWith('http') ? url : `http://${url}`);
            domain = urlObj.hostname.replace('www.', '');
        } catch (error) {
            return res.status(400).json({ success : false, message : "Invalid URL format" });
            console.log(error);
        }

        // Check if we are already tracking this keyword and domain
        const existing = await KeywordTracking.findOne({userId: req.userId, keyword: keyword.toLowerCase().trim(), domain});
        if(existing) {
            return res.status(400).json({ success : false, message : "Keyword already being tracked." });
        }

        // Create a new tracking entry
        const tracking = await KeywordTracking.create({
            userId: req.userId,
            keyword: keyword.toLowerCase().trim(),
            url: url.startsWith('http') ? url : `http://${url}`,
            domain,
            status: "checking"
        })
        res.status(201).json({ success : true, message : "Keyword added successfully.", tracking});
        keywordTracking(tracking)

    } catch (error) {
        console.error("Add keyword error : ", error.message);
        if(error.code === 11000) return res.status(400).json({success: false, message: "Already tracking this keword"});
        res.status(500).json({success: false, message: "Server error"});
    }
}

// Get all tracked keywords for user
export const getKeywords = async (req, res) => {
    try {

        const keywords = await KeywordTracking.find({userId: req.userId}).sort({createdAt : -1}).select("-rankHistory");
        res.json({success: true, keywords});

    } catch (error) {
        console.error("Get keywords error : ", error.message);
        res.status(500).json({success: false, message: "Internal Server error"});
    }
}

// Get a singel keyword with full history
export const getKeyword = async (req, res) => {
    try {

        const tracking = await KeywordTracking.findOne({_id: req.params.id, userId: req.userId});
        if(!tracking) return res.status(404).json({success: false, message: "Keyword Tracking not found"});
        res.json({success: true, tracking});

    } catch (error) {
        console.error("Get keyword error : ", error.message);
        res.status(500).json({success: false, message: "Internal Server error"});
    }
}

// Manually refresh a keyword tracking
export const refreshKeyword = async (req, res) => {
    try {

        const tracking = await KeywordTracking.findOne({_id: req.params.id, userId: req.userId});
        if(!tracking) return res.status(404).json({success: false, message: "Keyword Tracking not found"});
        tracking.status = "checking";
        await tracking.save();
        res.json({success: true, message: "Rank check started"});
        keywordTracking(tracking);

    } catch (error) {
        console.error("Refresh keyword error : ", error.message);
        res.status(500).json({success: false, message: "Internal Server error"});
    } 
}

// Delete keyword tracking
export const deleteKeyword = async (req, res) => {
    try {

        const tracking = await KeywordTracking.findOneAndDelete({_id: req.params.id, userId: req.userId});
        if(!tracking) return res.status(404).json({success: false, message: "Keyword Tracking not found"});
        res.json({success: true, message: "Keyword Tracking deleted"})

    } catch (error) {
        console.error("Delete keyword error : ", error.message);
        res.status(500).json({success: false, message: "Internal Server error"});
    } 
}

// Toggle tracking acive / inactive
export const toggleTracking = async (req, res) => {
    try {

        const tracking = await KeywordTracking.findOne({_id: req.params.id, userId: req.userId});
        if(!tracking) return res.status(404).json({success: false, message: "Keyword Tracking not found"});
        tracking.active = !tracking.active;
        await tracking.save();
        res.json({success: true, tracking});

    } catch (error) {
        console.error("Tracking keyword error : ", error.message);
        res.status(500).json({success: false, message: "Internal Server error"});
    } 
}