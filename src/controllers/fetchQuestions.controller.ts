import { Request, Response } from 'express';
import { questions } from '../data/questions';
import { ResumeParser } from '../utils/resumeParser';
import { GeminiService } from '../services/geminiService';

const geminiService = new GeminiService();

// Store user sessions (in production, use Redis or database)
const userSessions: { [key: string]: any } = {};

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


export const uploadResume = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No resume file uploaded"
      });
    }

    // Extract text from resume
    const resumeText = await ResumeParser.extractTextFromFile(req.file.path);
    
    // Generate session ID (in production, use proper session management)
    const sessionId = Date.now().toString();
    
    // Store resume data in session
    userSessions[sessionId] = {
      resumeText,
      resumePath: req.file.path,
      uploadedAt: new Date().toISOString()
    };

    // Clean up file after processing
    ResumeParser.cleanupFile(req.file.path);

    res.json({
      success: true,
      sessionId,
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

export const generateDynamicQuestions = async (req: Request, res: Response) => {
  try {
    console.log('📥 Received request:', req.body);
    
    const { sessionId, questionAnswers } = req.body;
    
    if (!sessionId || !userSessions[sessionId]) {
      console.log('❌ Invalid session:', sessionId);
      return res.status(400).json({
        success: false,
        message: "Invalid session or resume not found"
      });
    }

    console.log('✅ Session found:', sessionId);
    const { resumeText } = userSessions[sessionId];
    console.log('📄 Resume text length:', resumeText?.length || 0);
    
    // For now, let's skip Gemini and return mock data to test the flow
    const mockAnalysis = {
      skills: ['JavaScript', 'React', 'Node.js'],
      experience: 'Mid-level',
      recommendations: ['Learn TypeScript', 'Practice system design']
    };

    const mockQuestions = {
      questions: [
        {
          id: "q1",
          question: "What specific JavaScript frameworks would you like to master next?",
          type: "checkbox",
          options: ["Vue.js", "Angular", "Svelte", "Next.js"]
        },
        {
          id: "q2", 
          question: "How comfortable are you with system design concepts?",
          type: "radio",
          options: [
            { value: "beginner", label: "Just starting to learn" },
            { value: "intermediate", label: "Can design simple systems" },
            { value: "advanced", label: "Can design complex distributed systems" }
          ]
        }
      ]
    };

    console.log('✅ Sending mock response');
    
    res.json({
      success: true,
      data: {
        combinedAnalysis: {
          questionAnswers,
          resumeAnalysis: mockAnalysis,
          timestamp: new Date().toISOString()
        },
        dynamicQuestions: mockQuestions.questions
      },
      message: "Dynamic questions generated successfully (MOCK DATA)"
    });

  } catch (error) {
    console.error('💥 Error in generateDynamicQuestions:', error);
    console.error('Stack trace:', error instanceof Error ? error.stack : error);
    
    res.status(500).json({
      success: false,
      message: "Failed to generate dynamic questions",
      error: error instanceof Error ? error.message : 'Unknown error',
      debug: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};
