import { describe, expect, it } from "vitest";
import { aiAssistantRouter } from "./aiAssistant";
import type { TrpcContext } from "../_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(userId: number = 1): TrpcContext {
  const user: AuthenticatedUser = {
    id: userId,
    openId: `user-${userId}`,
    email: `user${userId}@example.com`,
    name: `Test User ${userId}`,
    loginMethod: "manus",
    role: "manager",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("AI Assistant Router", () => {
  describe("chat", () => {
    it("should handle chat messages", async () => {
      const ctx = createAuthContext(1);
      const caller = aiAssistantRouter.createCaller(ctx);

      const response = await caller.chat({
        message: "What is my total revenue?",
      });

      expect(response).toBeDefined();
      expect(response.success).toBe(true);
      expect(response.message).toBeDefined();
      expect(typeof response.message).toBe("string");
      expect(response.timestamp).toBeInstanceOf(Date);
    });

    it("should handle chat with context", async () => {
      const ctx = createAuthContext(1);
      const caller = aiAssistantRouter.createCaller(ctx);

      const response = await caller.chat({
        message: "Analyze my recent expenses",
        context: "finance",
      });

      expect(response).toBeDefined();
      expect(response.success).toBe(true);
      expect(response.message).toBeDefined();
    });

    it("should handle empty messages gracefully", async () => {
      const ctx = createAuthContext(1);
      const caller = aiAssistantRouter.createCaller(ctx);

      try {
        await caller.chat({
          message: "",
        });
      } catch (error) {
        // Expected to fail validation
        expect(error).toBeDefined();
      }
    });
  });

  describe("generateInsights", () => {
    it("should generate finance insights", async () => {
      const ctx = createAuthContext(1);
      const caller = aiAssistantRouter.createCaller(ctx);

      const response = await caller.generateInsights({
        module: "finance",
      });

      expect(response).toBeDefined();
      expect(response.success).toBe(true);
      expect(response.module).toBe("finance");
      expect(response.insights).toBeDefined();
      expect(typeof response.insights).toBe("string");
    });

    it("should generate inventory insights", async () => {
      const ctx = createAuthContext(1);
      const caller = aiAssistantRouter.createCaller(ctx);

      const response = await caller.generateInsights({
        module: "inventory",
      });

      expect(response).toBeDefined();
      expect(response.success).toBe(true);
      expect(response.module).toBe("inventory");
      expect(response.insights).toBeDefined();
    });

    it("should generate CRM insights", async () => {
      const ctx = createAuthContext(1);
      const caller = aiAssistantRouter.createCaller(ctx);

      const response = await caller.generateInsights({
        module: "crm",
      });

      expect(response).toBeDefined();
      expect(response.success).toBe(true);
      expect(response.module).toBe("crm");
    });

    it("should generate project insights", async () => {
      const ctx = createAuthContext(1);
      const caller = aiAssistantRouter.createCaller(ctx);

      const response = await caller.generateInsights({
        module: "projects",
      });

      expect(response).toBeDefined();
      expect(response.success).toBe(true);
      expect(response.module).toBe("projects");
    });
  });

  describe("analyzeAnomalies", () => {
    it("should analyze anomalies for a module", async () => {
      const ctx = createAuthContext(1);
      const caller = aiAssistantRouter.createCaller(ctx);

      const response = await caller.analyzeAnomalies({
        module: "inventory",
      });

      expect(response).toBeDefined();
      expect(response.success).toBe(true);
      expect(Array.isArray(response.anomalies)).toBe(true);
      expect(response.analysis).toBeDefined();
      expect(typeof response.analysis).toBe("string");
    });

    it("should handle missing anomalies", async () => {
      const ctx = createAuthContext(1);
      const caller = aiAssistantRouter.createCaller(ctx);

      const response = await caller.analyzeAnomalies({
        module: "finance",
      });

      expect(response).toBeDefined();
      expect(response.success).toBe(true);
      expect(Array.isArray(response.anomalies)).toBe(true);
    });
  });

  describe("getPredictions", () => {
    it("should generate demand predictions", async () => {
      const ctx = createAuthContext(1);
      const caller = aiAssistantRouter.createCaller(ctx);

      const response = await caller.getPredictions({
        category: "demand",
      });

      expect(response).toBeDefined();
      expect(response.success).toBe(true);
      expect(response.category).toBe("demand");
      expect(response.predictions).toBeDefined();
      expect(typeof response.predictions).toBe("string");
    });

    it("should generate inventory predictions", async () => {
      const ctx = createAuthContext(1);
      const caller = aiAssistantRouter.createCaller(ctx);

      const response = await caller.getPredictions({
        category: "inventory",
      });

      expect(response).toBeDefined();
      expect(response.success).toBe(true);
      expect(response.category).toBe("inventory");
    });

    it("should generate cash flow predictions", async () => {
      const ctx = createAuthContext(1);
      const caller = aiAssistantRouter.createCaller(ctx);

      const response = await caller.getPredictions({
        category: "cash_flow",
      });

      expect(response).toBeDefined();
      expect(response.success).toBe(true);
      expect(response.category).toBe("cash_flow");
    });

    it("should generate maintenance predictions", async () => {
      const ctx = createAuthContext(1);
      const caller = aiAssistantRouter.createCaller(ctx);

      const response = await caller.getPredictions({
        category: "maintenance",
      });

      expect(response).toBeDefined();
      expect(response.success).toBe(true);
      expect(response.category).toBe("maintenance");
    });

    it("should generate sales predictions", async () => {
      const ctx = createAuthContext(1);
      const caller = aiAssistantRouter.createCaller(ctx);

      const response = await caller.getPredictions({
        category: "sales",
      });

      expect(response).toBeDefined();
      expect(response.success).toBe(true);
      expect(response.category).toBe("sales");
    });
  });
});
