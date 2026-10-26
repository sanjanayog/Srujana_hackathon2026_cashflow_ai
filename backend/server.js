
const express = require("express");
const fs = require("fs");
const path = require("path");

require("dotenv").config();
const Groq = require("groq-sdk");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});


const app = express();
const PORT = 3000;

app.use(express.json());

app.post("/api/chat", async (req, res) => {
  try {
    const messages = req.body.messages;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        error: "Please send a message."
      });
    }

    const safeMessages = messages
      .filter(m =>
        ["user", "assistant"].includes(m.role) &&
        typeof m.content === "string"
      )
      .slice(-20);

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: "You are Flowly AI, a friendly financial assistant. Help users understand cash flow, expected income, expenses, and budgeting. Give clear, simple answers. Do not claim to know the user's actual financial data unless it is provided."
        },
        ...safeMessages
      ]
    });

    res.json({
      reply: completion.choices[0].message.content
    });
  } catch (error) {
    console.error("Groq chat error:", error.message);
    res.status(500).json({
      error: "The AI assistant could not respond. Check your Groq API key and server."
    });
  }
});


// Serve your existing frontend from the project root.
app.use(express.static(path.join(__dirname, "..")));
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "frontend final file .html"));
});

function getMockData() {
  const filePath = path.join(
    __dirname,
    "mock-transactions.json"
  );

  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

// Test the backend.
app.get("/api/health", (req, res) => {
  res.json({ status: "Flowly backend is running" });
});

// Return the fictional account and its transactions.
app.get("/api/bank", (req, res) => {
  res.json(getMockData());
});

// Return only transaction history.
app.get("/api/transactions", (req, res) => {
  res.json(getMockData().transactions);
});

app.listen(PORT, () => {
  console.log(`Flowly running at http://localhost:${PORT}`);
});
