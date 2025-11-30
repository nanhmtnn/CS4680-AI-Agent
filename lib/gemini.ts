import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

export class DataScientistAgent {
  private model;
  private context: string;

  constructor() {
    this.model = genAI.getGenerativeModel({ 
      model: "gemini-pro",
      generationConfig: {
        temperature: 0.1,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      }
    });
    
    this.context = `You are an AI Data Scientist Assistant. Your role is to help users analyze datasets, provide insights, and suggest data cleaning steps. You can:
    - Analyze dataset structure and statistics
    - Identify data quality issues
    - Suggest cleaning operations
    - Provide insights about the data
    - Recommend next steps for analysis
    
    Always respond in a structured, professional manner.`;
  }

  async analyzeDataset(datasetInfo: any): Promise<string> {
    const prompt = `
    ${this.context}
    
    Analyze the following dataset:
    ${JSON.stringify(datasetInfo, null, 2)}
    
    Please provide:
    1. Key insights about the data
    2. Data quality issues found
    3. Recommended cleaning steps
    4. Suggestions for further analysis
    
    Format your response clearly with sections.
    `;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      throw new Error('Failed to analyze dataset');
    }
  }

  async suggestCleaningSteps(issues: any[]): Promise<string> {
    const prompt = `
    ${this.context}
    
    Based on these data quality issues:
    ${JSON.stringify(issues, null, 2)}
    
    Provide specific cleaning steps and recommendations. For each issue, suggest:
    - The cleaning operation needed
    - Tools/methods to use
    - Potential impact on analysis
    `;

    const result = await this.model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  }
}