import { GoogleGenerativeAI } from '@google/generative-ai';

export class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-pro" });
  }

  /**
   * Phase 1/2 → Analyze resume + initial Q&A
   */
  async analyzeResume(resumeText: string, questionAnswers: any): Promise<any> {
    const prompt = `
      Analyze the following resume and question answers:

      RESUME CONTENT:
      ${resumeText.substring(0, 2000)}

      QUESTION ANSWERS:
      ${JSON.stringify(questionAnswers, null, 2)}

      Return JSON with:
      {
        "skills": [...],
        "experienceLevel": "Beginner|Intermediate|Advanced",
        "education": "...",
        "achievements": [...],
        "areasForImprovement": [...],
        "goalAlignment": "..."
      }
    `;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return JSON.parse(response.text());
    } catch (error) {
      throw new Error(`Gemini analysis failed: ${error}`);
    }
  }

  /**
   * Phase 2 → Generate 10 dynamic follow-up questions
   */
  async generateDynamicQuestions(combinedAnalysis: any): Promise<any> {
    const prompt = `
      Based on the following combined analysis of user's answers and resume, 
      generate 10 personalized follow-up questions:

      ANALYSIS DATA:
      ${JSON.stringify(combinedAnalysis, null, 2)}

      Requirements:
      - Relevant to skills & goals
      - Mix of technical and behavioral
      - Questions should capture depth (not only basics)
      
      Return JSON:
      {
        "questions": [
          {
            "id": "dq1",
            "question": "Question text here",
            "type": "radio|checkbox|textarea",
            "options": ["option1","option2"] // if applicable
          }
        ]
      }
    `;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return JSON.parse(response.text());
    } catch (error) {
      throw new Error(`Dynamic question generation failed: ${error}`);
    }
  }

  /**
   * Phase 3 → Final consolidated analysis (used before GitHub fetch)
   */
  async getFinalAnalysis({ resumeText, phase1Answers, dynamicAnswers }: any) {
    const prompt = `
      You are assessing a developer. Use their resume + all answers.

      Resume: ${resumeText.substring(0, 2000)}
      Initial Answers: ${JSON.stringify(phase1Answers, null, 2)}
      Dynamic Answers: ${JSON.stringify(dynamicAnswers, null, 2)}

      Return JSON:
      {
        "skillLevel": "Beginner|Intermediate|Advanced",
        "skills": [...],
        "recommendations": [...],
        "keywords": ["javascript","react","good first issue"] // for GitHub search
      }
    `;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return JSON.parse(response.text());
    } catch (error) {
      throw new Error(`Final analysis failed: ${error}`);
    }
  }
}
