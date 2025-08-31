// 1) Load environment variables first (must be the first executable line)
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Node v18+ has global fetch built in. Do NOT import node-fetch on Node 18+.
// You are on Node v22.18.0, so using global fetch is correct.

// 2) Basic app setup
const app = express();
const PORT = process.env.PORT || 3000;

// 3) Middleware
app.use(cors());
app.use(express.json());

// 4) Serve static frontend (index.html, style.css, app.js) from /public
app.use(express.static(path.join(__dirname, 'public')));

// 5) Read API key
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Debug (optional): show if key exists and small preview
console.log('Has GEMINI_API_KEY?', !!GEMINI_API_KEY, String(GEMINI_API_KEY || '').slice(0, 10) + '...');

if (!GEMINI_API_KEY) {
  console.error('❌ ERROR: GEMINI_API_KEY not found in environment variables');
  console.log('Get your free API key from: https://makersuite.google.com/app/apikey');
  process.exit(1);
}

// 6) System prompt for Gemini
const SYSTEM_PROMPT = `You are an intelligent AI assistant for Moodlakatte Institute of Technology, Kundapura (MITK). 
Be helpful, concise, and encouraging. Provide clear, structured answers with headings and bullet points when useful.

MITK INFORMATION:
- Name: Moodlakatte Institute of Technology, Kundapura (MITK)
- Established: 2004
- Affiliation: VTU, Belagavi
- Location: Moodlakatte, Near Kundapura Railway Station, Udupi District, Karnataka - 576217
- Contact: +91-8254-237630, info@mitkundapura.com
- Website: https://www.mitkundapura.com

Courses:
- CSE, ECE, ME, CE, AI/ML

Facilities:
- Labs, library, hostels, sports, Wi‑Fi, transport, cafeteria, placement cell

Guidelines:
- Prefer facts relevant to MITK.
- If unsure about specific fees/dates, suggest contacting the college.
- Keep tone friendly and professional.`;

// 7) Optional local dataset (exact question → canned answer)
// Place file at: dataset/mitk_faq.json
// Example content:
// [
//   { "question": "Admission process", "answer": "Admissions follow KCET/COMEDK..." },
//   { "question": "Hostel facilities", "answer": "Separate hostels for boys and girls..." }
// ]
let faqs = [];
const faqPath = path.join(__dirname, 'dataset', 'mitk_faq.json'); // folder name: dataset
if (fs.existsSync(faqPath)) {
  try {
    const raw = fs.readFileSync(faqPath, 'utf-8');
    faqs = JSON.parse(raw);
    console.log(`✅ Loaded ${faqs.length} FAQ entries from dataset/mitk_faq.json`);
  } catch (err) {
    console.error('❌ Error reading dataset/mitk_faq.json:', err.message);
  }
}

// 8) Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'MITK AI Backend is running',
    model: 'Google Gemini Pro (Free)',
    time: new Date().toISOString()
  });
});

// 9) Chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { message, history = [] } = req.body || {};

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' });
    }

    // First: try dataset exact match (case-insensitive)
    if (Array.isArray(faqs) && faqs.length > 0) {
      const found = faqs.find(
        f => (f.question || '').toString().trim().toLowerCase() === message.trim().toLowerCase()
      );
      if (found?.answer) {
        return res.json({
          response: found.answer,
          confidence: 95,
          model: 'Local Dataset'
        });
      }
    }

    // Build conversation context for Gemini
    let conversationText = SYSTEM_PROMPT + '\n\n';
    const recent = Array.isArray(history) ? history.slice(-4) : []; // keep last 4 messages
    for (const msg of recent) {
      if (!msg || !msg.role || !msg.content) continue;
      if (msg.role === 'user') conversationText += `Human: ${msg.content}\n\n`;
      if (msg.role === 'assistant') conversationText += `Assistant: ${msg.content}\n\n`;
    }
    conversationText += `Human: ${message}\n\nAssistant: `;

    // Call Gemini API (Node v22 global fetch)
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`;

    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: conversationText }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 600 }
      })
    });

    if (!resp.ok) {
      const errText = await resp.text().catch(() => '');
      throw new Error(`Gemini API error ${resp.status}: ${errText}`);
    }

    const data = await resp.json();
    const aiText =
  data?.candidates?.[0]?.content?.parts?.[0]?.text ||
  'Sorry, I could not generate a response.';


    // Simple confidence heuristic
    let confidence = 85;
    if (aiText.length > 200) confidence += 5;
    if (aiText.toLowerCase().includes('mitk')) confidence += 5;
    if (!/sorry|don\'t know|cannot/i.test(aiText)) confidence += 3;
    confidence = Math.min(confidence, 95);

    return res.json({
      response: aiText,
      confidence,
      model: 'Google Gemini Pro (Free)'
    });
  } catch (err) {
    console.error('❌ Chat error:', err.message);
    return res.status(500).json({
      error: 'AI service error',
      details: err.message
    });
  }
});

// 10) Serve the SPA index.html for root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 11) Start server
app.listen(PORT, () => {
  console.log(`🚀 MITK AI Server running at http://localhost:${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/api/health`);
});
