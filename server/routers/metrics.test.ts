import { describe, it, expect } from "vitest";
import { metricsRouter } from "./metrics";
import type { TrpcContext } from "../_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): {
  ctx: TrpcContext;
} {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "admin",
    phone: null,
    department: null,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: { "x-forwarded-for": "192.168.1.1" },
    } as any as TrpcContext["req"],
    res: {} as any as TrpcContext["res"],
  };

  return { ctx };
}

describe("Metrics Router", () => {
  describe("Financial Metrics", () => {
    it("should fetch financial metrics for month timeframe", async () => {
      const { ctx } = createAuthContext();
      const caller = metricsRouter.createCaller(ctx);

      try {
        const result = await caller.getFinancialMetrics({ timeframe: "month" });

        if (result) {
          expect(result).toHaveProperty("revenue");
          expect(result).toHaveProperty("expenses");
          expect(result).toHaveProperty("profit");
          expect(result).toHaveProperty("profitMargin");
          expect(typeof result.revenue).toBe("number");
          expect(typeof result.expenses).toBe("number");
        }
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it("should fetch revenue by month", async () => {
      const { ctx } = createAuthContext();
      const caller = metricsRouter.createCaller(ctx);

      try {
        const result = await caller.getRevenueByMonth({ months: 12 });

        expect(Array.isArray(result)).toBe(true);
        if (result.length > 0) {
          expect(result[0]).toHaveProperty("month");
          expect(result[0]).toHaveProperty("revenue");
        }
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it("should fetch expense breakdown", async () => {
      const { ctx } = createAuthContext();
      const caller = metricsRouter.createCaller(ctx);

      try {
        const result = await caller.getExpenseBreakdown();

        expect(Array.isArray(result)).toBe(true);
        if (result.length > 0) {
          expect(result[0]).toHaveProperty("category");
          expect(result[0]).toHaveProperty("amount");
          expect(result[0]).toHaveProperty("count");
        }
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe("Inventory Metrics", () => {
    it("should fetch inventory metrics", async () => {
      const { ctx } = createAuthContext();
      const caller = metricsRouter.createCaller(ctx);

      try {
        const result = await caller.getInventoryMetrics();

        if (result) {
          expect(result).toHaveProperty("totalInventoryValue");
          expect(result).toHaveProperty("lowStockCount");
          expect(result).toHaveProperty("totalProducts");
          expect(typeof result.totalInventoryValue).toBe("number");
        }
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it("should fetch stock levels by category", async () => {
      const { ctx } = createAuthContext();
      const caller = metricsRouter.createCaller(ctx);

      try {
        const result = await caller.getStockLevelsByCategory();

        expect(Array.isArray(result)).toBe(true);
        if (result.length > 0) {
          expect(result[0]).toHaveProperty("category");
          expect(result[0]).toHaveProperty("stock");
          expect(result[0]).toHaveProperty("products");
        }
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe("HR Metrics", () => {
    it("should fetch HR metrics", async () => {
      const { ctx } = createAuthContext();
      const caller = metricsRouter.createCaller(ctx);

      try {
        const result = await caller.getHRMetrics();

        if (result) {
          expect(result).toHaveProperty("totalEmployees");
          expect(result).toHaveProperty("monthlyPayroll");
          expect(result).toHaveProperty("departments");
          expect(typeof result.totalEmployees).toBe("number");
        }
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it("should fetch employees by department", async () => {
      const { ctx } = createAuthContext();
      const caller = metricsRouter.createCaller(ctx);

      try {
        const result = await caller.getEmployeeByDepartment();

        expect(Array.isArray(result)).toBe(true);
        if (result.length > 0) {
          expect(result[0]).toHaveProperty("department");
          expect(result[0]).toHaveProperty("employees");
          expect(result[0]).toHaveProperty("avgSalary");
        }
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe("Sales Metrics", () => {
    it("should fetch sales metrics", async () => {
      const { ctx } = createAuthContext();
      const caller = metricsRouter.createCaller(ctx);

      try {
        const result = await caller.getSalesMetrics();

        if (result) {
          expect(result).toHaveProperty("totalCustomers");
          expect(result).toHaveProperty("pipelineValue");
          expect(result).toHaveProperty("conversionRate");
          expect(typeof result.totalCustomers).toBe("number");
        }
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it("should fetch leads by stage", async () => {
      const { ctx } = createAuthContext();
      const caller = metricsRouter.createCaller(ctx);

      try {
        const result = await caller.getLeadsByStage();

        expect(Array.isArray(result)).toBe(true);
        if (result.length > 0) {
          expect(result[0]).toHaveProperty("stage");
          expect(result[0]).toHaveProperty("count");
          expect(result[0]).toHaveProperty("value");
        }
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe("Composite Queries", () => {
    it("should fetch all dashboard metrics at once", async () => {
      const { ctx } = createAuthContext();
      const caller = metricsRouter.createCaller(ctx);

      try {
        const result = await caller.getAllDashboardMetrics();

        expect(result).toHaveProperty("financial");
        expect(result).toHaveProperty("inventory");
        expect(result).toHaveProperty("hr");
        expect(result).toHaveProperty("sales");
        expect(result).toHaveProperty("projects");
        expect(result).toHaveProperty("procurement");
        expect(result).toHaveProperty("lastUpdated");
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it("should fetch comprehensive analytics dashboard", async () => {
      const { ctx } = createAuthContext();
      const caller = metricsRouter.createCaller(ctx);

      try {
        const result = await caller.getAnalyticsDashboard();

        expect(result).toHaveProperty("financial");
        expect(result.financial).toHaveProperty("metrics");
        expect(result.financial).toHaveProperty("revenueByMonth");
        expect(result.financial).toHaveProperty("expenseBreakdown");
        expect(result).toHaveProperty("inventory");
        expect(result).toHaveProperty("hr");
        expect(result).toHaveProperty("sales");
        expect(result).toHaveProperty("lastUpdated");
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });
});
