import { GoogleGenerativeAI } from '@google/generative-ai';

export class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-pro" });
  }

  async analyzeResume(resumeText: string, questionAnswers: any): Promise<any> {
    const prompt = `
    Analyze the following resume and question answers to provide insights:
    
    RESUME CONTENT:
    ${resumeText}
    
    QUESTION ANSWERS:
    ${JSON.stringify(questionAnswers, null, 2)}
    
    Please provide a detailed analysis in JSON format with:
    1. Skills extracted from resume
    2. Experience level
    3. Education background
    4. Key achievements
    5. Areas for improvement
    6. Alignment with stated goals from questions
    
    Return only valid JSON.
    `;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return JSON.parse(response.text());
    } catch (error) {
      throw new Error(`Gemini analysis failed: ${error}`);
    }
  }

  async generateDynamicQuestions(combinedAnalysis: any): Promise<any> {
    const prompt = `
    Based on the following combined analysis of user's answers and resume, generate 10 personalized follow-up questions:
    
    ANALYSIS DATA:
    ${JSON.stringify(combinedAnalysis, null, 2)}
    
    Generate questions that are:
    1. Relevant to their stated goals and current skill level
    2. Help identify specific areas for improvement
    3. Understand their career preferences better
    4. Mix of technical and behavioral questions
    
    Return in this JSON format:
    {
      "questions": [
        {
          "id": "q1",
          "question": "Question text here",
          "type": "radio|checkbox|textarea",
          "options": ["option1", "option2"] // if applicable
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
}
