import { GoogleGenerativeAI } from "@google/generative-ai";

export class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    // Use a valid model id. Try gemini-2.5-flash (or gemini-2.5-pro for max reasoning)
    this.model = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  }

  private async extractTextFromResult(result: any): Promise<string> {
    const response = await result.response;
    // SDK typically returns content in candidates[0].content.parts[0].text
    const text =
      response?.candidates?.[0]?.content?.parts?.[0]?.text ??
      response?.text ??
      "";

    return String(text);
  }

  // Remove markdown fences and trim
  private cleanModelText(text: string): string {
    return text.replace(/```(?:json)?/g, "").trim();
  }

  // Safe JSON parse with clearer error
  private safeParseJSON(text: string, context = ""): any {
    try {
      return JSON.parse(text);
    } catch (err) {
      const cleaned = this.cleanModelText(text);
      try {
        return JSON.parse(cleaned);
      } catch (err2) {
        const message = `JSON parse failed${context ? ` (${context})` : ""}. ` +
                        `Raw first 500 chars: ${text.slice(0, 500)}`;
        const e = new Error(message);
        // Attach raw text for debugging (don't send this to clients)
        (e as any).raw = text;
        throw e;
      }
    }
  }

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
      const raw = await this.extractTextFromResult(result);
      console.log("Gemini raw analyzeResume:", raw.slice(0, 1000));
      const parsed = this.safeParseJSON(raw, "analyzeResume");
      return parsed;
    } catch (error: any) {
      console.error("Gemini analyzeResume error:", error);
      throw new Error(`Gemini analysis failed: ${error.message || error}`);
    }
  }

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
      "options": ["option1","option2"]
    }
  ]
}
    `;

    try {
      const result = await this.model.generateContent(prompt);
      const raw = await this.extractTextFromResult(result);
      console.log("Gemini raw generateDynamicQuestions:", raw.slice(0, 1000));
      const parsed = this.safeParseJSON(raw, "generateDynamicQuestions");
      return parsed;
    } catch (error: any) {
      console.error("Gemini generateDynamicQuestions error:", error);
      throw new Error(`Dynamic question generation failed: ${error.message || error}`);
    }
  }

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
  "keywords": ["javascript","react","good first issue"]
}
    `;

    try {
      const result = await this.model.generateContent(prompt);
      const raw = await this.extractTextFromResult(result);
      console.log("Gemini raw getFinalAnalysis:", raw.slice(0, 1000));
      const parsed = this.safeParseJSON(raw, "getFinalAnalysis");
      return parsed;
    } catch (error: any) {
      console.error("Gemini getFinalAnalysis error:", error);
      throw new Error(`Final analysis failed: ${error.message || error}`);
    }
  }
}
