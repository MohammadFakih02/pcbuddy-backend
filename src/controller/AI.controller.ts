import { GoogleGenerativeAI } from "@google/generative-ai";
import Elysia, { t } from "elysia";
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
export const AIController = new Elysia()
.post(
    '/ask-gemini',
    async ({ body }: { body: { prompt: string } }) => {
      const { prompt } = body;

      const promptText = `
      Given the following user prompt, return a JSON object with the best PC components that match the user's needs:

      User Prompt: "${prompt}"

      The AI should:
      - Estimate a budget range for the PC (e.g., between $0 and $10000).
      - Suggest a PC build with the following components:
        - CPU name
        - GPU name
        - RAM name
        - PSU name
        - Case name
        - HDD name
        - SSD name
        - Motherboard name

      Return the response in the following format:

      {
          "cpu": "name of the CPU",
          "gpu": "name of the GPU",
          "ram": "name of the RAM",
          "psu": "name of the PSU",
          "case": "name of the case",
          "hdd": "name of the HDD",
          "ssd": "name of the SSD",
          "motherboard": "name of the motherboard"
      }

      Ensure the response is a valid JSON object and does not contain any additional text or explanations.
      `;

      try {
        const result = await model.generateContent(promptText);
        const response = await result.response;
        const text = response.text();

        console.log('AI Response:', text); // Log the raw response for debugging

        // Extract the JSON part from the response (if needed)
        const jsonMatch = text.match(/\{.*\}/s);
        if (!jsonMatch) {
          return { success: false, error: 'No valid JSON found in the AI response.' };
        }

        // Parse the JSON part
        let jsonResponse;
        try {
          jsonResponse = JSON.parse(jsonMatch[0]);
        } catch (error) {
          return { success: false, error: 'Failed to parse AI response as JSON.' };
        }

        return { success: true, response: jsonResponse };
      } catch (error: unknown) {
        if (error instanceof Error) {
          return { success: false, error: error.message };
        } else {
          return { success: false, error: 'Unknown error occurred' };
        }
      }
    },
    {
      body: t.Object({
        prompt: t.String(),
      }),
    }
  )