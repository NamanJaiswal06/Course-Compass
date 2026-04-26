import axios from "axios";

// POST /api/recommendations
// Body: { topic: string, level: string }
export const getRecommendations = async (req, res) => {
  const { topic, level } = req.body;

  if (!topic || !level) {
    return res.status(400).json({ message: "topic and level are required" });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  // If no real API key provided, return mock recommendations
  if (!apiKey || apiKey === "your_dummy_key_here") {
    return res.json({
      recommendations: getMockRecommendations(topic, level),
      source: "mock"
    });
  }

  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        contents: [
          {
            parts: [
              {
                text: `Suggest 5 online courses for someone interested in ${topic} at the ${level} level. For each course provide: title, description, and why it's a good match. Return as JSON array with fields: title, description, matchReason.`
              }
            ]
          }
        ],
        generationConfig: {
          responseMimeType: "application/json"
        }
      }
    );

    const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = text;
    }

    res.json({ recommendations: parsed, source: "gemini" });
  } catch (err) {
    // Fallback to mock if Gemini fails
    console.error("Gemini API error:", err.response?.data || err.message);
    res.json({
      recommendations: getMockRecommendations(topic, level),
      source: "mock"
    });
  }
};

// Mock recommendations for development/demo
function getMockRecommendations(topic, level) {
  return [
    {
      title: `Introduction to ${topic}`,
      description: `A comprehensive ${level}-level course covering all fundamentals of ${topic}.`,
      matchReason: `Perfect for ${level} learners looking to get started with ${topic}.`
    },
    {
      title: `${topic} in Practice`,
      description: `Hands-on projects and real-world applications of ${topic} concepts.`,
      matchReason: `Great for building practical skills at the ${level} level.`
    },
    {
      title: `Advanced ${topic} Techniques`,
      description: `Deep dive into advanced concepts and best practices in ${topic}.`,
      matchReason: `Ideal for ${level} learners ready to go beyond the basics.`
    }
  ];
}