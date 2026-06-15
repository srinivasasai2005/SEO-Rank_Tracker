import express from "express";

import auth from "../middleware/auth.js";
import { analyzeURL, getAllAnalyses, getAnalysis , deleteAnalysis } from "../controllers/analysisController.js";

const analysisRouter = express.Router();

analysisRouter.post('/analyze', auth, analyzeURL);
analysisRouter.get('/list', auth, getAllAnalyses);
analysisRouter.get('/:id', auth, getAnalysis);
analysisRouter.delete('/:id', auth, deleteAnalysis);

export default analysisRouter;