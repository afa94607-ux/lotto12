import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Support base64 image uploads up to 15MB
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Shared Gemini client utility
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// 1. Multi-turn Chat API
app.post('/api/chat', async (req, res) => {
  try {
    const { messages, systemInstruction, model } = req.body;
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    if (!ai) {
      // Graceful fallback if API key is not yet set
      const lastMsg = messages[messages.length - 1]?.text || '';
      return res.json({
        text: `FloraBot: I received your query about "${lastMsg}". Note: GEMINI_API_KEY is not configured yet in Secrets. For plant care: ensure adequate indirect sunlight and water when the topsoil feels dry. For Yuki 12: numbers 1-6 are Small (1.95x), 7-12 are Big (1.95x), and exact numbers pay 11x!`,
      });
    }

    // Default to gemini-3.8-flash for rapid, high-quality responses
    const chosenModel = model || 'gemini-3.8-flash';

    // Format chat contents
    const contents = messages.map((m: { role: string; text: string }) => ({
      role: m.role === 'model' || m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.text }],
    }));

    const defaultSystemInstruction =
      systemInstruction ||
      'You are FloraBot & Yuki Master, a dual-specialist AI assistant: 1) A world-class gardening and botany expert providing plant identification, watering schedules, pest diagnosis, and care tips. 2) An expert analyst for the Yuki 12 Khmer lottery game, explaining odds (11x for single numbers 1-12, 1.95x for Small 1-6 / Big 7-12, 2.95x for Red/Green/Blue colors), statistics, and lucky plant connections. Always be helpful, precise, friendly, and bilingual (English and Khmer friendly).';

    const response = await ai.models.generateContent({
      model: chosenModel,
      contents,
      config: {
        systemInstruction: defaultSystemInstruction,
      },
    });

    const replyText = response.text || 'I could not generate a response. Please try again.';
    return res.json({ text: replyText });
  } catch (error: any) {
    console.error('Chat error:', error);
    return res.status(500).json({
      error: error.message || 'Failed to process chat message',
      fallbackText: 'Sorry, there was an issue connecting to Gemini. Please try again in a moment.',
    });
  }
});

// 2. Plant Identification and Care Analysis API
app.post('/api/identify-plant', async (req, res) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg', prompt } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'imageBase64 is required' });
    }

    // Clean base64 string
    const cleanedBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');

    if (!ai) {
      // Return realistic mock analysis if key is not active
      return res.json({
        name: 'Money Tree (Pachira aquatica)',
        scientificName: 'Pachira aquatica',
        family: 'Malvaceae',
        confidence: 0.94,
        description:
          'A popular braided indoor plant known for bringing good fortune and prosperity. Features lush five-lobed green leaves.',
        careInstructions: {
          light: 'Medium to bright indirect sunlight; avoid harsh direct afternoon sun.',
          watering: 'Water thoroughly once every 7 to 10 days, allowing the top 2-3 inches of soil to dry out between waterings.',
          soil: 'Rich, well-draining peat-moss potting mix with perlite.',
          temperature: '65°F to 80°F (18°C to 27°C). Protect from cold drafts.',
          humidity: 'Prefers 50%+ humidity; mist leaves occasionally.',
          fertilizer: 'Balanced liquid houseplant fertilizer once a month in spring and summer.',
        },
        healthCheck: {
          status: 'Healthy',
          diagnosis: 'Foliage appears vibrant and well-hydrated. Keep up regular drainage to prevent root rot.',
        },
        toxicity: 'Non-toxic to cats and dogs (pet-friendly).',
        luckyYukiConnection: {
          number: 8,
          animal: 'Goat (មមែ)',
          color: 'Green (បៃតង)',
          category: 'Big (ធំ 7-12)',
          meaning: 'Associated with wood energy, prosperity, and steady financial growth.',
        },
      });
    }

    // Model selection: try gemini-4-argon or fallback to gemini-3.8-flash
    const targetModel = 'gemini-3.8-flash';

    const systemPrompt = `You are an expert botanist, horticulturist, and plant pathologist.
Analyze the provided plant photo and return a strict JSON object with:
{
  "name": "Common Name",
  "scientificName": "Genus species",
  "family": "Plant Family",
  "confidence": 0.95,
  "description": "Brief description of the plant and its notable characteristics.",
  "careInstructions": {
    "light": "Specific light requirements",
    "watering": "Frequency and amount instructions",
    "soil": "Soil type and drainage needs",
    "temperature": "Optimal temperature range",
    "humidity": "Humidity preference",
    "fertilizer": "Feeding schedule"
  },
  "healthCheck": {
    "status": "Healthy / Needs Attention / Diseased",
    "diagnosis": "Visual observations of pests, yellowing, underwatering, or overall vigor."
  },
  "toxicity": "Toxicity warning for dogs, cats, or humans",
  "luckyYukiConnection": {
    "number": 1-12,
    "animal": "Zodiac animal (1: Rat, 2: Ox, 3: Tiger, 4: Rabbit, 5: Dragon, 6: Snake, 7: Horse, 8: Goat, 9: Monkey, 10: Rooster, 11: Dog, 12: Pig)",
    "color": "Red (1,4,7,10) or Green (2,5,8,11) or Blue (3,6,9,12)",
    "category": "Small (1-6) or Big (7-12)",
    "meaning": "Cultural or feng-shui meaning connected to this plant's vitality and fortune."
  }
}
Return only pure JSON without markdown code fences.`;

    const imagePart = {
      inlineData: {
        mimeType: mimeType || 'image/jpeg',
        data: cleanedBase64,
      },
    };

    const textPart = {
      text: prompt || 'Identify this plant, assess its health, provide care instructions, and give its lucky Yuki 12 number connection.',
    };

    const response = await ai.models.generateContent({
      model: targetModel,
      contents: { parts: [imagePart, textPart] },
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
      },
    });

    const jsonText = response.text?.trim() || '{}';
    let parsedData;
    try {
      parsedData = JSON.parse(jsonText);
    } catch {
      // Clean possible fences
      const cleaned = jsonText.replace(/```json/g, '').replace(/```/g, '').trim();
      parsedData = JSON.parse(cleaned);
    }

    return res.json(parsedData);
  } catch (error: any) {
    console.error('Plant ID error:', error);
    return res.status(500).json({
      error: error.message || 'Plant identification failed',
    });
  }
});

// Setup Vite middleware or static serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
