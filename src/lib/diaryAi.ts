import { GoogleGenAI } from "@google/genai";
import { DIARY_AI_SYSTEM_PROMPT } from "../config/diaryEtapas";

export interface DiaryChatMessage {
  role: "user" | "assistant";
  content: string;
}

const apiKey = import.meta.env.VITE_GEMINI_API_KEY?.trim();

export function isDiaryAiAvailable(): boolean {
  return Boolean(apiKey);
}

export async function sendDiaryChat(messages: DiaryChatMessage[]): Promise<string> {
  if (!apiKey) {
    throw new Error(
      "Configure VITE_GEMINI_API_KEY no ficheiro .env.local na raiz do projeto para usar o aprofundamento com IA."
    );
  }

  const ai = new GoogleGenAI({ apiKey });

  const contents = messages.map((m) => ({
    role: m.role === "assistant" ? ("model" as const) : ("user" as const),
    parts: [{ text: m.content }],
  }));

  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents,
    config: {
      systemInstruction: DIARY_AI_SYSTEM_PROMPT,
      maxOutputTokens: 1024,
    },
  });

  const text = response.text?.trim();
  if (!text) throw new Error("Resposta vazia do modelo.");
  return text;
}
