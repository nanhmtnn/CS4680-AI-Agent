import { GoogleGenerativeAI } from "@google/generative-ai";

export class DataScientistAgent {
  private model;

  constructor() {
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

    this.model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
    });
  }

  async analyzeDataset(datasetInfo: any): Promise<string> {
    try {
      const prompt = `
You are an AI Data Scientist responsible for analyzing dataset structure, detecting issues, and suggesting next steps.

Analyze this dataset:

${JSON.stringify(datasetInfo, null, 2)}

Provide:
1. Key insights
2. Data quality issues
3. Recommended cleaning steps
4. Suggestions for further analysis
`.trim();

      const result = await this.model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.1,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
      });

      return result.response.text();
    } catch (error) {
      console.error("DataScientistAgent Error:", error);
      throw new Error("AI analysis failed");
    }
  }
}
