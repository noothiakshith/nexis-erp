import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { aiAssistantRouter } from "./routers/aiAssistant";
import { approvalsRouter } from "./routers/approvals";
import { z } from "zod";
import {
  getEmployeeByUserId,
  getAllEmployees,
  getInvoicesByUser,
  getExpensesByUser,
  getProductsByStatus,
  getLowStockProducts,
  getCustomersByType,
  getLeadsByStatus,
  getProjectsByManager,
  getTasksByProject,
  getAlertsByUser,
  getUnreadAlerts,
  getAnalyticsDataByModule,
  getAnomaliesByModule,
  getDocumentsByModule,
  getDb,
} from "./db";
import {
  employees,
  invoices,
  expenses,
  products,
  customers,
  leads,
  projects,
  tasks,
  alerts,
  documents,
} from "../drizzle/schema";
import { eq } from "drizzle-orm";

// ==================== EMPLOYEE ROUTER ====================
const employeeRouter = router({
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    return await getEmployeeByUserId(ctx.user.id);
  }),

  listAll: protectedProcedure.query(async () => {
    return await getAllEmployees();
  }),

  create: protectedProcedure
    .input(
      z.object({
        firstName: z.string(),
        lastName: z.string(),
        email: z.string().email(),
        department: z.string(),
        position: z.string(),
        joinDate: z.string(),
        salary: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const result = await db.insert(employees).values({
        userId: 1, // Will be linked to user
        employeeId: `EMP-${Date.now()}`,
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        department: input.department,
        position: input.position,
        joinDate: new Date(input.joinDate),
        salary: input.salary ? input.salary.toString() : undefined,
      });

      return result;
    }),
});

// ==================== FINANCE ROUTER ====================
const financeRouter = router({
  getInvoices: protectedProcedure.query(async ({ ctx }) => {
    return await getInvoicesByUser(ctx.user.id);
  }),

  getExpenses: protectedProcedure.query(async ({ ctx }) => {
    return await getExpensesByUser(ctx.user.id);
  }),

  createInvoice: protectedProcedure
    .input(
      z.object({
        invoiceNumber: z.string(),
        amount: z.number(),
        tax: z.number().optional(),
        dueDate: z.string(),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const result = await db.insert(invoices).values({
        invoiceNumber: input.invoiceNumber,
        amount: input.amount.toString(),
        tax: input.tax ? input.tax.toString() : "0",
        totalAmount: (input.amount + (input.tax || 0)).toString(),
        issueDate: new Date(),
        dueDate: new Date(input.dueDate),
        description: input.description,
        createdBy: ctx.user.id,
      });

      return result;
    }),

  createExpense: protectedProcedure
    .input(
      z.object({
        description: z.string(),
        category: z.string(),
        amount: z.number(),
        expenseDate: z.string(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const result = await db.insert(expenses).values({
        description: input.description,
        category: input.category,
        amount: input.amount.toString(),
        expenseDate: new Date(input.expenseDate),
        submittedBy: ctx.user.id,
        notes: input.notes,
      });

      return result;
    }),
});

// ==================== INVENTORY ROUTER ====================
const inventoryRouter = router({
  getProducts: protectedProcedure
    .input(z.object({ status: z.string().optional() }).optional())
    .query(async ({ input }) => {
      if (input?.status) {
        return await getProductsByStatus(input.status);
      }
      const db = await getDb();
      if (!db) return [];
      return await db.select().from(products);
    }),

  getLowStock: protectedProcedure.query(async () => {
    return await getLowStockProducts();
  }),

  createProduct: protectedProcedure
    .input(
      z.object({
        sku: z.string(),
        name: z.string(),
        category: z.string(),
        unitPrice: z.number(),
        reorderPoint: z.number(),
        reorderQuantity: z.number(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const result = await db.insert(products).values({
        sku: input.sku,
        name: input.name,
        category: input.category,
        unitPrice: input.unitPrice.toString(),
        quantity: 0,
        reorderPoint: input.reorderPoint,
        reorderQuantity: input.reorderQuantity,
      });

      return result;
    }),
});

// ==================== CRM ROUTER ====================
const crmRouter = router({
  getCustomers: protectedProcedure
    .input(z.object({ type: z.string().optional() }).optional())
    .query(async ({ input }) => {
      if (input?.type) {
        return await getCustomersByType(input.type);
      }
      const db = await getDb();
      if (!db) return [];
      return await db.select().from(customers);
    }),

  getLeads: protectedProcedure
    .input(z.object({ status: z.string().optional() }).optional())
    .query(async ({ input }) => {
      if (input?.status) {
        return await getLeadsByStatus(input.status);
      }
      const db = await getDb();
      if (!db) return [];
      return await db.select().from(leads);
    }),

  createCustomer: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        email: z.string().email(),
        company: z.string().optional(),
        phone: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const result = await db.insert(customers).values({
        name: input.name,
        email: input.email,
        company: input.company,
        phone: input.phone,
      });

      return result;
    }),

  createLead: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        email: z.string().email().optional(),
        company: z.string().optional(),
        source: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const result = await db.insert(leads).values({
        name: input.name,
        email: input.email,
        company: input.company,
        source: input.source,
      });

      return result;
    }),
});

// ==================== PROJECT ROUTER ====================
const projectRouter = router({
  getProjects: protectedProcedure.query(async ({ ctx }) => {
    return await getProjectsByManager(ctx.user.id);
  }),

  getTasks: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      return await getTasksByProject(input.projectId);
    }),

  createProject: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        description: z.string().optional(),
        startDate: z.string(),
        endDate: z.string(),
        budget: z.number().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const result = await db.insert(projects).values({
        name: input.name,
        description: input.description,
        startDate: new Date(input.startDate),
        endDate: new Date(input.endDate),
        budget: input.budget ? input.budget.toString() : undefined,
        manager: ctx.user.id,
      });

      return result;
    }),

  createTask: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
        title: z.string(),
        description: z.string().optional(),
        dueDate: z.string().optional(),
        priority: z.enum(["low", "medium", "high", "critical"]).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const result = await db.insert(tasks).values({
        projectId: input.projectId,
        title: input.title,
        description: input.description,
        dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
        priority: input.priority || "medium",
      });

      return result;
    }),
});

// ==================== ALERTS ROUTER ====================
const alertsRouter = router({
  getAlerts: protectedProcedure.query(async ({ ctx }) => {
    return await getAlertsByUser(ctx.user.id);
  }),

  getUnread: protectedProcedure.query(async ({ ctx }) => {
    return await getUnreadAlerts(ctx.user.id);
  }),

  markAsRead: protectedProcedure
    .input(z.object({ alertId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const result = await db
        .update(alerts)
        .set({ status: "read", readAt: new Date() })
        .where(eq(alerts.id, input.alertId));

      return result;
    }),
});

// ==================== ANALYTICS ROUTER ====================
const analyticsRouter = router({
  getMetrics: protectedProcedure
    .input(z.object({ module: z.string() }))
    .query(async ({ input }) => {
      return await getAnalyticsDataByModule(input.module);
    }),

  getAnomalies: protectedProcedure
    .input(z.object({ module: z.string() }))
    .query(async ({ input }) => {
      return await getAnomaliesByModule(input.module);
    }),
});

// ==================== DOCUMENTS ROUTER ====================
const documentsRouter = router({
  getDocuments: protectedProcedure
    .input(
      z.object({
        module: z.string(),
        relatedId: z.number().optional(),
      })
    )
    .query(async ({ input }) => {
      return await getDocumentsByModule(input.module, input.relatedId);
    }),

  uploadDocument: protectedProcedure
    .input(
      z.object({
        name: z.string(),
        type: z.string(),
        category: z.string(),
        fileKey: z.string(),
        fileUrl: z.string(),
        relatedModule: z.string().optional(),
        relatedId: z.number().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const result = await db.insert(documents).values({
        name: input.name,
        type: input.type,
        category: input.category,
        fileKey: input.fileKey,
        fileUrl: input.fileUrl,
        relatedModule: input.relatedModule,
        relatedId: input.relatedId,
        uploadedBy: ctx.user.id,
      });

      return result;
    }),
});

// ==================== MAIN ROUTER ====================
export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Feature routers
  employee: employeeRouter,
  finance: financeRouter,
  inventory: inventoryRouter,
  crm: crmRouter,
  project: projectRouter,
  alerts: alertsRouter,
  analytics: analyticsRouter,
  documents: documentsRouter,
  aiAssistant: aiAssistantRouter,
  approvals: approvalsRouter,
});

export type AppRouter = typeof appRouter;
