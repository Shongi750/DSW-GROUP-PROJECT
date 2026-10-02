
const { OpenAI } = require("openai");

admin.initializeApp();

// Replace with your actual key for the demo
// Replace with your actual key for the demo
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

exports.generateWorkoutPlan = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Must be logged in.");
  }

  const userId = context.auth.uid;

  try {
    const userDoc = await admin.firestore().collection("users").doc(userId).get();
    const fitnessProfile = userDoc.data()?.fitnessProfile || { goal: "General Fitness" };

    const workoutSchema = {
      type: "object",
      properties: {
        id: { type: "string" },
        category: { type: "string" },
        title: { type: "string" },
        duration: { type: "string" },
        level: { type: "string" },
        exercises: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "string" },
              category: { type: "string" },
              name: { type: "string" },
              description: { type: "string" },
              sets: { type: "number" },
              reps: { type: "string" },
              rest: { type: "string" }
            },
            required: ["id", "category", "name", "description", "sets", "reps", "rest"]
          }
        }
      },
      required: ["id", "category", "title", "duration", "level", "exercises"],
      additionalProperties: false
    };

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an elite fitness coach. Generate a highly specific workout plan based strictly on the provided user profile. Do not include markdown."
        },
        {
          role: "user",
          content: `Generate a single workout session for this profile: ${JSON.stringify(fitnessProfile)}`
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "workout_plan",
          schema: workoutSchema,
          strict: true
        }
      }
    });

    return JSON.parse(completion.choices[0].message.content);

  } catch (error) {
    console.error("AI Error:", error);
    throw new functions.https.HttpsError("internal", "Failed to generate workout.");
  }
});