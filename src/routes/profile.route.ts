import express from 'express';
import { 
  getQuestions, 
  submitAnswers, 
  uploadResume, 
  generateDynamicQuestions, 
  finalizeAnalysis 
} from '../controllers/fetchQuestions.controller';
import { uploadMiddleware } from '../middlewares/uploadMiddleware';

const router = express.Router();

// GET route for fetching initial 5 questions
router.get('/questions', getQuestions);

// ✅ Parse JSON only here (not globally)
router.post('/answers', express.json({ limit: "50mb" }), submitAnswers);
router.post('/generate-questions', express.json({ limit: "50mb" }), generateDynamicQuestions);
router.post('/finalize-analysis', express.json({ limit: "50mb" }), finalizeAnalysis);

// ✅ Upload route → skip JSON parser, only multer
router.post('/upload-resume', uploadMiddleware, uploadResume);

export default router;
