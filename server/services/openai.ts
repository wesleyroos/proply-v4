import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

interface SuburbAnalysisResult {
  sentiment: {
    score: number;
    summary: string;
  };
  news: Array<{
    title: string;
    summary: string;
    relevance: number;
    sentiment: number;
    source?: string;
  }>;
  trends: {
    positive: string[];
    negative: string[];
  };
  overallScore: number;
}

export async function analyzeSuburb(suburb: string): Promise<SuburbAnalysisResult> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are a real estate market analysis expert. Analyze the provided suburb and generate insights about its market health, development trends, and overall desirability. Structure your response as JSON with the following format:
          {
            "sentiment": {
              "score": number (1-10),
              "summary": string (brief overview)
            },
            "news": [
              {
                "title": string,
                "summary": string,
                "relevance": number (1-10),
                "sentiment": number (-1 to 1),
                "source": string (optional)
              }
            ],
            "trends": {
              "positive": string[],
              "negative": string[]
            },
            "overallScore": number (1-10)
          }`
        },
        {
          role: "user",
          content: `Analyze the current market conditions, news, and trends for the suburb: ${suburb}. Consider factors like property development, infrastructure projects, crime rates, and community developments.`
        }
      ],
      response_format: { type: "json_object" }
    });

    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    console.error('OpenAI API Error:', error);
    throw new Error('Failed to analyze suburb data');
  }
}
