import { Request, Response } from 'express';
import { questions } from '../data/questions';
import { ResumeParser } from '../utils/resumeParser';
import { GeminiService } from '../services/geminiService';
import { GitHubService } from '../services/githubService';
import { getSessionFromRequest } from '../middlewares/sessionMiddleware';

const geminiService = new GeminiService();
const githubService = new GitHubService();

export const getQuestions = (req: Request, res: Response): void => {
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

export const submitAnswers = async (req: Request, res: Response): Promise<void> => {
  try {
    const session = await getSessionFromRequest(req, res);
    const userAnswers = req.body;
    
    // Create structured JSON with questions and their answers
    const formattedResponse = questions.map(question => {
      const userAnswer = userAnswers[question.id];
      
      let selectedOptions;
      
      if (question.type === 'radio' && question.options) {
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

    // Store this formatted response in session
    const analysisData = {
      guestId: session.guestId,
      timestamp: new Date().toISOString(),
      questionsAndAnswers: formattedResponse,
      rawAnswers: userAnswers
    };

    // Update session progress
    session.assessmentProgress!.phase1Complete = true;
    await session.save();

    res.json({
      success: true,
      data: analysisData,
      sessionId: session.guestId, // Keep this for frontend compatibility
      message: "Answers submitted successfully",
      nextStep: "Please upload your resume for analysis"
    });
    
  } catch (error) {
    console.error("Error in submitAnswers:", error);
    res.status(500).json({
      success: false,
      message: error
    });
  }
};

export const uploadResume = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({
        success: false,
        message: "No resume file uploaded"
      });
      return;
    }

    const session = await getSessionFromRequest(req, res);
    
    // Extract text from resume
    const resumeText = await ResumeParser.extractTextFromFile(req.file.path);
    
    // Store in session instead of userSessions memory
    session.resumeText = resumeText;
    session.resumePath = req.file.path;
    session.uploadedAt = new Date().toISOString();
    await session.save();

    // Clean up file after processing
    ResumeParser.cleanupFile(req.file.path);

    res.json({
      success: true,
      sessionId: session.guestId,
      message: "Resume uploaded and processed successfully",
      resumePreview: resumeText.substring(0, 200) + "...",
      nextStep: "Ready to combine with question answers for final analysis"
    });

  } catch (error) {
    // Clean up file on error
    if (req.file?.path) {
      ResumeParser.cleanupFile(req.file.path);
    }
    
    res.status(500).json({
      success: false,
      message: "Failed to process resume",
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const generateDynamicQuestions = async (req: Request, res: Response): Promise<void> => {
  try {
    const session = await getSessionFromRequest(req, res);
    const { questionAnswers } = req.body;
    
    if (!session.resumeText) {
      res.status(400).json({
        success: false,
        message: "Resume not found in session"
      });
      return;
    }

    // Phase 2 → Send to Gemini to generate dynamic questions
    const geminiResponse = await geminiService.generateDynamicQuestions({
      resumeText: session.resumeText,
      questionAnswers
    });

    // Store for phase 3 in session
    session.phase1Answers = questionAnswers;
    session.dynamicQuestions = geminiResponse.dynamicQuestions;
    await session.save();

    res.json({
      success: true,
      data: geminiResponse,
      message: "Dynamic questions generated successfully"
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to generate dynamic questions",
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const finalizeAnalysis = async (req: Request, res: Response): Promise<void> => {
  try {
    const session = await getSessionFromRequest(req, res);
    const { dynamicAnswers } = req.body;
    
    if (!session.resumeText || !session.phase1Answers) {
      res.status(400).json({
        success: false,
        message: "Missing session data"
      });
      return;
    }

    // Phase 3 → Send everything to Gemini
    const finalAnalysis = await geminiService.getFinalAnalysis({
      resumeText: session.resumeText,
      phase1Answers: session.phase1Answers,
      dynamicAnswers
    });

    // Use keywords + skill level to fetch GitHub repos/issues
    const githubIssues = await githubService.fetchRecommendedIssues(
      finalAnalysis.keywords, 
      finalAnalysis.skillLevel
    );

    res.json({
      success: true,
      data: {
        finalAnalysis,
        githubIssues
      },
      message: "Final analysis completed"
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to finalize analysis",
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
