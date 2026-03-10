import { describe, expect, it, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(userId: number = 1): TrpcContext {
  const user: AuthenticatedUser = {
    id: userId,
    openId: `user-${userId}`,
    email: `user${userId}@example.com`,
    name: `Test User ${userId}`,
    loginMethod: "manus",
    role: "user",
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

describe("ERP Routers", () => {
  describe("auth.me", () => {
    it("returns current user info", async () => {
      const ctx = createAuthContext(1);
      const caller = appRouter.createCaller(ctx);

      const user = await caller.auth.me();

      expect(user).toBeDefined();
      expect(user?.id).toBe(1);
      expect(user?.email).toBe("user1@example.com");
    });
  });

  describe("employee router", () => {
    it("getProfile returns employee data", async () => {
      const ctx = createAuthContext(1);
      const caller = appRouter.createCaller(ctx);

      // This will return undefined since we haven't created an employee
      const profile = await caller.employee.getProfile();

      expect(profile).toBeUndefined();
    });

    it("listAll returns active employees", async () => {
      const ctx = createAuthContext(1);
      const caller = appRouter.createCaller(ctx);

      const employees = await caller.employee.listAll();

      expect(Array.isArray(employees)).toBe(true);
    });

    it("create employee with valid input", async () => {
      const ctx = createAuthContext(1);
      const caller = appRouter.createCaller(ctx);

      const result = await caller.employee.create({
        firstName: "John",
        lastName: "Doe",
        email: "john.doe@example.com",
        department: "Engineering",
        position: "Senior Engineer",
        joinDate: new Date().toISOString(),
        salary: 100000,
      });

      expect(result).toBeDefined();
    });
  });

  describe("finance router", () => {
    it("getInvoices returns user invoices", async () => {
      const ctx = createAuthContext(1);
      const caller = appRouter.createCaller(ctx);

      const invoices = await caller.finance.getInvoices();

      expect(Array.isArray(invoices)).toBe(true);
    });

    it("getExpenses returns user expenses", async () => {
      const ctx = createAuthContext(1);
      const caller = appRouter.createCaller(ctx);

      const expenses = await caller.finance.getExpenses();

      expect(Array.isArray(expenses)).toBe(true);
    });

    it("createInvoice with valid input", async () => {
      const ctx = createAuthContext(1);
      const caller = appRouter.createCaller(ctx);

      const result = await caller.finance.createInvoice({
        invoiceNumber: "INV-001",
        amount: 1000,
        tax: 100,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        description: "Test Invoice",
      });

      expect(result).toBeDefined();
    });

    it("createExpense with valid input", async () => {
      const ctx = createAuthContext(1);
      const caller = appRouter.createCaller(ctx);

      const result = await caller.finance.createExpense({
        description: "Office Supplies",
        category: "Supplies",
        amount: 250,
        expenseDate: new Date().toISOString(),
        notes: "Monthly office supplies",
      });

      expect(result).toBeDefined();
    });
  });

  describe("inventory router", () => {
    it("getProducts returns all products", async () => {
      const ctx = createAuthContext(1);
      const caller = appRouter.createCaller(ctx);

      const products = await caller.inventory.getProducts();

      expect(Array.isArray(products)).toBe(true);
    });

    it("getLowStock returns low stock products", async () => {
      const ctx = createAuthContext(1);
      const caller = appRouter.createCaller(ctx);

      const lowStock = await caller.inventory.getLowStock();

      expect(Array.isArray(lowStock)).toBe(true);
    });

    it("createProduct with valid input", async () => {
      const ctx = createAuthContext(1);
      const caller = appRouter.createCaller(ctx);

      const result = await caller.inventory.createProduct({
        sku: "PROD-001",
        name: "Test Product",
        category: "Electronics",
        unitPrice: 99.99,
        reorderPoint: 10,
        reorderQuantity: 50,
      });

      expect(result).toBeDefined();
    });
  });

  describe("crm router", () => {
    it("getCustomers returns all customers", async () => {
      const ctx = createAuthContext(1);
      const caller = appRouter.createCaller(ctx);

      const customers = await caller.crm.getCustomers();

      expect(Array.isArray(customers)).toBe(true);
    });

    it("getLeads returns all leads", async () => {
      const ctx = createAuthContext(1);
      const caller = appRouter.createCaller(ctx);

      const leads = await caller.crm.getLeads();

      expect(Array.isArray(leads)).toBe(true);
    });

    it("createCustomer with valid input", async () => {
      const ctx = createAuthContext(1);
      const caller = appRouter.createCaller(ctx);

      const result = await caller.crm.createCustomer({
        name: "Test Company",
        email: "contact@testcompany.com",
        company: "Test Company Inc",
        phone: "+1234567890",
      });

      expect(result).toBeDefined();
    });

    it("createLead with valid input", async () => {
      const ctx = createAuthContext(1);
      const caller = appRouter.createCaller(ctx);

      const result = await caller.crm.createLead({
        name: "Jane Smith",
        email: "jane@example.com",
        company: "Tech Corp",
        source: "LinkedIn",
      });

      expect(result).toBeDefined();
    });
  });

  describe("project router", () => {
    it("getProjects returns manager projects", async () => {
      const ctx = createAuthContext(1);
      const caller = appRouter.createCaller(ctx);

      const projects = await caller.project.getProjects();

      expect(Array.isArray(projects)).toBe(true);
    });

    it("getTasks returns project tasks", async () => {
      const ctx = createAuthContext(1);
      const caller = appRouter.createCaller(ctx);

      const tasks = await caller.project.getTasks({ projectId: 1 });

      expect(Array.isArray(tasks)).toBe(true);
    });

    it("createProject with valid input", async () => {
      const ctx = createAuthContext(1);
      const caller = appRouter.createCaller(ctx);

      const result = await caller.project.createProject({
        name: "Test Project",
        description: "A test project",
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        budget: 50000,
      });

      expect(result).toBeDefined();
    });

    it("createTask with valid input", async () => {
      const ctx = createAuthContext(1);
      const caller = appRouter.createCaller(ctx);

      const result = await caller.project.createTask({
        projectId: 1,
        title: "Test Task",
        description: "A test task",
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        priority: "high",
      });

      expect(result).toBeDefined();
    });
  });

  describe("alerts router", () => {
    it("getAlerts returns user alerts", async () => {
      const ctx = createAuthContext(1);
      const caller = appRouter.createCaller(ctx);

      const alerts = await caller.alerts.getAlerts();

      expect(Array.isArray(alerts)).toBe(true);
    });

    it("getUnread returns unread alerts", async () => {
      const ctx = createAuthContext(1);
      const caller = appRouter.createCaller(ctx);

      const unread = await caller.alerts.getUnread();

      expect(Array.isArray(unread)).toBe(true);
    });

    it("markAsRead updates alert status", async () => {
      const ctx = createAuthContext(1);
      const caller = appRouter.createCaller(ctx);

      const result = await caller.alerts.markAsRead({ alertId: 1 });

      expect(result).toBeDefined();
    });
  });

  describe("analytics router", () => {
    it("getMetrics returns module metrics", async () => {
      const ctx = createAuthContext(1);
      const caller = appRouter.createCaller(ctx);

      const metrics = await caller.analytics.getMetrics({ module: "finance" });

      expect(Array.isArray(metrics)).toBe(true);
    });

    it("getAnomalies returns module anomalies", async () => {
      const ctx = createAuthContext(1);
      const caller = appRouter.createCaller(ctx);

      const anomalies = await caller.analytics.getAnomalies({ module: "inventory" });

      expect(Array.isArray(anomalies)).toBe(true);
    });
  });

  describe("documents router", () => {
    it("getDocuments returns module documents", async () => {
      const ctx = createAuthContext(1);
      const caller = appRouter.createCaller(ctx);

      const docs = await caller.documents.getDocuments({
        module: "finance",
        relatedId: 1,
      });

      expect(Array.isArray(docs)).toBe(true);
    });

    it("uploadDocument with valid input", async () => {
      const ctx = createAuthContext(1);
      const caller = appRouter.createCaller(ctx);

      const result = await caller.documents.uploadDocument({
        name: "Invoice.pdf",
        type: "invoice",
        category: "Finance",
        fileKey: "invoices/inv-001.pdf",
        fileUrl: "https://example.com/invoices/inv-001.pdf",
        relatedModule: "finance",
        relatedId: 1,
      });

      expect(result).toBeDefined();
    });
  });
});
