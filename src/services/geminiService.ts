import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface AuditResult {
  score: number;
  issues: {
    title: string;
    description: string;
    impact: 'high' | 'medium' | 'low';
  }[];
  positives: string[];
}

export async function performAudit(url: string, htmlContent: string): Promise<AuditResult> {
  const prompt = `
    Analyze the following HTML content from the website: ${url}.
    Your task is to evaluate its "AI Readiness" - how well-optimized it is for LLMs, AI search engines (like Perplexity or Google Search Generative Experience), and AI agents to understand and crawl.

    Consider:
    - Semantic HTML structure.
    - Meta tags (OpenGraph, Twitter, Schema.org/JSON-LD).
    - Content clarity and hierarchy (headings).
    - Presence of structured data (e.g., FAQs, Products, Reviews).
    - Accessibility features that aid machine reading.
    - Robots.txt and sitemap indications (if visible in HTML).

    Return a JSON response with:
    1. A score from 0 to 100.
    2. A list of 4-5 issues found. Each issue should have a title, a brief description, and an impact level (high, medium, low).
    3. A few positive aspects (2-3 items).

    HTML content snippet:
    ${htmlContent}
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["score", "issues", "positives"],
          properties: {
            score: { type: Type.NUMBER },
            issues: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ["title", "description", "impact"],
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  impact: { type: Type.STRING, enum: ["high", "medium", "low"] }
                }
              }
            },
            positives: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          }
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Audit error:", error);
    throw new Error("Failed to analyze the website. Please try again.");
  }
}
