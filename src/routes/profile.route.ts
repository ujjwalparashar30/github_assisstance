import express from 'express';
import { getQuestions, submitAnswers, uploadResume, generateDynamicQuestions, finalizeAnalysis } from '../controllers/fetchQuestions.controller';
import { uploadMiddleware } from '../middlewares/uploadMiddleware';

const router = express.Router();

// GET route for fetching initial 5 questions
router.get('/questions', getQuestions);

// POST route for submitting answers (Phase 1 basic answers)
router.post('/answers', submitAnswers);

// POST route for uploading resume
router.post('/upload-resume', uploadMiddleware, uploadResume);

// POST route for generating dynamic questions after Phase 1 + resume
router.post('/generate-questions', generateDynamicQuestions);

router.post("/finalize-analysis", finalizeAnalysis);



export default router;


