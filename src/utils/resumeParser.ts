import fs from 'fs';
import path from 'path';
import pdf from 'pdf-parse';
import mammoth from 'mammoth';

export class ResumeParser {
  static async extractTextFromFile(filePath: string): Promise<string> {
    const ext = path.extname(filePath).toLowerCase();
    
    try {
      if (ext === '.pdf') {
        return await this.extractFromPDF(filePath);
      } else if (ext === '.docx') {
        return await this.extractFromDOCX(filePath);
      } else if (ext === '.doc') {
        throw new Error('DOC files are not fully supported. Please use DOCX or PDF format.');
      } else {
        throw new Error('Unsupported file format');
      }
    } catch (error) {
      throw new Error(`Failed to extract text from resume: ${error}`);
    }
  }

  private static async extractFromPDF(filePath: string): Promise<string> {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdf(dataBuffer);
    return data.text;
  }

  private static async extractFromDOCX(filePath: string): Promise<string> {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  }

  static cleanupFile(filePath: string): void {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      console.error('Error cleaning up file:', error);
    }
  }
}
