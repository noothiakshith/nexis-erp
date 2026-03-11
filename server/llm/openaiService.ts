/**
 * OpenAI LLM Service
 * Handles all LLM-based operations using OpenAI API
 */

import axios from 'axios';

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class OpenAIService {
  private apiKey: string;
  private baseURL = 'https://api.openai.com/v1';

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY || '';
    if (!this.apiKey) {
      console.warn('⚠️  OPENAI_API_KEY not set. LLM features will use fallback responses.');
    }
  }

  /**
   * Generic chat completion
   */
  private async chatCompletion(
    messages: OpenAIMessage[],
    model: string = 'gpt-4-turbo-preview',
    temperature: number = 0.7,
    maxTokens: number = 1000
  ): Promise<string> {
    if (!this.apiKey) {
      return this.getFallbackResponse(messages);
    }

    try {
      const response = await axios.post<OpenAIResponse>(
        `${this.baseURL}/chat/completions`,
        {
          model,
          messages,
          temperature,
          max_tokens: maxTokens
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      return response.data.choices[0].message.content;
    } catch (error: any) {
      console.error('OpenAI API Error:', error.response?.data || error.message);
      return this.getFallbackResponse(messages);
    }
  }

  /**
   * Categorize expense using GPT-4
   */
  async categorizeExpense(description: string, amount: number): Promise<{
    category: string;
    subcategory: string;
    businessJustification: string;
    taxDeductible: 'yes' | 'no' | 'partial';
    tags: string[];
    confidence: number;
  }> {
    const prompt = `Analyze this business expense and categorize it:

Description: "${description}"
Amount: $${amount}

Provide a JSON response with:
1. category (Travel, Meals, Office Supplies, Software, Marketing, Utilities, etc.)
2. subcategory (more specific)
3. businessJustification (1-2 sentences explaining business purpose)
4. taxDeductible (yes/no/partial)
5. tags (array of 2-3 relevant tags)
6. confidence (0-100, how confident you are in this categorization)

Return ONLY valid JSON, no markdown or explanation.`;

    const messages: OpenAIMessage[] = [
      {
        role: 'system',
        content: 'You are an expert accountant specializing in business expense categorization and tax compliance.'
      },
      {
        role: 'user',
        content: prompt
      }
    ];

    const response = await this.chatCompletion(messages, 'gpt-4-turbo-preview', 0.3, 500);

    try {
      // Extract JSON from response (handle markdown code blocks)
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[0] : response;
      return JSON.parse(jsonStr);
    } catch (error) {
      // Fallback categorization
      return this.fallbackCategorizeExpense(description, amount);
    }
  }

  /**
   * Generate financial report executive summary
   */
  async generateExecutiveSummary(financialData: {
    revenue: number;
    expenses: number;
    profit: number;
    profitMargin: number;
    growth: number;
    period: string;
  }): Promise<string> {
    const prompt = `Generate a professional executive summary for this financial performance:

Period: ${financialData.period}
Revenue: $${financialData.revenue.toLocaleString()}
Expenses: $${financialData.expenses.toLocaleString()}
Net Profit: $${financialData.profit.toLocaleString()}
Profit Margin: ${financialData.profitMargin}%
YoY Growth: ${financialData.growth}%

Write a concise 3-paragraph executive summary that:
1. Highlights key financial metrics and overall performance
2. Identifies notable trends and insights
3. Provides actionable recommendations

Use professional business language. Be specific with numbers.`;

    const messages: OpenAIMessage[] = [
      {
        role: 'system',
        content: 'You are a CFO writing executive summaries for board presentations. Be concise, data-driven, and actionable.'
      },
      {
        role: 'user',
        content: prompt
      }
    ];

    return await this.chatCompletion(messages, 'gpt-4-turbo-preview', 0.7, 800);
  }

  /**
   * Explain invoice anomaly in human-readable terms
   */
  async explainInvoiceAnomaly(
    invoiceData: {
      invoiceNumber: string;
      amount: number;
      customer: string;
      dueDate: Date;
    },
    anomalyScore: number,
    anomalyFactors: string[]
  ): Promise<string> {
    const prompt = `Explain why this invoice has been flagged as potentially anomalous:

Invoice: ${invoiceData.invoiceNumber}
Customer: ${invoiceData.customer}
Amount: $${invoiceData.amount.toLocaleString()}
Due Date: ${invoiceData.dueDate.toLocaleDateString()}

Anomaly Score: ${anomalyScore}/100
Detected Issues:
${anomalyFactors.map(f => `- ${f}`).join('\n')}

Provide a clear, non-technical explanation of:
1. Why this invoice was flagged
2. What specific patterns are unusual
3. Recommended actions to verify or resolve

Keep it under 150 words and actionable.`;

    const messages: OpenAIMessage[] = [
      {
        role: 'system',
        content: 'You are a financial analyst explaining anomaly detection results to non-technical business users.'
      },
      {
        role: 'user',
        content: prompt
      }
    ];

    return await this.chatCompletion(messages, 'gpt-4-turbo-preview', 0.5, 400);
  }

  /**
   * Generate scenario planning narrative
   */
  async generateScenarioNarrative(
    scenarioName: string,
    parameters: Record<string, any>,
    results: {
      revenue: number;
      expenses: number;
      profit: number;
      cashFlow: number;
    }
  ): Promise<string> {
    const prompt = `Create a compelling narrative for this financial scenario:

Scenario: ${scenarioName}
Parameters: ${JSON.stringify(parameters, null, 2)}

Projected Results:
- Revenue: $${results.revenue.toLocaleString()}
- Expenses: $${results.expenses.toLocaleString()}
- Net Profit: $${results.profit.toLocaleString()}
- Cash Flow: $${results.cashFlow.toLocaleString()}

Write a 2-paragraph narrative that:
1. Describes what this scenario represents and key assumptions
2. Explains the financial implications and strategic considerations

Be specific and business-focused.`;

    const messages: OpenAIMessage[] = [
      {
        role: 'system',
        content: 'You are a financial strategist creating scenario planning narratives for executive decision-making.'
      },
      {
        role: 'user',
        content: prompt
      }
    ];

    return await this.chatCompletion(messages, 'gpt-4-turbo-preview', 0.7, 600);
  }

  /**
   * Generate email draft for CRM
   */
  async generateEmailDraft(context: {
    recipientName: string;
    companyName: string;
    purpose: 'follow-up' | 'introduction' | 'proposal' | 'thank-you';
    details: string;
    tone: 'formal' | 'casual' | 'friendly';
  }): Promise<string> {
    const prompt = `Write a professional business email:

To: ${context.recipientName} at ${context.companyName}
Purpose: ${context.purpose}
Tone: ${context.tone}
Context: ${context.details}

Write a complete email with:
- Appropriate subject line
- Professional greeting
- Clear body (2-3 paragraphs)
- Call to action
- Professional closing

Format as:
Subject: [subject line]

[email body]`;

    const messages: OpenAIMessage[] = [
      {
        role: 'system',
        content: 'You are a professional business development representative writing effective sales and relationship emails.'
      },
      {
        role: 'user',
        content: prompt
      }
    ];

    return await this.chatCompletion(messages, 'gpt-4-turbo-preview', 0.8, 600);
  }

  /**
   * Summarize meeting notes
   */
  async summarizeMeetingNotes(rawNotes: string): Promise<{
    summary: string;
    keyPoints: string[];
    actionItems: Array<{ task: string; owner?: string; deadline?: string }>;
    decisions: string[];
  }> {
    const prompt = `Analyze these meeting notes and extract structured information:

${rawNotes}

Provide a JSON response with:
1. summary (2-3 sentence overview)
2. keyPoints (array of 3-5 main discussion points)
3. actionItems (array of objects with task, owner, deadline if mentioned)
4. decisions (array of key decisions made)

Return ONLY valid JSON.`;

    const messages: OpenAIMessage[] = [
      {
        role: 'system',
        content: 'You are an executive assistant expert at summarizing meeting notes and extracting action items.'
      },
      {
        role: 'user',
        content: prompt
      }
    ];

    const response = await this.chatCompletion(messages, 'gpt-4-turbo-preview', 0.3, 800);

    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[0] : response;
      return JSON.parse(jsonStr);
    } catch (error) {
      return {
        summary: 'Meeting summary unavailable',
        keyPoints: ['Unable to parse meeting notes'],
        actionItems: [],
        decisions: []
      };
    }
  }

  /**
   * Analyze customer sentiment
   */
  async analyzeSentiment(text: string): Promise<{
    sentiment: 'positive' | 'neutral' | 'negative';
    score: number; // -1 to 1
    emotions: string[];
    summary: string;
  }> {
    const prompt = `Analyze the sentiment and emotions in this customer communication:

"${text}"

Provide a JSON response with:
1. sentiment (positive/neutral/negative)
2. score (number from -1 to 1, where -1 is very negative, 0 is neutral, 1 is very positive)
3. emotions (array of detected emotions like frustrated, excited, concerned, satisfied)
4. summary (1 sentence explaining the overall sentiment)

Return ONLY valid JSON.`;

    const messages: OpenAIMessage[] = [
      {
        role: 'system',
        content: 'You are an expert in sentiment analysis and emotional intelligence in business communications.'
      },
      {
        role: 'user',
        content: prompt
      }
    ];

    const response = await this.chatCompletion(messages, 'gpt-4-turbo-preview', 0.3, 400);

    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[0] : response;
      return JSON.parse(jsonStr);
    } catch (error) {
      return {
        sentiment: 'neutral',
        score: 0,
        emotions: ['unknown'],
        summary: 'Unable to analyze sentiment'
      };
    }
  }

  /**
   * Chat assistant for general queries
   */
  async chatAssistant(
    userMessage: string,
    conversationHistory: OpenAIMessage[] = []
  ): Promise<string> {
    const messages: OpenAIMessage[] = [
      {
        role: 'system',
        content: `You are a helpful ERP system assistant. You help users with:
- Financial queries and analysis
- CRM and sales information
- Inventory management
- Project tracking
- HR information

Be concise, professional, and actionable. If you need specific data, ask for it.`
      },
      ...conversationHistory,
      {
        role: 'user',
        content: userMessage
      }
    ];

    return await this.chatCompletion(messages, 'gpt-4-turbo-preview', 0.7, 500);
  }

  /**
   * Fallback responses when API key is not available
   */
  private getFallbackResponse(messages: OpenAIMessage[]): string {
    const userMessage = messages[messages.length - 1].content.toLowerCase();
    
    if (userMessage.includes('expense') || userMessage.includes('categorize')) {
      return 'OpenAI API key not configured. Using rule-based categorization.';
    } else if (userMessage.includes('summary') || userMessage.includes('report')) {
      return 'Financial performance shows steady growth with healthy profit margins. Continue monitoring key metrics and optimizing operational efficiency.';
    } else if (userMessage.includes('email')) {
      return 'Subject: Following Up\n\nDear [Name],\n\nI wanted to follow up on our recent conversation. Please let me know if you have any questions.\n\nBest regards';
    } else {
      return 'OpenAI API key not configured. Please set OPENAI_API_KEY environment variable to enable LLM features.';
    }
  }

  /**
   * Fallback expense categorization
   */
  private fallbackCategorizeExpense(description: string, amount: number): {
    category: string;
    subcategory: string;
    businessJustification: string;
    taxDeductible: 'yes' | 'no' | 'partial';
    tags: string[];
    confidence: number;
  } {
    const desc = description.toLowerCase();
    
    // Simple rule-based categorization
    let category = 'General';
    let subcategory = 'Miscellaneous';
    let tags: string[] = [];
    
    if (desc.includes('travel') || desc.includes('flight') || desc.includes('hotel')) {
      category = 'Travel';
      subcategory = 'Transportation';
      tags = ['travel', 'business-trip'];
    } else if (desc.includes('lunch') || desc.includes('dinner') || desc.includes('meal') || desc.includes('restaurant')) {
      category = 'Meals & Entertainment';
      subcategory = 'Client Meals';
      tags = ['meals', 'client'];
    } else if (desc.includes('software') || desc.includes('subscription') || desc.includes('saas')) {
      category = 'Software';
      subcategory = 'Subscriptions';
      tags = ['software', 'subscription'];
    } else if (desc.includes('office') || desc.includes('supplies')) {
      category = 'Office Supplies';
      subcategory = 'General Supplies';
      tags = ['office', 'supplies'];
    }

    return {
      category,
      subcategory,
      businessJustification: `Business expense for ${category.toLowerCase()} purposes.`,
      taxDeductible: 'yes',
      tags,
      confidence: 60
    };
  }
}

export const openaiService = new OpenAIService();
