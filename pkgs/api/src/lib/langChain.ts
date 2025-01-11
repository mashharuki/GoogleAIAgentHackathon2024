import { HarmBlockThreshold, HarmCategory } from "@google/generative-ai";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import * as dotenv from "dotenv";

dotenv.config();

const { GEMINI_API_KEY } = process.env;

// Google GeminiのAPIを使うためのインスタンスを生成
export const model = new ChatGoogleGenerativeAI({
  apiKey: GEMINI_API_KEY,
  modelName: "gemini-pro",
  maxOutputTokens: 2048,
  safetySettings: [
    {
      category: HarmCategory.HARM_CATEGORY_HARASSMENT,
      threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE,
    },
  ],
});
