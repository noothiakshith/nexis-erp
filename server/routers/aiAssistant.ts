import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { invokeLLM } from "../_core/llm";
import {
  getDb,
  getInvoicesByUser,
  getExpensesByUser,
  getProductsByStatus,
  getLowStockProducts,
  getCustomersByType,
  getLeadsByStatus,
  getProjectsByManager,
  getAnalyticsDataByModule,
  getAnomaliesByModule,
} from "../db";

/**
 * AI Assistant Router - Provides conversational interface for ERP queries
 * Uses LLM to understand natural language and generate insights
 */
export const aiAssistantRouter = router({
  /**
   * Chat endpoint for conversational queries
   * Supports multi-turn conversations with context awareness
   */
  chat: protectedProcedure
    .input(
      z.object({
        message: z.string(),
        context: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      try {
        // Gather relevant data based on user's role and message
        const userContext = await gatherUserContext(ctx.user.id);

        // Create system prompt with user context
        const systemPrompt = buildSystemPrompt(ctx.user.role, userContext);

        // Call LLM with conversation
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: systemPrompt,
            },
            {
              role: "user",
              content: input.message,
            },
          ],
        });

        const assistantMessage =
          response.choices[0]?.message?.content || "Unable to process request";

        return {
          success: true,
          message: assistantMessage,
          timestamp: new Date(),
        };
      } catch (error) {
        console.error("AI Assistant Error:", error);
        return {
          success: false,
          message:
            "I encountered an error processing your request. Please try again.",
          timestamp: new Date(),
        };
      }
    }),

  /**
   * Generate insights based on module data
   * Uses LLM to analyze data and provide actionable recommendations
   */
  generateInsights: protectedProcedure
    .input(
      z.object({
        module: z.enum([
          "finance",
          "hr",
          "inventory",
          "crm",
          "projects",
          "procurement",
        ]),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        // Gather module-specific data
        let moduleData: Record<string, any> = {};

        switch (input.module) {
          case "finance":
            moduleData = {
              invoices: await getInvoicesByUser(ctx.user.id),
              expenses: await getExpensesByUser(ctx.user.id),
            };
            break;
          case "inventory":
            moduleData = {
              lowStock: await getLowStockProducts(),
              products: await getProductsByStatus("active"),
            };
            break;
          case "crm":
            moduleData = {
              customers: await getCustomersByType("customer"),
              leads: await getLeadsByStatus("new"),
            };
            break;
          case "projects":
            moduleData = {
              projects: await getProjectsByManager(ctx.user.id),
            };
            break;
          default:
            moduleData = await getAnalyticsDataByModule(input.module);
        }

        // Generate insights using LLM
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `You are a business intelligence analyst. Analyze the provided ${input.module} data and provide 3-5 actionable insights and recommendations. Be concise and specific.`,
            },
            {
              role: "user",
              content: `Please analyze this ${input.module} data and provide insights:\n${JSON.stringify(moduleData, null, 2)}`,
            },
          ],
        });

        const insights =
          response.choices[0]?.message?.content ||
          "Unable to generate insights";

        return {
          success: true,
          module: input.module,
          insights,
          generatedAt: new Date(),
        };
      } catch (error) {
        console.error("Insights Generation Error:", error);
        return {
          success: false,
          module: input.module,
          insights: "Unable to generate insights at this time",
          generatedAt: new Date(),
        };
      }
    }),

  /**
   * Analyze anomalies detected in system
   * Uses LLM to interpret anomalies and suggest actions
   */
  analyzeAnomalies: protectedProcedure
    .input(
      z.object({
        module: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      try {
        const module = input.module || "inventory";
        const anomalies = await getAnomaliesByModule(module);

        if (!anomalies || anomalies.length === 0) {
          return {
            success: true,
            anomalies: [],
            analysis:
              "No anomalies detected. Your systems are operating normally.",
          };
        }

        // Analyze anomalies with LLM
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content:
                "You are a system analyst. Analyze the detected anomalies and provide severity assessment, root cause analysis, and recommended actions.",
            },
            {
              role: "user",
              content: `Analyze these anomalies:\n${JSON.stringify(anomalies, null, 2)}`,
            },
          ],
        });

        const analysis =
          response.choices[0]?.message?.content ||
          "Unable to analyze anomalies";

        return {
          success: true,
          anomalies,
          analysis,
          analyzedAt: new Date(),
        };
      } catch (error) {
        console.error("Anomaly Analysis Error:", error);
        return {
          success: false,
          anomalies: [],
          analysis: "Unable to analyze anomalies at this time",
        };
      }
    }),

  /**
   * Generate predictive recommendations
   * Uses LLM to forecast trends and suggest preventive actions
   */
  getPredictions: protectedProcedure
    .input(
      z.object({
        category: z.enum([
          "demand",
          "maintenance",
          "cash_flow",
          "inventory",
          "sales",
        ]),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        // Gather historical data for predictions
        let historicalData: Record<string, any> = {};

        switch (input.category) {
          case "demand":
            historicalData = {
              leads: await getLeadsByStatus("qualified"),
              customers: await getCustomersByType("customer"),
            };
            break;
          case "inventory":
            historicalData = {
              lowStock: await getLowStockProducts(),
              products: await getProductsByStatus("active"),
            };
            break;
          case "cash_flow":
            historicalData = {
              invoices: await getInvoicesByUser(ctx.user.id),
              expenses: await getExpensesByUser(ctx.user.id),
            };
            break;
          default:
            historicalData = await getAnalyticsDataByModule(input.category);
        }

        // Generate predictions
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `You are a predictive analytics expert. Based on the provided data, forecast ${input.category} trends for the next 30, 60, and 90 days. Provide confidence levels and recommended actions.`,
            },
            {
              role: "user",
              content: `Generate ${input.category} predictions based on this data:\n${JSON.stringify(historicalData, null, 2)}`,
            },
          ],
        });

        const predictions =
          response.choices[0]?.message?.content ||
          "Unable to generate predictions";

        return {
          success: true,
          category: input.category,
          predictions,
          generatedAt: new Date(),
        };
      } catch (error) {
        console.error("Prediction Error:", error);
        return {
          success: false,
          category: input.category,
          predictions: "Unable to generate predictions at this time",
        };
      }
    }),
});

/**
 * Helper function to build system prompt based on user role and context
 */
function buildSystemPrompt(
  userRole: string,
  userContext: Record<string, any>
): string {
  const basePrompt = `You are an intelligent ERP assistant helping a ${userRole} user manage their business operations. 
You have access to real-time data and should provide actionable, specific recommendations based on the user's role and responsibilities.
Be professional, concise, and data-driven in your responses.`;

  const roleSpecificGuidance = {
    admin: "As an admin, focus on system-wide insights, compliance, and strategic recommendations.",
    manager: "As a manager, focus on team performance, resource allocation, and operational efficiency.",
    employee:
      "As an employee, focus on your tasks, deadlines, and personal productivity.",
    system_admin:
      "As a system admin, focus on system health, security, and infrastructure.",
  };

  const guidance = roleSpecificGuidance[userRole as keyof typeof roleSpecificGuidance] || roleSpecificGuidance.employee;

  return `${basePrompt}\n\n${guidance}\n\nContext: ${JSON.stringify(userContext)}`;
}

/**
 * Helper function to gather user context for better AI responses
 */
async function gatherUserContext(userId: number): Promise<Record<string, any>> {
  try {
    return {
      recentInvoices: (await getInvoicesByUser(userId)).slice(0, 3),
      recentExpenses: (await getExpensesByUser(userId)).slice(0, 3),
      lowStockItems: (await getLowStockProducts()).slice(0, 3),
      timestamp: new Date(),
    };
  } catch (error) {
    console.error("Error gathering user context:", error);
    return { timestamp: new Date() };
  }
}
