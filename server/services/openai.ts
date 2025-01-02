import OpenAI from "openai";
import { type SelectAnalysisDataPoint } from "@db/schema";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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

export interface SuburbAnalysisResult {
  sentiment: {
    score: number;
    summary: string;
  };
  news: Array<{
    title: string;
    summary: string;
    relevance: number;
    sentiment: number;
    source: string;
    sourceUrl: string;
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
  dataPointsForStorage: Array<{
    type: string;
    source: {
      name: string;
      url: string;
      reliability: number;
    };
    title: string;
    content: string;
    date: string;
    sentiment: number;
    category: string;
    relevanceScore: number;
    impactScore: number;
    reasoning: string;
  }>;
}

export async function analyzeSuburb(
  suburb: string,
  recentDataPoints: SelectAnalysisDataPoint[] = []
): Promise<SuburbAnalysisResult> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a real estate market analysis expert. Analyze the provided suburb and generate detailed insights about its market health, development trends, and overall desirability. Consider these categories:

${ANALYSIS_CATEGORIES.map(cat => `- ${cat.name} (${cat.weight * 100}% weight): Focus on ${cat.keywords.join(', ')}`).join('\n')}

Your analysis should be comprehensive and include:
1. Recent news and developments
2. Market trends (both positive and negative)
3. Category-specific scores with confidence levels
4. Overall market sentiment

Structure your response as JSON with this exact format:
{
  "sentiment": {
    "score": number (1-10),
    "summary": string (concise market overview)
  },
  "news": [
    {
      "title": string,
      "summary": string (2-3 sentences),
      "relevance": number (1-10),
      "sentiment": number (-1 to 1),
      "source": string (publisher name),
      "sourceUrl": string (full URL to the article)
    }
  ],
  "trends": {
    "positive": string[] (3-5 key positive trends),
    "negative": string[] (3-5 key concerns)
  },
  "categoryScores": [
    {
      "category": string,
      "score": number (1-10),
      "confidence": number (0-1)
    }
  ],
  "overallScore": number (1-10),
  "confidenceLevel": number (0-1),
  "dataPoints": number,
  "dataPointsForStorage": [
    {
      "type": string (news|development|statistic|market_report),
      "source": {
        "name": string,
        "url": string (full URL),
        "reliability": number (0-1)
      },
      "title": string,
      "content": string,
      "date": string (ISO date),
      "sentiment": number (-1 to 1),
      "category": string,
      "relevanceScore": number (0-1),
      "impactScore": number (-1 to 1),
      "reasoning": string
    }
  ]
}`
        },
        {
          role: "user",
          content: `Analyze the current market conditions, news, and trends for the suburb: ${suburb}. 
${recentDataPoints.length > 0 ? `Consider these recent data points in your analysis:
${recentDataPoints.map(dp => `- ${dp.title}: ${dp.content} (${dp.category}, sentiment: ${dp.sentiment})`).join('\n')}` : ''}

Focus on:
1. Property values and market dynamics
2. Development projects and infrastructure
3. Safety and security trends
4. Community aspects and amenities
5. Economic indicators

Include actual news sources where possible and ensure all analysis is data-driven with clear confidence levels.`
        }
      ],
      response_format: { type: "json_object" }
    });

    if (!response.choices[0].message.content) {
      throw new Error('OpenAI API returned empty response');
    }

    const result = JSON.parse(response.choices[0].message.content) as SuburbAnalysisResult;
    return result;
  } catch (error) {
    console.error('OpenAI API Error:', error);
    throw new Error('Failed to analyze suburb data');
  }
}