// import express from 'express';
// import { getQuestions, submitAnswers } from '../controllers/fetchQuestions.controller';

// const router = express.Router();

// // GET route for fetching questions
// router.get('/questions', getQuestions);

// // POST route for submitting answers
// router.post('/answers', submitAnswers);

// export default router;


import express from 'express';
import { getQuestions, submitAnswers, uploadResume, generateDynamicQuestions } from '../controllers/fetchQuestions.controller';
import { uploadMiddleware } from '../middlewares/uploadMiddleware';

const router = express.Router();

// GET route for fetching questions
router.get('/questions', getQuestions);

// POST route for submitting answers
router.post('/answers', submitAnswers);

// POST route for uploading resume
router.post('/upload-resume', uploadMiddleware, uploadResume);

// POST route for generating dynamic questions after resume + answers analysis
router.post('/generate-questions', generateDynamicQuestions);

export default router;


