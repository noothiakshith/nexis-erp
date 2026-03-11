import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { aiAssistantRouter } from "./routers/aiAssistant";
import { approvalsRouter } from "./routers/approvals";
import { metricsRouter } from "./routers/metrics";
import { advancedAnalyticsRouter } from "./routers/advancedAnalytics";
import { predictiveAnalyticsRouter } from "./routers/predictiveAnalyticsRouter";
import { scheduledReportsRouter } from "./routers/scheduledReports";
import { supplierRouter, stockMovementRouter, warehouseRouter, inventoryAnalyticsRouter } from "./routers/inventoryRouter";
import { aiRouter } from "./routers/ai";
import { mlRealRouter } from "./routers/mlReal";
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
  budgets,
  payments,
  products,
  customers,
  leads,
  interactions,
  projects,
  tasks,
  alerts,
  documents,
  purchaseOrders,
  leaves,
  approvals,
  approvalSteps as approvalStepsTable,
  approvalAudit,
  users,
  milestones,
  resourceAllocations,
} from "../drizzle/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import { getApprovalWorkflow } from "./_core/approvalRules";
import { sendApprovalEmail } from "./_core/emailService";

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

  getLeaves: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];
    return await db.select().from(leaves);
  }),

  submitLeaveRequest: protectedProcedure
    .input(z.object({
      employeeId: z.number().optional(),
      leaveType: z.string(),
      startDate: z.string(),
      endDate: z.string(),
      reason: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      let emp;

      if (input.employeeId) {
        emp = await db.select().from(employees).where(eq(employees.id, input.employeeId)).limit(1);
        if (!emp.length) throw new Error("Selected employee not found");
      } else {
        emp = await db.select().from(employees).where(eq(employees.userId, ctx.user.id)).limit(1);

        if (!emp.length) {
          // Auto-create a placeholder employee record for the current user if missing
          const names = ctx.user.name?.split(' ') || ["Staff", "Member"];
          const firstName = names[0];
          const lastName = names.length > 1 ? names.slice(1).join(' ') : "System";

          const newEmpRes = await db.insert(employees).values({
            userId: ctx.user.id,
            firstName,
            lastName,
            email: ctx.user.email || `user${ctx.user.id}@nexis.local`,
            department: "General",
            position: "Staff",
            joinDate: new Date(),
            status: "active",
          });

          const newEmpId = newEmpRes[0].insertId;
          const newEmp = await db.select().from(employees).where(eq(employees.id, newEmpId as any)).limit(1);
          emp = newEmp;
        }
      }

      if (!emp.length) throw new Error("Could not create employee profile automatically");

      const result = await db.insert(leaves).values({
        employeeId: emp[0].id,
        leaveType: input.leaveType,
        startDate: new Date(input.startDate),
        endDate: new Date(input.endDate),
        reason: input.reason,
        status: "pending",
      });

      const leaveId = result[0].insertId;

      // Create approval workflow using the rules engine
      const leaveData = {
        leaveType: input.leaveType,
        startDate: input.startDate,
        endDate: input.endDate,
        employeeName: `${emp[0].firstName} ${emp[0].lastName}`,
        reason: input.reason,
      };

      const approvalSteps = await getApprovalWorkflow("leave_request", leaveData, ctx.user.id);

      if (approvalSteps.length > 0) {
        // Create the approval workflow
        const approvalResult = await db.insert(approvals).values({
          requestType: "leave_request",
          requestId: leaveId as any,
          requestorId: ctx.user.id,
          totalSteps: approvalSteps.length,
          status: "pending",
        });

        const approvalId = approvalResult[0].insertId;

        // Create approval steps
        for (const step of approvalSteps) {
          await db.insert(approvalStepsTable).values({
            approvalId: approvalId as any,
            stepNumber: step.stepNumber,
            approverRole: step.approverRole,
            assignedTo: step.assignedTo,
            status: "pending",
          });
        }

        // Log the action
        await db.insert(approvalAudit).values({
          approvalId: approvalId as any,
          action: "created",
          performedBy: ctx.user.id,
          details: { requestType: "leave_request", requestId: leaveId },
          ipAddress: ctx.req.headers["x-forwarded-for"] as string || "unknown",
        });

        // Send notification to first approver
        const firstStep = approvalSteps[0];
        if (firstStep?.assignedTo) {
          const approver = await db.select().from(users).where(eq(users.id, firstStep.assignedTo)).limit(1);
          if (approver.length && approver[0].email) {
            await sendApprovalEmail({
              to: approver[0].email,
              template: "leave_pending_approval",
              data: {
                ...leaveData,
                approvalUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/approvals/${approvalId}`,
              },
            });
          }
        }
      }

      return { leaveId };
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

  submitExpense: protectedProcedure
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

      let emp = await db.select().from(employees).where(eq(employees.userId, ctx.user.id)).limit(1);

      if (!emp.length) {
        // Auto-create placeholder for expense submission too
        const names = ctx.user.name?.split(' ') || ["Staff", "Member"];
        const firstName = names[0];
        const lastName = names.length > 1 ? names.slice(1).join(' ') : "System";

        const newEmpRes = await db.insert(employees).values({
          userId: ctx.user.id,
          firstName,
          lastName,
          email: ctx.user.email || `user${ctx.user.id}@nexis.local`,
          department: "General",
          position: "Staff",
          joinDate: new Date(),
          status: "active",
        });
        const newEmpId = newEmpRes[0].insertId;
        emp = await db.select().from(employees).where(eq(employees.id, newEmpId as any)).limit(1);
      }

      const result = await db.insert(expenses).values({
        description: input.description,
        category: input.category,
        amount: input.amount.toString(),
        expenseDate: new Date(input.expenseDate),
        submittedBy: ctx.user.id,
        notes: input.notes,
        status: "submitted",
      });

      const expenseId = result[0].insertId;

      // Create approval workflow using the rules engine
      const expenseData = {
        description: input.description,
        category: input.category,
        totalAmount: input.amount,
        employeeName: `${emp[0]?.firstName} ${emp[0]?.lastName}`,
        createdAt: new Date(),
      };

      const approvalSteps = await getApprovalWorkflow("expense_report", expenseData, ctx.user.id);

      if (approvalSteps.length > 0) {
        // Create the approval workflow
        const approvalResult = await db.insert(approvals).values({
          requestType: "expense_report",
          requestId: expenseId as any,
          requestorId: ctx.user.id,
          totalSteps: approvalSteps.length,
          status: "pending",
        });

        const approvalId = approvalResult[0].insertId;

        // Create approval steps
        for (const step of approvalSteps) {
          await db.insert(approvalStepsTable).values({
            approvalId: approvalId as any,
            stepNumber: step.stepNumber,
            approverRole: step.approverRole,
            assignedTo: step.assignedTo,
            status: "pending",
          });
        }

        // Log the action
        await db.insert(approvalAudit).values({
          approvalId: approvalId as any,
          action: "created",
          performedBy: ctx.user.id,
          details: { requestType: "expense_report", requestId: expenseId },
          ipAddress: ctx.req.headers["x-forwarded-for"] as string || "unknown",
        });

        // Send notification to first approver
        const firstStep = approvalSteps[0];
        if (firstStep?.assignedTo) {
          const approver = await db.select().from(users).where(eq(users.id, firstStep.assignedTo)).limit(1);
          if (approver.length && approver[0].email) {
            await sendApprovalEmail({
              to: approver[0].email,
              template: "expense_pending_approval",
              data: {
                ...expenseData,
                approvalUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/approvals/${approvalId}`,
              },
            });
          }
        }
      }

      return { expenseId };
    }),

  // Budget Management Endpoints
  getBudgets: protectedProcedure
    .input(z.object({ 
      fiscalYear: z.number().optional(),
      department: z.string().optional() 
    }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      
      let query = db.select().from(budgets);
      
      if (input?.fiscalYear) {
        query = query.where(eq(budgets.fiscalYear, input.fiscalYear)) as any;
      }
      
      if (input?.department) {
        query = query.where(eq(budgets.department, input.department)) as any;
      }
      
      return await query;
    }),

  createBudget: protectedProcedure
    .input(z.object({
      department: z.string(),
      category: z.string(),
      budgetAmount: z.number(),
      fiscalYear: z.number(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const result = await db.insert(budgets).values({
        department: input.department,
        category: input.category,
        budgetAmount: input.budgetAmount.toString(),
        spentAmount: "0",
        fiscalYear: input.fiscalYear,
        status: "draft",
      });

      return result;
    }),

  updateBudget: protectedProcedure
    .input(z.object({
      budgetId: z.number(),
      budgetAmount: z.number().optional(),
      status: z.enum(["draft", "approved", "active", "closed"]).optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const updateData: any = {};
      if (input.budgetAmount !== undefined) updateData.budgetAmount = input.budgetAmount.toString();
      if (input.status !== undefined) updateData.status = input.status;

      const result = await db.update(budgets).set(updateData).where(eq(budgets.id, input.budgetId));
      return result;
    }),

  // Financial Analytics
  getFinancialAnalytics: protectedProcedure
    .input(z.object({
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }).optional())
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) return null;

      const startDate = input?.startDate ? new Date(input.startDate) : new Date(new Date().getFullYear(), 0, 1);
      const endDate = input?.endDate ? new Date(input.endDate) : new Date();

      // Get invoices and expenses for the period
      const periodInvoices = await db.select().from(invoices)
        .where(and(
          gte(invoices.issueDate, startDate),
          lte(invoices.issueDate, endDate)
        ));

      const periodExpenses = await db.select().from(expenses)
        .where(and(
          gte(expenses.expenseDate, startDate),
          lte(expenses.expenseDate, endDate)
        ));

      const totalRevenue = periodInvoices.reduce((sum, inv) => sum + parseFloat(inv.totalAmount || "0"), 0);
      const totalExpenses = periodExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount || "0"), 0);

      return {
        totalRevenue,
        totalExpenses,
        netIncome: totalRevenue - totalExpenses,
        invoiceCount: periodInvoices.length,
        expenseCount: periodExpenses.length,
        profitMargin: totalRevenue > 0 ? ((totalRevenue - totalExpenses) / totalRevenue) * 100 : 0,
      };
    }),

  // Payment Management Endpoints
  getPayments: protectedProcedure
    .input(z.object({
      type: z.enum(["incoming", "outgoing", "all"]).optional(),
      status: z.enum(["pending", "completed", "failed", "cancelled", "all"]).optional(),
    }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      
      let query = db.select().from(payments);
      const conditions = [];
      
      if (input?.type && input.type !== "all") {
        conditions.push(eq(payments.type, input.type));
      }
      
      if (input?.status && input.status !== "all") {
        conditions.push(eq(payments.status, input.status));
      }
      
      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as any;
      }
      
      return await query;
    }),

  recordPayment: protectedProcedure
    .input(z.object({
      type: z.enum(["incoming", "outgoing"]),
      amount: z.number(),
      method: z.enum(["bank_transfer", "credit_card", "cash", "check", "online"]),
      description: z.string(),
      paymentDate: z.string(),
      relatedInvoiceId: z.number().optional(),
      relatedExpenseId: z.number().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Generate unique reference
      const reference = `PAY-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;

      const result = await db.insert(payments).values({
        reference,
        type: input.type,
        amount: input.amount.toString(),
        method: input.method,
        description: input.description,
        paymentDate: new Date(input.paymentDate),
        relatedInvoiceId: input.relatedInvoiceId,
        relatedExpenseId: input.relatedExpenseId,
        status: "completed",
        reconciled: false,
        createdBy: ctx.user.id,
      });

      const paymentId = result[0].insertId;

      // If related to invoice, update invoice status
      if (input.relatedInvoiceId && input.type === "incoming") {
        await db.update(invoices)
          .set({ status: "paid" })
          .where(eq(invoices.id, input.relatedInvoiceId));
      }

      // If related to expense, update expense status
      if (input.relatedExpenseId && input.type === "outgoing") {
        await db.update(expenses)
          .set({ status: "paid" })
          .where(eq(expenses.id, input.relatedExpenseId));
      }

      return { paymentId, reference };
    }),

  reconcilePayment: protectedProcedure
    .input(z.object({
      paymentId: z.number(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const result = await db.update(payments)
        .set({
          reconciled: true,
          reconciledBy: ctx.user.id,
          reconciledAt: new Date(),
        })
        .where(eq(payments.id, input.paymentId));

      return result;
    }),

  updatePaymentStatus: protectedProcedure
    .input(z.object({
      paymentId: z.number(),
      status: z.enum(["pending", "completed", "failed", "cancelled"]),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const result = await db.update(payments)
        .set({ status: input.status })
        .where(eq(payments.id, input.paymentId));

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
        currentStock: 0,
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
      if (!db) {
        // Return mock data for demonstration
        return [
          {
            id: 1,
            name: "Acme Corporation",
            email: "contact@acme.com",
            company: "Acme Corp",
            source: "Website",
            status: "new",
            value: "150000",
            assignedTo: 1,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: 2,
            name: "TechStart Inc",
            email: "hello@techstart.com",
            company: "TechStart Inc",
            source: "Referral",
            status: "contacted",
            value: "75000",
            assignedTo: 1,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: 3,
            name: "Global Solutions",
            email: "info@globalsolutions.com",
            company: "Global Solutions Ltd",
            source: "Cold Call",
            status: "qualified",
            value: "200000",
            assignedTo: 2,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: 4,
            name: "Innovation Labs",
            email: "contact@innovationlabs.com",
            company: "Innovation Labs",
            source: "LinkedIn",
            status: "proposal",
            value: "120000",
            assignedTo: 1,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: 5,
            name: "Future Systems",
            email: "sales@futuresystems.com",
            company: "Future Systems",
            source: "Trade Show",
            status: "won",
            value: "300000",
            assignedTo: 2,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ];
      }
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

  // Lead details and interactions
  getLead: protectedProcedure
    .input(z.object({ leadId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const result = await db.select().from(leads).where(eq(leads.id, input.leadId)).limit(1);
      if (!result.length) throw new Error("Lead not found");
      return result[0];
    }),

  updateLeadStatus: protectedProcedure
    .input(z.object({
      leadId: z.number(),
      status: z.enum(["new", "contacted", "qualified", "proposal", "won", "lost"]),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const result = await db.update(leads)
        .set({ status: input.status })
        .where(eq(leads.id, input.leadId));
      return result;
    }),

  // Interactions
  getInteractions: protectedProcedure
    .input(z.object({ 
      customerId: z.number().optional(),
      leadId: z.number().optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      
      // In a real implementation, you would query the interactions table
      // For now, return mock data
      return [
        {
          id: 1,
          type: "call",
          subject: "Initial discovery call",
          notes: "Discussed project requirements and budget. Customer interested in enterprise plan.",
          createdBy: 1,
          createdByName: "John Doe",
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
        }
      ];
    }),

  addInteraction: protectedProcedure
    .input(z.object({
      customerId: z.number().optional(),
      leadId: z.number().optional(),
      type: z.string(),
      subject: z.string(),
      notes: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const result = await db.insert(interactions).values({
        customerId: input.customerId,
        leadId: input.leadId,
        type: input.type,
        subject: input.subject,
        notes: input.notes,
        createdBy: ctx.user.id,
      });

      return result;
    }),

  // Sales Analytics
  getSalesAnalytics: protectedProcedure
    .query(async () => {
      const db = await getDb();
      if (!db) return null;
      
      // In a real implementation, you would calculate these from actual data
      // For now, return mock analytics
      return {
        totalRevenue: 1250000,
        revenueGrowth: 15.3,
        totalLeads: 156,
        leadsGrowth: 8.2,
        conversionRate: 24.5,
        conversionGrowth: 3.1,
        avgDealSize: 45000,
        dealSizeGrowth: -2.4,
        wonDeals: 38,
        lostDeals: 12,
        activeDeals: 106,
        pipelineValue: 4750000
      };
    }),
});

// ==================== PROJECT ROUTER ====================
const projectRouter = router({
  getProjects: protectedProcedure.query(async ({ ctx }) => {
    return await getProjectsByManager(ctx.user.id);
  }),

  getProject: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const result = await db.select().from(projects).where(eq(projects.id, input.projectId)).limit(1);
      if (!result.length) throw new Error("Project not found");
      return result[0];
    }),

  getTasks: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      return await getTasksByProject(input.projectId);
    }),

  getMilestones: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return await db.select().from(milestones).where(eq(milestones.projectId, input.projectId));
    }),

  getResourceAllocations: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      return await db.select().from(resourceAllocations).where(eq(resourceAllocations.projectId, input.projectId));
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
        projectManager: ctx.user.id,
      });

      return result;
    }),

  createTask: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
        title: z.string(),
        description: z.string().optional(),
        assignedTo: z.number().optional(),
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
        assignedTo: input.assignedTo,
        dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
        priority: input.priority || "medium",
      });

      return result;
    }),

  updateTask: protectedProcedure
    .input(
      z.object({
        taskId: z.number(),
        title: z.string().optional(),
        description: z.string().optional(),
        assignedTo: z.number().optional(),
        dueDate: z.string().optional(),
        priority: z.enum(["low", "medium", "high", "critical"]).optional(),
        status: z.enum(["todo", "in_progress", "review", "completed", "cancelled"]).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const updateData: any = {};
      if (input.title !== undefined) updateData.title = input.title;
      if (input.description !== undefined) updateData.description = input.description;
      if (input.assignedTo !== undefined) updateData.assignedTo = input.assignedTo;
      if (input.dueDate !== undefined) updateData.dueDate = input.dueDate ? new Date(input.dueDate) : null;
      if (input.priority !== undefined) updateData.priority = input.priority;
      if (input.status !== undefined) updateData.status = input.status;

      const result = await db.update(tasks).set(updateData).where(eq(tasks.id, input.taskId));
      return result;
    }),

  deleteTask: protectedProcedure
    .input(z.object({ taskId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const result = await db.delete(tasks).where(eq(tasks.id, input.taskId));
      return result;
    }),

  createMilestone: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
        name: z.string(),
        description: z.string().optional(),
        targetDate: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const result = await db.insert(milestones).values({
        projectId: input.projectId,
        name: input.name,
        description: input.description,
        targetDate: new Date(input.targetDate),
        status: "pending",
      });

      return result;
    }),

  updateMilestone: protectedProcedure
    .input(
      z.object({
        milestoneId: z.number(),
        name: z.string().optional(),
        description: z.string().optional(),
        targetDate: z.string().optional(),
        status: z.enum(["pending", "in_progress", "completed"]).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const updateData: any = {};
      if (input.name !== undefined) updateData.name = input.name;
      if (input.description !== undefined) updateData.description = input.description;
      if (input.targetDate !== undefined) updateData.targetDate = new Date(input.targetDate);
      if (input.status !== undefined) updateData.status = input.status;

      const result = await db.update(milestones).set(updateData).where(eq(milestones.id, input.milestoneId));
      return result;
    }),

  deleteMilestone: protectedProcedure
    .input(z.object({ milestoneId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const result = await db.delete(milestones).where(eq(milestones.id, input.milestoneId));
      return result;
    }),

  addResourceAllocation: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
        employeeId: z.number(),
        role: z.string(),
        allocatedHours: z.number(),
        startDate: z.string(),
        endDate: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const result = await db.insert(resourceAllocations).values({
        projectId: input.projectId,
        employeeId: input.employeeId,
        role: input.role,
        allocatedHours: input.allocatedHours,
        startDate: new Date(input.startDate),
        endDate: input.endDate ? new Date(input.endDate) : undefined,
        status: "active",
      });

      return result;
    }),

  updateResourceStatus: protectedProcedure
    .input(
      z.object({
        allocationId: z.number(),
        status: z.enum(["active", "completed", "on_hold"]),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const result = await db.update(resourceAllocations)
        .set({ status: input.status })
        .where(eq(resourceAllocations.id, input.allocationId));
      return result;
    }),

  removeResourceAllocation: protectedProcedure
    .input(z.object({ allocationId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const result = await db.delete(resourceAllocations).where(eq(resourceAllocations.id, input.allocationId));
      return result;
    }),

  // Comments endpoints
  getComments: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      
      // In a real implementation, you would have a comments table
      // For now, return mock data
      return [
        {
          id: 1,
          content: "Great progress on the project! The new features are looking good.",
          authorId: 1,
          authorName: "John Doe",
          createdAt: new Date(),
          replies: []
        }
      ];
    }),

  addComment: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      content: z.string(),
      parentId: z.number().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // In a real implementation, you would insert into a comments table
      // For now, just return success
      return { success: true };
    }),

  // Files endpoints
  getFiles: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      
      // In a real implementation, you would query a project_files table
      // For now, return mock data
      return [
        {
          id: 1,
          name: "Project Requirements.pdf",
          type: "application/pdf",
          category: "document",
          fileSize: 1024000,
          fileUrl: "https://example.com/file1.pdf",
          uploadedBy: 1,
          uploaderName: "John Doe",
          createdAt: new Date()
        }
      ];
    }),

  uploadFile: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      name: z.string(),
      type: z.string(),
      category: z.string(),
      fileSize: z.number(),
      fileKey: z.string(),
      fileUrl: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // In a real implementation, you would insert into a project_files table
      // For now, just return success
      return { success: true };
    }),

  deleteFile: protectedProcedure
    .input(z.object({ fileId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // In a real implementation, you would delete from project_files table
      // For now, just return success
      return { success: true };
    }),

  // Activity endpoints
  getActivity: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];
      
      // In a real implementation, you would query an activity log table
      // For now, return mock data
      return [
        {
          id: 1,
          type: "task_created",
          description: "created a new task 'Implement user authentication'",
          performedBy: 1,
          performerName: "John Doe",
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
          metadata: { taskName: "Implement user authentication" }
        },
        {
          id: 2,
          type: "milestone_updated",
          description: "marked milestone 'Phase 1 Complete' as completed",
          performedBy: 2,
          performerName: "Jane Smith",
          createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
          metadata: { milestoneName: "Phase 1 Complete" }
        },
        {
          id: 3,
          type: "file_uploaded",
          description: "uploaded a new file 'Design Mockups.figma'",
          performedBy: 1,
          performerName: "John Doe",
          createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
          metadata: { fileName: "Design Mockups.figma" }
        }
      ];
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

const procurementRouter = router({
  listAll: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");
    return await db.select().from(purchaseOrders);
  }),
  createPurchaseOrder: protectedProcedure
    .input(
      z.object({
        poNumber: z.string(),
        supplierId: z.number(),
        totalAmount: z.number(),
        orderDate: z.string(),
        status: z.enum(["draft", "pending_approval", "approved", "sent", "received", "cancelled"]).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const res = await db.insert(purchaseOrders).values({
        poNumber: input.poNumber,
        supplierId: input.supplierId,
        totalAmount: input.totalAmount.toString(),
        orderDate: new Date(input.orderDate),
        status: input.status || "draft",
        createdBy: ctx.user.id,
      });

      const poId = res[0].insertId;

      if (input.status === "pending_approval") {
        // Create approval workflow using the rules engine
        const poData = {
          poNumber: input.poNumber,
          totalAmount: input.totalAmount,
          supplierName: "Supplier", // Would fetch from supplier table in real implementation
          requestorName: ctx.user.name || "Unknown User",
          createdAt: new Date(),
        };

        const approvalSteps = await getApprovalWorkflow("purchase_order", poData, ctx.user.id);

        if (approvalSteps.length > 0) {
          // Create the approval workflow
          const approvalResult = await db.insert(approvals).values({
            requestType: "purchase_order",
            requestId: poId as any,
            requestorId: ctx.user.id,
            totalSteps: approvalSteps.length,
            status: "pending",
          });

          const approvalId = approvalResult[0].insertId;

          // Create approval steps
          for (const step of approvalSteps) {
            await db.insert(approvalStepsTable).values({
              approvalId: approvalId as any,
              stepNumber: step.stepNumber,
              approverRole: step.approverRole,
              assignedTo: step.assignedTo,
              status: "pending",
            });
          }

          // Log the action
          await db.insert(approvalAudit).values({
            approvalId: approvalId as any,
            action: "created",
            performedBy: ctx.user.id,
            details: { requestType: "purchase_order", requestId: poId },
            ipAddress: ctx.req.headers["x-forwarded-for"] as string || "unknown",
          });

          // Send notification to first approver
          const firstStep = approvalSteps[0];
          if (firstStep?.assignedTo) {
            const approver = await db.select().from(users).where(eq(users.id, firstStep.assignedTo)).limit(1);
            if (approver.length && approver[0].email) {
              await sendApprovalEmail({
                to: approver[0].email,
                template: "po_pending_approval",
                data: {
                  ...poData,
                  approvalUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/approvals/${approvalId}`,
                },
              });
            }
          }
        }
      }

      return res;
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
  procurement: procurementRouter,
  alerts: alertsRouter,
  analytics: analyticsRouter,
  documents: documentsRouter,
  aiAssistant: aiAssistantRouter,
  approvals: approvalsRouter,
  metrics: metricsRouter,
  advancedAnalytics: advancedAnalyticsRouter,
  predictiveAnalytics: predictiveAnalyticsRouter,
  scheduledReports: scheduledReportsRouter,
  suppliers: supplierRouter,
  stockMovements: stockMovementRouter,
  warehouse: warehouseRouter,
  inventoryAnalytics: inventoryAnalyticsRouter,
  ai: aiRouter,
  mlReal: mlRealRouter,
});

export type AppRouter = typeof appRouter;
