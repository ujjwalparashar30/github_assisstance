import { Request, Response } from 'express';
import { questions } from '../data/questions';

export const getQuestions = (req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      data: questions,
      message: "Questions fetched successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch questions"
    });
  }
};

export const submitAnswers = (req: Request, res: Response) => {
  try {
    const userAnswers = req.body;
    
    // Create structured JSON with questions and their answers
    const formattedResponse = questions.map(question => {
      const userAnswer = userAnswers[question.id];
      
      let selectedOptions;
      
      if (question.type === 'radio' && question.options) {
        // Check if options are objects with value/label or just strings
        if (typeof question.options[0] === 'object') {
          const optionObjects = question.options as { value: string; label: string }[];
          selectedOptions = optionObjects.find(opt => opt.value === userAnswer)?.label || userAnswer;
        } else {
          selectedOptions = userAnswer;
        }
      } else if (question.type === 'checkbox' && Array.isArray(userAnswer)) {
        selectedOptions = userAnswer;
      } else {
        selectedOptions = userAnswer;
      }
      
      return {
        questionId: question.id,
        question: question.title,
        questionType: question.type,
        userAnswer: userAnswer || null,
        selectedOptions: selectedOptions
      };
    });

    // Store this formatted response for later use with resume analysis
    const analysisData = {
      timestamp: new Date().toISOString(),
      questionsAndAnswers: formattedResponse,
      rawAnswers: userAnswers
    };

    res.json({
      success: true,
      data: analysisData,
      message: "Answers submitted successfully",
      nextStep: "Please upload your resume for analysis"
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to process answers"
    });
  }
};
