// import express from 'express';
// import { getQuestions } from '../controllers/fetchQuestions.controller';

// const router = express.Router();

// // GET route for fetching questions
// router.get('/questions', getQuestions);

// export default router;


import express from 'express';
import { getQuestions, submitAnswers } from '../controllers/fetchQuestions.controller';

const router = express.Router();

// GET route for fetching questions
router.get('/questions', getQuestions);

// POST route for submitting answers
router.post('/answers', submitAnswers);

export default router;

