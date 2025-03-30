import OpenAI from "openai";

// Initialize the OpenAI client directly
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY,
  dangerouslyAllowBrowser: false
});

// Analysis Categories with weights
const ANALYSIS_CATEGORIES = [
  {
    name: "Infrastructure Development",
    weight: 0.25,
    keywords: ["development", "construction", "infrastructure", "upgrade", "renovation"]
  },
  {
    name: "Safety and Security",
    weight: 0.2,
    keywords: ["crime", "security", "police", "safety", "surveillance"]
  },
  {
    name: "Economic Factors",
    weight: 0.25,
    keywords: ["business", "investment", "economy", "growth", "employment"]
  },
  {
    name: "Amenities and Services",
    weight: 0.15,
    keywords: ["school", "shopping", "restaurant", "healthcare", "transport"]
  },
  {
    name: "Property Market",
    weight: 0.15,
    keywords: ["property", "house price", "rental", "real estate", "market value"]
  }
];

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
  categoryScores: Array<{
    category: string;
    score: number;
    confidence: number;
  }>;
  confidenceLevel: number;
  dataPoints: number;
  rawDataPoints: Array<{
    source: string;
    type: string;
    content: string;
    date?: string;
  }>;
}

// Interface for suburb sentiment data used in Deal Score
export interface SuburbSentimentResult {
  description: string;
  investmentPotential: string; // HIGH, MEDIUM, LOW
  developmentActivity: string; // ACTIVE, MODERATE, MINIMAL
  trend: string; // "Trending Up", "Stable", "Trending Down"
}

// Simplified version focused on sentiment for Deal Score
export async function getSuburbSentiment(suburb: string): Promise<SuburbSentimentResult> {
  try {
    // Create a new OpenAI instance directly in this function
    const client = new OpenAI({ 
      apiKey: process.env.OPENAI_API_KEY,
      dangerouslyAllowBrowser: false 
    });

    console.log(`Processing suburb sentiment for "${suburb}"`);

    const response = await client.chat.completions.create({
      model: "gpt-4",
      temperature: 0.3,
      messages: [
        {
          role: "system",
          content: `You are a property market analysis expert. Provide a concise assessment of the given suburb, focusing on investment potential.

Your response must be formatted as a strict JSON object with these fields:
- description: A 2-3 sentence description of the suburb focusing on its character and investment outlook
- investmentPotential: A single value of "HIGH", "MEDIUM", or "LOW"
- developmentActivity: A single value of "ACTIVE", "MODERATE", or "MINIMAL"
- trend: A single value of "Trending Up", "Stable", or "Trending Down"`
        },
        {
          role: "user",
          content: `Analyze the investment outlook for the suburb: ${suburb}.`
        }
      ],
      response_format: { type: "json_object" }
    });

    const content = response.choices[0]?.message?.content || '';
    console.log(`OpenAI API raw response: ${content.substring(0, 50)}...`);

    if (!content) {
      throw new Error('OpenAI API returned empty response');
    }

    const result = JSON.parse(content) as SuburbSentimentResult;
    return result;
  } catch (error) {
    console.error('OpenAI API Error:', error);

    // Return a fallback with clear indication of error
    return {
      description: `Unable to retrieve data for ${suburb} at this time.`,
      investmentPotential: "MEDIUM",
      developmentActivity: "MODERATE",
      trend: "Stable"
    };
  }
}

export async function analyzeSuburb(suburb: string): Promise<SuburbAnalysisResult> {
  try {
    // Create a new OpenAI instance directly in this function
    const client = new OpenAI({ 
      apiKey: process.env.OPENAI_API_KEY,
      dangerouslyAllowBrowser: false 
    });

    console.log(`Processing detailed suburb analysis for "${suburb}"`);

    const response = await client.chat.completions.create({
      model: "gpt-4",
      temperature: 0.3,
      messages: [
        {
          role: "system",
          content: `You are a real estate market analysis expert. Analyze the provided suburb and generate detailed insights about its market health, development trends, and overall desirability. Consider the following categories:

${ANALYSIS_CATEGORIES.map(cat => `- ${cat.name} (${cat.weight * 100}% weight): Focus on ${cat.keywords.join(', ')}`).join('\n')}

All raw data points used in the analysis must be included in the rawDataPoints array of the response. The dataPoints count should match exactly with the number of items in the rawDataPoints array.

Structure your response as JSON with this exact format:
{
  "sentiment": {
    "score": number (1-10),
    "summary": string (concise market overview)
  },
  "news": [
    {
      "title": string (headline),
      "summary": string (2-3 sentences),
      "relevance": number (1-10),
      "sentiment": number (-1 to 1),
      "source": string (URL if available)
    }
  ],
  "trends": {
    "positive": string[] (3-5 key positive trends),
    "negative": string[] (3-5 key concerns)
  },
  "categoryScores": [
    {
      "category": string (category name),
      "score": number (1-10),
      "confidence": number (0-1)
    }
  ],
  "overallScore": number (1-10),
  "confidenceLevel": number (0-1),
  "dataPoints": number (must match the length of rawDataPoints array),
  "rawDataPoints": [
    {
      "source": string (name of source),
      "type": string (news/development/statistic),
      "content": string (relevant excerpt or data point),
      "date": string (ISO date if available)
    }
  ]
}`
        },
        {
          role: "user",
          content: `Analyze the current market conditions, news, and trends for the suburb: ${suburb}. Include ALL data points used in the analysis in the rawDataPoints array.`
        }
      ],
      response_format: { type: "json_object" }
    });

    const content = response.choices[0]?.message?.content || '';

    if (!content) {
      throw new Error('OpenAI API returned empty response');
    }

    const result = JSON.parse(content) as SuburbAnalysisResult;

    // Validate that dataPoints matches rawDataPoints length
    if (result.dataPoints !== result.rawDataPoints.length) {
      console.warn(`Warning: dataPoints count (${result.dataPoints}) does not match rawDataPoints length (${result.rawDataPoints.length})`);
      result.dataPoints = result.rawDataPoints.length;
    }

    return result;
  } catch (error) {
    console.error('OpenAI API Error:', error);
    throw new Error('Failed to analyze suburb data');
  }
}