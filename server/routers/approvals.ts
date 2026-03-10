import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import {
  approvals,
  approvalSteps,
  approvalAudit,
  purchaseOrders,
  leaves,
  expenses,
  employees,
  users,
} from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import { sendApprovalEmail } from "../_core/emailService";

/**
 * Approval workflow router for multi-step approvals
 * Handles purchase orders, leave requests, and expense reports
 */
export const approvalsRouter = router({
  /**
   * Create a new approval workflow
   */
  createApproval: protectedProcedure
    .input(
      z.object({
        requestType: z.enum(["purchase_order", "leave_request", "expense_report"]),
        requestId: z.number(),
        approvalSteps: z.array(
          z.object({
            stepNumber: z.number(),
            approverRole: z.string(),
            assignedTo: z.number().optional(),
          })
        ),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      try {
        // Create the approval workflow
        const result = await db.insert(approvals).values({
          requestType: input.requestType,
          requestId: input.requestId,
          requestorId: ctx.user.id,
          totalSteps: input.approvalSteps.length,
          status: "pending",
        });

        const approvalId = result[0].insertId;

        // Create approval steps
        for (const step of input.approvalSteps) {
          await db.insert(approvalSteps).values({
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
          details: { requestType: input.requestType, requestId: input.requestId },
          ipAddress: ctx.req.headers["x-forwarded-for"] as string,
        });

        return { approvalId, status: "created" };
      } catch (error) {
        console.error("Error creating approval:", error);
        throw error;
      }
    }),

  /**
   * Get pending approvals for the current user
   */
  getPendingApprovals: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    try {
      const pendingApprovals = await db
        .select()
        .from(approvalSteps)
        .where(
          and(
            eq(approvalSteps.assignedTo, ctx.user.id),
            eq(approvalSteps.status, "pending")
          )
        )
        .leftJoin(approvals, eq(approvalSteps.approvalId, approvals.id));

      return pendingApprovals.map((item) => ({
        approvalId: item.approvals?.id,
        stepId: item.approvalSteps.id,
        requestType: item.approvals?.requestType,
        requestId: item.approvals?.requestId,
        stepNumber: item.approvalSteps.stepNumber,
        totalSteps: item.approvals?.totalSteps,
        createdAt: item.approvals?.createdAt,
      }));
    } catch (error) {
      console.error("Error fetching pending approvals:", error);
      throw error;
    }
  }),

  /**
   * Get approval details with all steps and history
   */
  getApprovalDetails: protectedProcedure
    .input(z.object({ approvalId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      try {
        const approval = await db
          .select()
          .from(approvals)
          .where(eq(approvals.id, input.approvalId))
          .limit(1);

        if (!approval.length) throw new Error("Approval not found");

        const steps = await db
          .select()
          .from(approvalSteps)
          .where(eq(approvalSteps.approvalId, input.approvalId));

        const audit = await db
          .select()
          .from(approvalAudit)
          .where(eq(approvalAudit.approvalId, input.approvalId))
          .orderBy(desc(approvalAudit.createdAt));

        return {
          approval: approval[0],
          steps,
          audit,
        };
      } catch (error) {
        console.error("Error fetching approval details:", error);
        throw error;
      }
    }),

  /**
   * Approve a step in the workflow
   */
  approveStep: protectedProcedure
    .input(
      z.object({
        approvalId: z.number(),
        stepId: z.number(),
        comments: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      try {
        // Update the step
        await db
          .update(approvalSteps)
          .set({
            status: "approved",
            comments: input.comments,
            approvedAt: new Date(),
          })
          .where(eq(approvalSteps.id, input.stepId));

        // Get the approval to check if all steps are approved
        const approval = await db
          .select()
          .from(approvals)
          .where(eq(approvals.id, input.approvalId))
          .limit(1);

        if (!approval.length) throw new Error("Approval not found");

        // Check if this is the last step
        const allSteps = await db
          .select()
          .from(approvalSteps)
          .where(eq(approvalSteps.approvalId, input.approvalId));

        const allApproved = allSteps.every((s) => s.status === "approved");

        if (allApproved) {
          // Update approval status
          await db
            .update(approvals)
            .set({
              status: "approved",
              completedAt: new Date(),
            })
            .where(eq(approvals.id, input.approvalId));

          // Update the related request status
          const approvalData = approval[0];
          if (approvalData.requestType === "purchase_order") {
            await db
              .update(purchaseOrders)
              .set({ status: "approved" })
              .where(eq(purchaseOrders.id, approvalData.requestId));
          } else if (approvalData.requestType === "leave_request") {
            await db
              .update(leaves)
              .set({ status: "approved", approvedBy: ctx.user.id })
              .where(eq(leaves.id, approvalData.requestId));
          } else if (approvalData.requestType === "expense_report") {
            await db
              .update(expenses)
              .set({ status: "approved" })
              .where(eq(expenses.id, approvalData.requestId));
          }
        } else {
          // Move to next step
          const nextStep = allSteps.find((s) => s.stepNumber > (input.stepId as any));
          if (nextStep) {
            await db
              .update(approvals)
              .set({ currentStep: nextStep.stepNumber })
              .where(eq(approvals.id, input.approvalId));
          }
        }

        // Log the action
        await db.insert(approvalAudit).values({
          approvalId: input.approvalId,
          action: "approved",
          performedBy: ctx.user.id,
          details: { stepId: input.stepId, comments: input.comments },
          ipAddress: ctx.req.headers["x-forwarded-for"] as string,
        });

        return { status: "approved", allApproved };
      } catch (error) {
        console.error("Error approving step:", error);
        throw error;
      }
    }),

  /**
   * Reject an approval request
   */
  rejectApproval: protectedProcedure
    .input(
      z.object({
        approvalId: z.number(),
        stepId: z.number(),
        rejectionReason: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      try {
        // Update the step
        await db
          .update(approvalSteps)
          .set({
            status: "rejected",
            comments: input.rejectionReason,
            approvedAt: new Date(),
          })
          .where(eq(approvalSteps.id, input.stepId));

        // Update approval status
        await db
          .update(approvals)
          .set({
            status: "rejected",
            rejectionReason: input.rejectionReason,
            completedAt: new Date(),
          })
          .where(eq(approvals.id, input.approvalId));

        // Update the related request status
        const approval = await db
          .select()
          .from(approvals)
          .where(eq(approvals.id, input.approvalId))
          .limit(1);

        if (approval.length) {
          const approvalData = approval[0];
          if (approvalData.requestType === "purchase_order") {
            await db
              .update(purchaseOrders)
              .set({ status: "draft" })
              .where(eq(purchaseOrders.id, approvalData.requestId));
          } else if (approvalData.requestType === "leave_request") {
            await db
              .update(leaves)
              .set({ status: "rejected" })
              .where(eq(leaves.id, approvalData.requestId));
          } else if (approvalData.requestType === "expense_report") {
            await db
              .update(expenses)
              .set({ status: "rejected" })
              .where(eq(expenses.id, approvalData.requestId));
          }
        }

        // Log the action
        await db.insert(approvalAudit).values({
          approvalId: input.approvalId,
          action: "rejected",
          performedBy: ctx.user.id,
          details: { stepId: input.stepId, reason: input.rejectionReason },
          ipAddress: ctx.req.headers["x-forwarded-for"] as string,
        });

        return { status: "rejected" };
      } catch (error) {
        console.error("Error rejecting approval:", error);
        throw error;
      }
    }),

  /**
   * Get approval history for a specific request
   */
  getApprovalHistory: protectedProcedure
    .input(
      z.object({
        requestType: z.enum(["purchase_order", "leave_request", "expense_report"]),
        requestId: z.number(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      try {
        const approval = await db
          .select()
          .from(approvals)
          .where(
            and(
              eq(approvals.requestType, input.requestType),
              eq(approvals.requestId, input.requestId)
            )
          )
          .limit(1);

        if (!approval.length) return null;

        const steps = await db
          .select()
          .from(approvalSteps)
          .where(eq(approvalSteps.approvalId, approval[0].id))
          .orderBy(approvalSteps.stepNumber);

        const audit = await db
          .select()
          .from(approvalAudit)
          .where(eq(approvalAudit.approvalId, approval[0].id))
          .orderBy(desc(approvalAudit.createdAt));

        return {
          approval: approval[0],
          steps,
          audit,
        };
      } catch (error) {
        console.error("Error fetching approval history:", error);
        throw error;
      }
    }),

  /**
   * Get approval statistics for dashboard
   */
  getApprovalStats: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    try {
      // Get pending approvals count
      const pendingCount = await db
        .select()
        .from(approvalSteps)
        .where(
          and(
            eq(approvalSteps.assignedTo, ctx.user.id),
            eq(approvalSteps.status, "pending")
          )
        );

      // Get approval breakdown by type
      const approvalBreakdown = await db
        .select()
        .from(approvals)
        .where(eq(approvals.status, "pending"));

      const breakdown = {
        purchase_orders: approvalBreakdown.filter(
          (a) => a.requestType === "purchase_order"
        ).length,
        leave_requests: approvalBreakdown.filter(
          (a) => a.requestType === "leave_request"
        ).length,
        expense_reports: approvalBreakdown.filter(
          (a) => a.requestType === "expense_report"
        ).length,
      };

      return {
        totalPending: pendingCount.length,
        breakdown,
      };
    } catch (error) {
      console.error("Error fetching approval stats:", error);
      throw error;
    }
  }),
});
