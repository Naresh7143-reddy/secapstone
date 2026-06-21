const express = require('express');
const router = express.Router();
const axios = require('axios');
const { verifyToken } = require('../middleware/auth');

const GROK_URL = process.env.GROK_API_URL || 'https://api.x.ai/v1/chat/completions';
const GROK_KEY = process.env.GROK_API_KEY;
const GROK_MODEL = process.env.GROK_MODEL || 'grok-4.3';

// AI evaluation of a code submission using the Grok API.
router.post('/evaluate', verifyToken, async (req, res) => {
  if (!GROK_KEY) {
    return res
      .status(503)
      .json({ error: 'AI review not configured: set GROK_API_KEY on the server.' });
  }

  try {
    const { question, code, language, testResults } = req.body;

    const prompt = `You are an expert programming interviewer. Evaluate this submission and respond ONLY with strict JSON.

QUESTION: ${question?.title || ''}
STATEMENT: ${question?.description || question?.problem_statement || ''}
CONSTRAINTS: ${question?.constraints || 'n/a'}
LANGUAGE: ${language}
TEST RESULTS: ${JSON.stringify(testResults || {})}

CANDIDATE CODE:
\`\`\`${language}
${code}
\`\`\`

Respond with JSON exactly in this shape:
{
  "code_quality_score": <0-10>,
  "time_complexity": "<Big-O>",
  "space_complexity": "<Big-O>",
  "optimization_suggestions": ["..."],
  "feedback_summary": "<2-3 sentences>",
  "final_score": <0-100>
}`;

    const { data } = await axios.post(
      GROK_URL,
      {
        model: GROK_MODEL,
        messages: [
          { role: 'system', content: 'You output only valid JSON. No markdown, no prose.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.2,
      },
      {
        headers: {
          Authorization: `Bearer ${GROK_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 45000,
      }
    );

    const raw = data?.choices?.[0]?.message?.content || '{}';
    const cleaned = raw.replace(/```json|```/g, '').trim();
    let review;
    try {
      review = JSON.parse(cleaned);
    } catch {
      review = { feedback_summary: raw, final_score: null };
    }

    res.json({ review });
  } catch (error) {
    console.error('AI evaluate error:', error.response?.data || error.message);
    res.status(500).json({ error: 'AI evaluation failed' });
  }
});

module.exports = router;
