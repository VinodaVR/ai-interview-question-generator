import { useState } from "react";
import "./App.css";

function App() {
  const [role, setRole] = useState("");
  const [experience, setExperience] = useState("");
  const [skills, setSkills] = useState("");
  const [numberOfQuestions, setNumberOfQuestions] = useState("");

  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const generateQuestions = async () => {
    setQuestions([]);
    setError("");

    // Validate job role
    if (!role.trim()) {
      setError("Please enter the job role.");
      return;
    }

    // Validate experience
    if (!experience.trim()) {
      setError("Please enter your experience.");
      return;
    }

    // Validate skills
    if (!skills.trim()) {
      setError("Please enter your skills.");
      return;
    }

    // Validate number of questions
    if (!numberOfQuestions) {
      setError("Please enter the number of questions.");
      return;
    }

    const questionCount = Number(numberOfQuestions);

    if (!Number.isInteger(questionCount)) {
      setError("Please enter a valid whole number.");
      return;
    }

    if (questionCount < 1) {
      setError("Number of questions must be at least 1.");
      return;
    }

    if (questionCount > 10) {
      setError("You can generate a maximum of 10 questions.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "http://localhost:5000/generate-interview",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json"
          },

          body: JSON.stringify({
            role: role.trim(),
            experience: experience.trim(),
            skills: skills.trim(),
            numberOfQuestions: questionCount
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
          "Failed to generate questions."
        );
      }

      setQuestions(data.questions);

    } catch (error) {
      console.error("Frontend Error:", error);

      setError(
        error.message ||
        "Something went wrong. Please try again."
      );

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">

      <h1>
        AI Interview Question Generator
      </h1>

      <p className="subtitle">
        Generate interview questions and answers using AI
      </p>

      <div className="form-container">

        {/* Job Role */}
        <label htmlFor="role">
          Job Role
        </label>

        <input
          id="role"
          type="text"
          placeholder="Example: Frontend Developer"
          value={role}
          onChange={(e) =>
            setRole(e.target.value)
          }
        />

        {/* Experience */}
        <label htmlFor="experience">
          Experience
        </label>

        <input
          id="experience"
          type="text"
          placeholder="Example: 2 years"
          value={experience}
          onChange={(e) =>
            setExperience(e.target.value)
          }
        />

        {/* Skills */}
        <label htmlFor="skills">
          Skills
        </label>

        <input
          id="skills"
          type="text"
          placeholder="Example: React, JavaScript, HTML, CSS"
          value={skills}
          onChange={(e) =>
            setSkills(e.target.value)
          }
        />

        {/* Number of Questions */}
        <label htmlFor="numberOfQuestions">
          Number of Questions
        </label>

        <input
          id="numberOfQuestions"
          type="number"
          min="1"
          max="10"
          placeholder="Example: 5"
          value={numberOfQuestions}
          onChange={(e) =>
            setNumberOfQuestions(e.target.value)
          }
        />

        <small>
          You can generate 1 to 10 questions.
        </small>

        {/* Generate Button */}
        <button
          onClick={generateQuestions}
          disabled={loading}
        >
          {loading
            ? "Generating Questions..."
            : "Generate Questions"}
        </button>

      </div>

      {/* Error */}
      {error && (
        <div className="error">
          {error}
        </div>
      )}

      {/* Questions */}
      <div className="questions-container">

        {questions.length > 0 && (
          <h2>
            Interview Questions
          </h2>
        )}

        {questions.map((item, index) => (
          <div
            className="question-card"
            key={index}
          >

            <h3>
              {index + 1}. {item.question}
            </h3>

            <span className="difficulty">
              {item.difficulty}
            </span>

            <h4>
              Answer
            </h4>

            <p>
              {item.answer}
            </p>

            <h4>
              Explanation
            </h4>

            <p>
              {item.explanation}
            </p>

          </div>
        ))}

      </div>

    </div>
  );
}

export default App;