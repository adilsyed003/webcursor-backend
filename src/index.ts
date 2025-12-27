import { GoogleGenAI } from "@google/genai";
import "dotenv/config";
import { getSystemPrompt } from "./prompt.js";
import express from "express";
import cors from "cors";
import { basePrompt as reactBasePrompt } from "./defaults/react.js";
import { basePrompt as nodeBasePrompt } from "./defaults/node.js";
import { BASE_PROMPT } from "./prompt.js";
const app = express();
const port = process.env.PORT || 3000;
app.use(cors());
app.use(express.json());
// console.log(process.env.GEMINI_API_KEY);

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
});

// async function main() {
//   const response = await ai.models.generateContentStream({
//     model: "gemini-2.5-flash-lite",
//     contents: "create a todo app",
//     config: {
//       maxOutputTokens: 3000,
//       systemInstruction: getSystemPrompt(),
//     },
//   });
//   for await (const chunk of response) {
//     console.log(chunk.text);
//   }
// }

// await main();

app.post("/template", async (req, res) => {
  const prompt = req.body.prompt || "";
  const nodeRegex = /\b(?:node|nodejs|node\.js)\b/i;
  const answer = nodeRegex.test(String(prompt));
  if (answer) {
    res.json({
      prompts: [
        `Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${reactBasePrompt}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - .gitignore\n  - package-lock.json\n`,
      ],
      uiPrompts: [nodeBasePrompt],
    });
    return;
  } else {
    res.json({
      prompts: [
        BASE_PROMPT,
        `Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${reactBasePrompt}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - .gitignore\n  - package-lock.json\n`,
      ],
      uiPrompts: [reactBasePrompt],
    });
    return;
  }
  res.status(403).json({ message: "You cant access this" });
  return;
});

app.post("/chat", async (req, res) => {
  const messages = req.body.messages;
  const contents = messages.map((msg: any) => ({
    role: msg.role === "assistant" ? "model" : "user",
    parts: [{ text: msg.content }],
  }));
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-lite",
    contents: contents,
    config: {
      maxOutputTokens: 12000,
      systemInstruction: {
        parts: [{ text: getSystemPrompt() }],
      },
    },
  });
  const text = response.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

  res.json({ response: text });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
