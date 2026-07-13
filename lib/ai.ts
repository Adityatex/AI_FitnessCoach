export async function generateAICall({
  systemPrompt,
  userContent,
  model,
}: {
  systemPrompt: string;
  userContent: string;
  model: "gemma-4-26b-a4b-it" | "gemma-4-31b-it";
}) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not defined in environment variables.");
  }

  // Map Gemma models from brief to Groq equivalents
  // Using the powerful gpt-oss-120b for high-quality instruction adherence
  const groqModel = "openai/gpt-oss-120b";

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: groqModel,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Groq API responded with status ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    const responseText = data.choices?.[0]?.message?.content;

    if (!responseText) {
      throw new Error("Groq returned an empty response content.");
    }

    console.log("--- RAW GROQ RESPONSE START ---");
    console.log(responseText);
    console.log("--- RAW GROQ RESPONSE END ---");

    return JSON.parse(responseText);
  } catch (error) {
    console.error("Groq AI execution failed:", error);
    throw error;
  }
}
