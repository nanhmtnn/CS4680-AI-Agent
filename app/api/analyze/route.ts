import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: Request) {
  try {
    const { datasetInfo } = await req.json();

    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
    });

    const prompt = `Analyze dataset:\n${JSON.stringify(datasetInfo, null, 2)}`;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.1,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      },
    });

    return NextResponse.json({
      analysis: result.response.text(),
    });

  } catch (err) {
    console.error("SERVER ERROR → analyze route:", err);
    return NextResponse.json(
      { error: "Failed to analyze dataset" },
      { status: 500 }
    );
  }
}
