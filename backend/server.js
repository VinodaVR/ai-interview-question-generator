const express = require("express");
const cors = require("cors");
require("dotenv").config();

const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();

app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(
  process.env.GEMINI_API_KEY
);

// Test backend
app.get("/", (req, res) => {
  res.send("AI Interview Generator Backend");
});

// Check available Gemini models
app.get("/models", async (req, res) => {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`
    );

    const data = await response.json();

    res.json(data);
  } catch (error) {
    console.error("Models Error:", error);

    res.status(500).json({
      success: false,
      message: "Could not fetch Gemini models"
    });
  }
});

// Generate interview questions
app.post("/generate-interview", async (req, res) => {
  try {
    const {
      role,
      experience,
      skills,
      numberOfQuestions
    } = req.body;

    // Check required fields
    if (
      !role ||
      !experience ||
      !skills ||
      !numberOfQuestions
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required."
      });
    }

    // Convert number to integer
    const questionCount = Number(numberOfQuestions);

    // Maximum 10 questions
    if (
      !Number.isInteger(questionCount) ||
      questionCount < 1 ||
      questionCount > 10
    ) {
      return res.status(400).json({
        success: false,
        message: "Number of questions must be between 1 and 10."
      });
    }

    // Gemini model
    const model = genAI.getGenerativeModel({
      model: "gemini-3.8-flash"
    });

    const prompt = `
You are an expert technical interviewer.

Generate exactly ${questionCount} interview questions for a candidate.

Job Role:
${role}

Experience:
${experience}

Skills:
${skills}

For every question provide:

1. Question
2. Answer
3. Difficulty
4. Explanation

Requirements:

- Questions must be relevant to the job role.
- Questions must match the candidate's experience.
- Questions must be related to the provided skills.
- Include a mixture of conceptual and practical questions.
- Answers should be clear and suitable for an interview.
- Difficulty should be Easy, Medium, or Hard.
- Generate exactly ${questionCount} questions.
- Do not generate extra text.

Return ONLY valid JSON.

Use exactly this format:

[
  {
    "question": "Question here",
    "answer": "Answer here",
    "difficulty": "Easy",
    "explanation": "Explanation here"
  }
]
`;

    let result = null;

    // Retry only temporary 503 errors
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(
          `Sending request to Gemini... Attempt ${attempt}`
        );

        result = await model.generateContent(prompt);

        console.log("Gemini request successful.");

        break;

      } catch (error) {
        console.error(
          `Gemini attempt ${attempt} failed:`,
          error.status,
          error.message
        );

        // Do NOT retry quota errors
        if (error.status === 429) {
          throw error;
        }

        // Retry temporary Gemini server errors
        if (error.status === 503 && attempt < 3) {
          console.log(
            "Gemini is temporarily busy. Retrying in 3 seconds..."
          );

          await new Promise((resolve) => {
            setTimeout(resolve, 3000);
          });

          continue;
        }

        throw error;
      }
    }

    if (!result) {
      throw new Error("No response received from Gemini.");
    }

    const text = result.response.text();

    console.log("Gemini Response:");
    console.log(text);

    // Remove markdown code blocks
    const cleanedText = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    let questions;

    try {
      questions = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error("JSON Parse Error:", parseError);

      return res.status(500).json({
        success: false,
        message:
          "Gemini returned an unexpected response. Please try again."
      });
    }

    // Make sure Gemini returned an array
    if (!Array.isArray(questions)) {
      return res.status(500).json({
        success: false,
        message:
          "Invalid response received from Gemini."
      });
    }

    res.json({
      success: true,
      questions: questions
    });

  } catch (error) {
    console.error("Final Error:", error);

    // Quota exceeded
    if (error.status === 429) {
      return res.status(429).json({
        success: false,
        message:
          "Gemini API quota has been reached. Please try again after the quota resets."
      });
    }

    // Gemini temporarily unavailable
    if (error.status === 503) {
      return res.status(503).json({
        success: false,
        message:
          "Gemini is currently busy. Please try again later."
      });
    }

    // Invalid API key
    if (
      error.status === 401 ||
      error.status === 403
    ) {
      return res.status(500).json({
        success: false,
        message:
          "Gemini API key is invalid or does not have permission."
      });
    }

    res.status(500).json({
      success: false,
      message:
        "Failed to generate interview questions."
    });
  }
});

// Start server
const PORT = 5000;

app.listen(PORT, () => {
  console.log(
    `Server running on http://localhost:${PORT}`
  );
});