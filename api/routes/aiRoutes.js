const express = require('express');
const Groq = require('groq-sdk');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

let groq = null;
if (process.env.GROQ_API_KEY) {
    groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
}

const MODEL_NAME = "llama-3.3-70b-versatile";

router.post('/ai/chat', authenticateToken, async (req, res) => {
    try {
        const { prompt, context } = req.body;

        if (!prompt) return res.status(400).json({ error: "Prompt is required." });
        if (!groq) return res.status(500).json({ error: "Server missing Groq API client." });

        const contextString = context ? JSON.stringify(context, null, 2) : "No specific data context provided.";

        const fullPrompt = `
You are a helpful AI Business Assistant for a Shop Data Dashboard. 
You are analyzing business data for the following context:
${contextString}

User Question: ${prompt}

Guidance:
- Answer the user's question based strictly on the provided data context.
- Highlight key trends, totals, or anomalies if relevant.
- Be professional, concise, and encouraging.
- If the data isn't in the context, say you don't have that information.
- Format your response in Markdown (bold for numbers, lists for clarity).
`;

        const chatCompletion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: "You are a helpful data analysis assistant." },
                { role: "user", content: fullPrompt }
            ],
            model: MODEL_NAME,
            temperature: 0.5,
            max_tokens: 1024,
        });

        const text = chatCompletion.choices[0]?.message?.content || "No response generated.";
        res.json({ response: text });

    } catch (error) {
        console.error("AI Chat Error:", error);
        res.status(500).json({ error: "Failed to generate AI response. " + error.message });
    }
});

module.exports = router;
