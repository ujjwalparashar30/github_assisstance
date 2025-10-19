import { Request, Response } from "express";
import { questions } from "../data/questions";
import { ResumeParser } from "../utils/resumeParser";
import { GeminiService } from "../services/geminiService";
import { GitHubService } from "../services/githubService";
import { getSessionFromRequest } from "../middlewares/sessionMiddleware";
import prisma from "../../prisma/prisma";

const geminiService = new GeminiService();
const githubService = new GitHubService();

export const getQuestions = (req: Request, res: Response): void => {
  try {
    res.json({
      success: true,
      data: questions,
      message: "Questions fetched successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch questions",
    });
  }
};

export const submitAnswers = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const session = await getSessionFromRequest(req, res);
    const userAnswers = req.body;

    // Create structured JSON with questions and their answers
    const formattedResponse = questions.map((question) => {
      const userAnswer = userAnswers[question.id];

      let selectedOptions;

      if (question.type === "radio" && question.options) {
        if (typeof question.options[0] === "object") {
          const optionObjects = question.options as {
            value: string;
            label: string;
          }[];
          selectedOptions =
            optionObjects.find((opt) => opt.value === userAnswer)?.label ||
            userAnswer;
        } else {
          selectedOptions = userAnswer;
        }
      } else if (question.type === "checkbox" && Array.isArray(userAnswer)) {
        selectedOptions = userAnswer;
      } else {
        selectedOptions = userAnswer;
      }

      return {
        questionId: question.id,
        question: question.title,
        questionType: question.type,
        userAnswer: userAnswer || null,
        selectedOptions: selectedOptions,
      };
    });

    // Store this formatted response in session
    const analysisData = {
      guestId: session.guestId,
      timestamp: new Date().toISOString(),
      questionsAndAnswers: formattedResponse,
      rawAnswers: userAnswers,
    };

    // Update session progress
    session.assessmentProgress!.phase1Complete = true;
    await session.save();

    res.json({
      success: true,
      data: analysisData,
      sessionId: session.guestId, // Keep this for frontend compatibility
      message: "Answers submitted successfully",
      nextStep: "Please upload your resume for analysis",
    });
  } catch (error) {
    console.error("Error in submitAnswers:", error);
    res.status(500).json({
      success: false,
      message: error,
    });
  }
};

export const uploadResume = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    console.log("=== UPLOAD RESUME DEBUG ===");
    console.log("Headers:", req.headers);
    console.log("Content-Type:", req.headers["content-type"]);
    console.log("File object:", req.file);
    console.log("Body:", req.body);
    console.log("============================");

    if (!req.file) {
      console.log("❌ No file found in request");
      res.status(400).json({
        success: false,
        message: "No resume file uploaded",
      });
      return;
    }

    console.log("✅ File received:", {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path,
    });

    const session = await getSessionFromRequest(req, res);

    const resume = await prisma.resume.create({
      data: {
        guestId: session.guestId!,
        originalName: req.file.originalname,
        storedName: req.file.filename,
        resumeText: await ResumeParser.extractTextFromFile(req.file.path),
      },
    });

    // Save only reference in session
    session.resumeId = resume.id;
    if (session.assessmentProgress)
      session.assessmentProgress.phase1Complete = true;
    await session.save();

    // // Extract text from resume
    // const resumeText = await ResumeParser.extractTextFromFile(req.file.path);

    // // Store in session instead of userSessions memory
    // session.resumeText = resumeText;
    // session.resumePath = req.file.path;
    // session.uploadedAt = new Date().toISOString();
    // await session.save();

    // // Clean up file after processing
    // ResumeParser.cleanupFile(req.file.path);

    res.json({
      success: true,
      message: "Resume uploaded successfully",
      resumePreview: `/uploads/resumes/${req.file.filename}`,
      nextStep: "match-issues",
    });
  } catch (error) {
    console.error("❌ Upload error:", error);
    // Clean up file on error
    if (req.file?.path) {
      ResumeParser.cleanupFile(req.file.path);
    }

    res.status(500).json({
      success: false,
      message: "Failed to process resume",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const generateDynamicQuestions = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const session = await getSessionFromRequest(req, res);
    const resume = await prisma.resume.findFirst({
      where: {
        guestId: session.guestId!,
      },
    });
    const { questionAnswers } = req.body;

    if (!resume || !resume.resumeText) {
      res.status(400).json({
        success: false,
        message: "Resume not found in session",
      });
      return;
    }
    console.log("Resume text length:", resume.resumeText.length);
    console.log("sendimg to Gemini:", { questionAnswers });
    try {
      const combinedAnalysis = await geminiService.analyzeResume(
        resume.resumeText,
        questionAnswers
      );
      if (!combinedAnalysis) throw new Error("Empty analysis from Gemini");

      const geminiResponse = await geminiService.generateDynamicQuestions(
        combinedAnalysis
      );
      if (!geminiResponse?.questions?.length) {
        throw new Error("Gemini returned no questions");
      }

      const questionSet = await prisma.dynamicQuestionSet.create({
        data: {
          resumeId: resume.id,
          questions: geminiResponse.questions,
        },
      });
      session.phase1Answers = questionAnswers;
      session.dynamicQuestionsId = questionSet.id;
      await session.save();

      res.json({ success: true, data: geminiResponse });
    } catch (err) {
      console.error("generateDynamicQuestions controller error:", err);
      res
        .status(500)
        .json({
          success: false,
          message: (err as Error).message || "Failed",
          detail: (err as any).raw
            ? "Check server logs for raw model output."
            : null,
        });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to generate dynamic questions",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

export const finalizeAnalysis = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const session = await getSessionFromRequest(req, res);
    const { dynamicAnswers } = req.body;

    const resume = await prisma.resume.findFirst({
      where: {
        guestId: session.guestId!,
      },
    });

    if (!resume || !resume.resumeText) {
      res.status(400).json({
        success: false,
        message: "Missing session data",
      });
      return;
    }

    // Phase 3 → Send everything to Gemini
    const finalAnalysis = await geminiService.getFinalAnalysis({
      resumeText: resume.resumeText,
      phase1Answers: session.phase1Answers,
      dynamicAnswers,
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
        githubIssues,
      },
      message: "Final analysis completed",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to finalize analysis",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
