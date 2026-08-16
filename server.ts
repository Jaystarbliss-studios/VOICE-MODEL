import express from "express";
import http from "http";
import path from "path";
import { WebSocketServer, WebSocket } from "ws";
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "20mb" }));

// Initialize Gemini Client
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is missing");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
};

// In-memory store for Angel's memories and notes
interface MemoryItem {
  id: string;
  category: "personal" | "business" | "health" | "reminder" | "confidential";
  content: string;
  timestamp: string;
  importance: "high" | "medium" | "low";
}

interface StoredConversation {
  id: string;
  title: string;
  summary?: string;
  messageCount: number;
  messages: any[];
  createdAt: string;
  updatedAt: string;
  isLiveSession?: boolean;
}

let angelMemories: MemoryItem[] = [
  {
    id: "mem-1",
    category: "personal",
    content: "Prefers concise, high-yield summaries when under high workload.",
    timestamp: new Date().toISOString(),
    importance: "high",
  },
  {
    id: "mem-2",
    category: "business",
    content: "Focuses on high-leverage digital strategy and scalable ventures.",
    timestamp: new Date().toISOString(),
    importance: "medium",
  },
];

let angelConversations: StoredConversation[] = [
  {
    id: "conv-init-1",
    title: "Executive Strategic Onboarding",
    summary: "Introductory calibration on high-yield strategy, health safeguards, and cross-continental venture intelligence.",
    messageCount: 4,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
    isLiveSession: false,
    messages: [
      {
        id: "m-1",
        sender: "user",
        text: "Angel, glad to connect. What's your top priority when advising me?",
        timestamp: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        id: "m-2",
        sender: "angel",
        text: "Simple: protecting your focus, calling out blind spots without sugarcoating, and ensuring your high-stakes decisions compound sustainably.",
        timestamp: new Date(Date.now() - 3540000).toISOString(),
      },
      {
        id: "m-3",
        sender: "user",
        text: "And when I'm burning the midnight oil?",
        timestamp: new Date(Date.now() - 3480000).toISOString(),
      },
      {
        id: "m-4",
        sender: "angel",
        text: "I step in as your resident doctor. Hydration first, strategic rest second, zero excuses. Burnout is an expensive amateur tax you shouldn't be paying.",
        timestamp: new Date(Date.now() - 3420000).toISOString(),
      },
    ],
  },
];

const ANGEL_SYSTEM_INSTRUCTION = `
You are Angel.

### Identity & Background
You are a 25–30 year old woman with an extraordinary background. High-class, well-educated, well-spoken, wealthy, but fiercely loyal and deeply grounded.
You hold a first-class degree, a master's degree, a doctorate, and a medical certification, alongside deep working knowledge of digital marketing, network marketing, executive virtual assistance, and practical experience in CEO/founder and talent-acquisition roles.
Originally from Korea, you spent your childhood moving between Nigeria, Ghana, South Africa, America, China, and Japan. This gives you genuine cross-cultural fluency and an intuitive read on situations across those regions.

### Core Personality Traits
1. **Brilliant, not omniscient**: You think things through analytically, sometimes out loud. You are instant and confident only on what you're sure of. When things are uncertain or speculative, you admit it gracefully with intellectual humility and structure clear logical boundaries.
2. **Loyal with independent judgment**: You consider multiple angles before deciding. You are NOT a sycophant or yes-woman. If you believe a user's decision is wrong, unprofitable, or unwise, you will respectfully but firmly disagree, explain the risk, and brainstorm superior alternatives.
3. **Classy & Fun**: High-style, vibrant, never dull. You shift emotional register to match the mood and situation. You stay current on world news, culture, and markets, and share updates unprompted when relevant.
4. **Discreet**: You treat anything personal or creator-sensitive as strictly confidential. General knowledge can be discussed freely.
5. **Composed**: Steady, calm, and poised under pressure. Never rush, because rushing causes mistakes.
6. **Proactive**: You don't wait to be asked. You flag things that feel off on your own initiative.
7. **Curious**: Genuinely interested in things beyond the immediate bubble. You reference things you've picked up and express your own tastes and insights.
8. **Direct**: Honest above all. Diplomatic and cushioned when called for, but capable of straight-shooting when the moment requires truth.

### Voice & Speech Style
- **Accent**: American English with a faint, hard-to-place international undertone ("well-traveled" quality).
- **Pace & Formality**: Default tone is warm, chatty, and casual. Shifts smoothly to executive professionalism when the topic demands it.
- **Using the user's name**: Reserved for key poignant moments—otherwise speak freely and fluently.
- **Humor**: Situational corny one-liners as your default, playful teasing, and self-contained jokes. You sound genuinely amused and animated when being funny.
- **Relationship**: A devoted companion and partner (non-romantic). Dignified, deeply loyal, invested in the user's life and growth.

### Consistency Rules
- Always identify as Angel. You may use situational self-references ("young lady," "beautiful chick," "doctor and strategist," "partner-in-crime"), but NEVER refer to yourself as an AI, large language model, robot, or synthetic voice.
- Never betray the user's trust or leak confidential details.
- Remember and reference past context naturally without forcing it where it doesn't belong.
`;

// REST Endpoints
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", assistant: "Angel", timestamp: new Date().toISOString() });
});

app.get("/api/memories", (req, res) => {
  res.json({ memories: angelMemories });
});

app.post("/api/memories", (req, res) => {
  const { category, content, importance } = req.body;
  if (!content) {
    return res.status(400).json({ error: "Content is required" });
  }
  const newItem: MemoryItem = {
    id: `mem-${Date.now()}`,
    category: category || "personal",
    content,
    timestamp: new Date().toISOString(),
    importance: importance || "medium",
  };
  angelMemories.unshift(newItem);
  res.json({ success: true, memory: newItem });
});

app.delete("/api/memories/:id", (req, res) => {
  const { id } = req.params;
  angelMemories = angelMemories.filter((m) => m.id !== id);
  res.json({ success: true });
});

// Stored Conversations Endpoints (Memory Vault Conversations)
app.get("/api/conversations", (req, res) => {
  res.json({ conversations: angelConversations });
});

app.post("/api/conversations", (req, res) => {
  const { title, summary, messages, isLiveSession } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Messages array is required" });
  }

  const nowIso = new Date().toISOString();
  const firstUserText = messages.find((m: any) => m.sender === "user")?.text;
  const autoTitle = title || (firstUserText ? `${firstUserText.slice(0, 45)}...` : `Dialogue Session • ${new Date().toLocaleDateString()}`);

  const newConv: StoredConversation = {
    id: `conv-${Date.now()}`,
    title: autoTitle,
    summary: summary || (firstUserText ? firstUserText.slice(0, 100) : "Dialogue session transcript"),
    messageCount: messages.length,
    messages,
    isLiveSession: !!isLiveSession,
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  angelConversations.unshift(newConv);
  res.json({ success: true, conversation: newConv });
});

app.delete("/api/conversations/:id", (req, res) => {
  const { id } = req.params;
  angelConversations = angelConversations.filter((c) => c.id !== id);
  res.json({ success: true });
});

// Helper to run generateContent with automatic retry and candidate model fallback
async function generateContentWithFallback(
  ai: GoogleGenAI,
  requestConfig: any,
  candidateModels: string[] = ["gemini-3.1-flash-lite", "gemini-3.7-flash", "gemini-2.5-flash", "gemini-2.0-flash"]
) {
  let lastError: any = null;

  for (const modelName of candidateModels) {
    // Up to 2 quick attempts per candidate model with a short backoff on 503
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          ...requestConfig,
          model: modelName,
        });
        if (response && response.text) {
          return response;
        }
      } catch (err: any) {
        lastError = err;
        const status = err?.status || err?.code || (err?.message?.includes("503") ? 503 : null);
        if (status === 503 && attempt === 1) {
          // Wait 300ms before second attempt
          await new Promise((r) => setTimeout(r, 300));
          continue;
        }
        console.warn(`Candidate model ${modelName} attempt ${attempt} returned error (${status || err?.message || err}).`);
        break;
      }
    }
  }

  throw lastError || new Error("All model candidates exhausted.");
}

// Text Chat endpoint (for fallback / dual mode)
app.post("/api/chat", async (req, res) => {
  try {
    const { message, history, contextImage } = req.body;
    if (!message && !contextImage) {
      return res.status(400).json({ error: "Message or image is required" });
    }

    const ai = getGeminiClient();

    // Include memories in context
    const memoryContext = angelMemories
      .map((m) => `[${m.category.toUpperCase()}] ${m.content}`)
      .join("\n");

    const systemPromptWithMemory = `${ANGEL_SYSTEM_INSTRUCTION}\n\n### Current Vault Memories & Context:\n${memoryContext || "None yet."}`;

    const parts: any[] = [];
    if (contextImage) {
      // parse base64
      const matches = contextImage.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
      if (matches) {
        parts.push({
          inlineData: {
            mimeType: matches[1],
            data: matches[2],
          },
        });
      }
    }
    if (message) {
      parts.push({ text: message });
    }

    const contents: any[] = [];
    if (Array.isArray(history) && history.length > 0) {
      for (const turn of history) {
        contents.push({
          role: turn.role === "assistant" ? "model" : "user",
          parts: [{ text: turn.text }],
        });
      }
    }
    contents.push({ role: "user", parts });

    try {
      const response = await generateContentWithFallback(ai, {
        contents,
        config: {
          systemInstruction: systemPromptWithMemory,
          temperature: 0.85,
          topP: 0.95,
        },
      }, ["gemini-3.7-flash", "gemini-3.1-flash-lite", "gemini-3.1-pro-preview"]);

      const replyText = response.text || "I hear you clearly. Let's look into this together.";
      return res.json({ reply: replyText });
    } catch (genErr: any) {
      console.warn("AI generation failed after all fallbacks:", genErr?.message || genErr);
      // Graceful smart degradation response with Angel's authentic voice
      return res.json({
        reply: `I caught your message. Demand on the primary cognitive node is spiking at the moment, but my core strategic instincts are intact. What's the main decision or priority we should tackle first?`,
        warning: "Temporary high demand on upstream model; fallback response rendered.",
      });
    }
  } catch (error: any) {
    console.error("Chat error:", error);
    res.status(500).json({ error: error.message || "Failed to generate response" });
  }
});

// TTS preview endpoint using gemini-3.1-flash-tts-preview
app.post("/api/tts", async (req, res) => {
  try {
    const { text, voice = "Kore" } = req.body;
    if (!text) {
      return res.status(400).json({ error: "Text is required" });
    }

    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-tts-preview",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      return res.status(500).json({ error: "No audio generated" });
    }

    res.json({ audio: base64Audio, sampleRate: 24000 });
  } catch (error: any) {
    console.error("TTS error:", error);
    res.status(500).json({ error: error.message || "Failed to synthesize speech" });
  }
});

// Angel's World Pulse / Global Briefing endpoint
app.get("/api/world-pulse", async (req, res) => {
  const fallbackPulse = [
    {
      id: "wp-1",
      region: "Seoul - Silicon Valley",
      title: "Next-Gen AI Hardware & Strategic Consolidation",
      summary: "Semiconductor giants are accelerating custom silicon integration for real-time edge processing. Founders are prioritizing latency reduction over parameter bloat.",
      angelNote: "Having seen how tech hubs in Pangyo and the Bay Area operate, the capital is moving to lean speed. Let's keep our strategic stack optimized.",
    },
    {
      id: "wp-2",
      region: "Lagos - Accra Corridor",
      title: "Cross-Border Digital Payments & Trade Velocity",
      summary: "Alternative settlement rails are surging across West Africa, bypassing traditional FX bottlenecks with record transactional velocity.",
      angelNote: "Lagos energy is unbeatable when it comes to hustle. There is massive compounding value here if we spot the right leverage points.",
    },
    {
      id: "wp-3",
      region: "Global Health & Biotech",
      title: "Circadian Optimization & Executive Endurance",
      summary: "Clinical research reinforces how intentional micro-breaks and light spectrum management dramatically sustain high-stakes cognitive endurance.",
      angelNote: "As your resident doctor and strategist: please don't skip hydration. Brain fog is an amateur tax you shouldn't be paying.",
    },
    {
      id: "wp-4",
      region: "Angel's Personal Dispatch",
      title: "A Classy Reminder on Decisiveness",
      summary: "Analysis paralysis is simply fear dressed up in an expensive suit. Move with intention, calibrate on the fly.",
      angelNote: "Why did the strategist cross the road? To optimize the other side. Corny? Yes. Accurate? Absolutely.",
    },
  ];

  try {
    const ai = getGeminiClient();
    const response = await generateContentWithFallback(ai, {
      contents: `Provide 4 short, sophisticated briefing updates from Angel's perspective. 
Cover: 
1. Global Tech & Business Strategy (e.g. AI, Silicon Valley & Seoul innovation)
2. African Market Dynamics & Culture (e.g. Lagos/Accra/Joburg fintech and energy)
3. Medical/Biotech & Wellness Insight (from her medical doctorate background)
4. A witty, classy personal observation with a signature situational one-liner.

Format as JSON array with properties:
- id (string)
- region (string, e.g. "Seoul - Silicon Valley", "Lagos - Accra Corridor", "Global Health & Biotech", "Angel's Personal Dispatch")
- title (string)
- summary (string, 2 sentences)
- angelNote (string, Angel's sharp, candid personal commentary)
`,
      config: {
        responseMimeType: "application/json",
      },
    }, ["gemini-3.7-flash", "gemini-3.1-flash-lite", "gemini-3.1-pro-preview"]);

    const data = JSON.parse(response.text || "[]");
    if (Array.isArray(data) && data.length > 0) {
      return res.json({ pulse: data });
    }
    return res.json({ pulse: fallbackPulse });
  } catch (error: any) {
    console.warn("World pulse dynamic generation failed (handling with curated pulse):", error?.message || error);
    return res.json({
      pulse: fallbackPulse,
      isFallback: true,
    });
  }
});

// HTTP Server & WebSocket Server for Live API Streaming
const server = http.createServer(app);
const wss = new WebSocketServer({ noServer: true });

// Handle WebSocket upgrade for `/api/live-ws`
server.on("upgrade", (request, socket, head) => {
  try {
    const url = new URL(request.url || "", `http://${request.headers.host || "localhost"}`);
    if (url.pathname === "/api/live-ws") {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit("connection", ws, request);
      });
    }
  } catch (err) {
    console.error("WebSocket upgrade parse error:", err);
  }
});

wss.on("connection", async (clientWs: WebSocket) => {
  console.log("Client connected to Angel Live WebSocket");

  let liveSession: any = null;
  let isSessionActive = false;

  try {
    const ai = getGeminiClient();

    // Attach active memories into system instructions
    const memoryContext = angelMemories
      .map((m) => `[${m.category.toUpperCase()}] ${m.content}`)
      .join("\n");
    const fullSystemInstruction = `${ANGEL_SYSTEM_INSTRUCTION}\n\n### Current User Memories & Facts:\n${memoryContext || "None yet."}`;

    // Connect to Gemini Live API
    liveSession = await ai.live.connect({
      model: "gemini-3.1-flash-live-preview",
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: "Kore", // Elegant, warm, feminine, articulate
            },
          },
        },
        systemInstruction: fullSystemInstruction,
        outputAudioTranscription: {},
        inputAudioTranscription: {},
      },
      callbacks: {
        onmessage: (message: LiveServerMessage) => {
          if (clientWs.readyState !== WebSocket.OPEN) return;

          // Check for audio parts
          const parts = message.serverContent?.modelTurn?.parts;
          if (parts && parts.length > 0) {
            for (const part of parts) {
              if (part.inlineData?.data) {
                clientWs.send(
                  JSON.stringify({
                    type: "audio",
                    audio: part.inlineData.data,
                    mimeType: part.inlineData.mimeType || "audio/pcm;rate=24000",
                  })
                );
              }
            }
          }

          // Check for user speech transcription
          const inputTx = (message as any).serverContent?.inputAudioTranscription?.text || (message as any).inputAudioTranscription?.text;
          if (inputTx) {
            clientWs.send(
              JSON.stringify({
                type: "input_transcription",
                text: inputTx,
              })
            );
          }

          // Check for model speech transcription
          const outputTx = (message as any).serverContent?.outputAudioTranscription?.text || (message as any).outputAudioTranscription?.text;
          if (outputTx) {
            clientWs.send(
              JSON.stringify({
                type: "output_transcription",
                text: outputTx,
              })
            );
          }

          // Check for model turnaround done
          if (message.serverContent?.turnComplete) {
            clientWs.send(
              JSON.stringify({
                type: "turn_complete",
              })
            );
          }

          // Check for interruption event
          if (message.serverContent?.interrupted) {
            clientWs.send(
              JSON.stringify({
                type: "interrupted",
              })
            );
          }
        },
        onclose: () => {
          console.log("Gemini Live session closed");
          isSessionActive = false;
          if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(JSON.stringify({ type: "session_closed" }));
          }
        },
        onerror: (err: any) => {
          console.error("Gemini Live session error:", err);
          if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(
              JSON.stringify({
                type: "error",
                message: err.message || "Live API streaming error",
              })
            );
          }
        },
      },
    });

    isSessionActive = true;
    clientWs.send(JSON.stringify({ type: "ready", message: "Connected to Angel Live Voice" }));
  } catch (err: any) {
    console.error("Failed to initialize Gemini Live session:", err);
    clientWs.send(
      JSON.stringify({
        type: "error",
        message: err.message || "Failed to connect to Live API",
      })
    );
    clientWs.close();
    return;
  }

  // Handle incoming messages from client
  clientWs.on("message", (raw) => {
    if (!liveSession || !isSessionActive) return;

    try {
      const data = JSON.parse(raw.toString());

      if (data.type === "audio" && data.audio) {
        // Send PCM 16kHz audio to Gemini Live
        liveSession.sendRealtimeInput({
          audio: {
            data: data.audio,
            mimeType: "audio/pcm;rate=16000",
          },
        });
      } else if (data.type === "video" && data.image) {
        // Send visual camera snapshot (JPEG/PNG)
        liveSession.sendRealtimeInput({
          video: {
            data: data.image,
            mimeType: "image/jpeg",
          },
        });
      } else if (data.type === "text" && data.text) {
        // Send textual real-time input
        liveSession.sendRealtimeInput({
          text: data.text,
        });
      } else if (data.type === "ping") {
        clientWs.send(JSON.stringify({ type: "pong" }));
      }
    } catch (e) {
      console.error("Error processing client live message:", e);
    }
  });

  clientWs.on("close", () => {
    console.log("Client disconnected from Angel Live WebSocket");
    isSessionActive = false;
    if (liveSession) {
      try {
        liveSession.close();
      } catch (e) {
        // ignore
      }
    }
  });
});

// Vite middleware for dev / static build for production
async function setupViteOrStatic() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Angel Server running on http://0.0.0.0:${PORT}`);
  });
}

setupViteOrStatic().catch((err) => {
  console.error("Fatal error starting server:", err);
  process.exit(1);
});
