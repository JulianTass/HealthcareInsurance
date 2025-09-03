// server/index.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const API_KEY = process.env.ANTHROPIC_API_KEY;
const MODEL = "claude-3-5-sonnet-20240620";
const PORT = Number(process.env.PORT || 8787);

// Types for chat messages (using JSDoc comments for type hints)
/**
 * @typedef {"user" | "assistant"} ChatRole
 */

/**
 * @typedef {Object} ChatMsg
 * @property {ChatRole} role
 * @property {string} content
 */

app.get("/api/health", (_req, res) => {
  if (!API_KEY) {
    return res.status(500).json({ ok: false, error: "Missing ANTHROPIC_API_KEY" });
  }
  res.json({ ok: true, model: MODEL });
});

app.post("/api/claude", async (req, res) => {
  try {
    if (!API_KEY) {
      return res.status(500).json({ error: "Server misconfigured: ANTHROPIC_API_KEY missing" });
    }

    const { userInput, subtopic, pack, history, mode } = req.body ?? {};

    const scope = `
You are a careful Year 7 math tutor. Stay strictly inside this scope.
Topic: ${subtopic?.topicTitle ?? "(unknown)"}
Subtopic: ${subtopic?.title ?? "(unknown)"}
Mode: ${mode ?? "chat"}.
Keep steps short and precise. If information is missing from the provided content, say so.
`.trim();

    const grounding = `
# THEORY
${pack?.theory ?? "(none)"}

# RULES
${pack?.rules ?? "(none)"}

# WORKED EXAMPLES
${JSON.stringify(pack?.examples ?? [], null, 2)}

# PRACTICE
${JSON.stringify(pack?.practices ?? [], null, 2)}

# DIAGRAMS (id -> {kind, params, name})
${JSON.stringify(pack?.diagramsById ?? {}, null, 2)}
`.trim();

    const systemPrompt = `${scope}\n\n${grounding}`;

    // ✅ Normalize chat history into ChatMsg[]
    /** @type {ChatMsg[]} */
    const normalizedHistory = Array.isArray(history)
      ? history
          .filter(
            (m) =>
              m &&
              (m.role === "user" || m.role === "assistant") &&
              typeof m.content === "string"
          )
          .map((m) => ({ role: m.role, content: m.content }))
      : [];

    // Append the latest user input
    if (userInput && typeof userInput === "string") {
      normalizedHistory.push({ role: "user", content: userInput });
    }

    // Call Anthropic Messages API
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 600,
        system: systemPrompt, // system prompt belongs here
        messages: normalizedHistory,
      }),
    });

    if (!r.ok) {
      const text = await r.text();
      console.error("[Anthropic error]", r.status, text);
      return res.status(r.status).json({ error: text });
    }

    const data = await r.json();
    res.json(data);
  } catch (e) {
    console.error("[/api/claude] server error:", e);
    const message =
      e instanceof Error ? e.message : typeof e === "string" ? e : "error";
    res.status(500).json({ error: message });
  }
});

app.listen(PORT, () => {
  console.log(`Claude API server running on http://localhost:${PORT}`);''
});