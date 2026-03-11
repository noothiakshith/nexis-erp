import { describe, expect, it, beforeEach } from "vitest";
import { appRouter } from "../routers";
import type { TrpcContext } from "../_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(userId: number = 1, role: "admin" | "manager" | "employee" = "manager"): TrpcContext {
  const user: AuthenticatedUser = {
    id: userId,
    openId: `user-${userId}`,
    email: `user${userId}@example.com`,
    name: `Test User ${userId}`,
    phone: null,
    department: null,
    loginMethod: "google",
    role,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {
        "x-forwarded-for": "127.0.0.1",
      },
    } as any,
    res: {
      clearCookie: () => {},
    } as any,
  };
}

describe("Approval Workflows", () => {
  describe("approvals.createApproval", () => {
    it("creates a new approval workflow with steps", async () => {
      const ctx = createAuthContext(1, "manager");
      const caller = appRouter.createCaller(ctx);

      const result = await caller.approvals.createApproval({
        requestType: "expense_report",
        requestId: 1,
        approvalSteps: [
          {
            stepNumber: 1,
            approverRole: "department_manager",
            assignedTo: 2,
          },
          {
            stepNumber: 2,
            approverRole: "finance_manager",
            assignedTo: 3,
          },
        ],
      });

      expect(result).toBeDefined();
      expect(result.status).toBe("created");
      expect(result.approvalId).toBeDefined();
    });

    it("creates purchase order approval workflow", async () => {
      const ctx = createAuthContext(1, "employee");
      const caller = appRouter.createCaller(ctx);

      const result = await caller.approvals.createApproval({
        requestType: "purchase_order",
        requestId: 1,
        approvalSteps: [
          {
            stepNumber: 1,
            approverRole: "department_manager",
            assignedTo: 2,
          },
          {
            stepNumber: 2,
            approverRole: "finance_manager",
            assignedTo: 3,
          },
          {
            stepNumber: 3,
            approverRole: "executive",
            assignedTo: 4,
          },
        ],
      });

      expect(result).toBeDefined();
      expect(result.status).toBe("created");
    });

    it("creates leave request approval workflow", async () => {
      const ctx = createAuthContext(1, "employee");
      const caller = appRouter.createCaller(ctx);

      const result = await caller.approvals.createApproval({
        requestType: "leave_request",
        requestId: 1,
        approvalSteps: [
          {
            stepNumber: 1,
            approverRole: "direct_manager",
            assignedTo: 2,
          },
          {
            stepNumber: 2,
            approverRole: "hr_manager",
            assignedTo: 3,
          },
        ],
      });

      expect(result).toBeDefined();
      expect(result.status).toBe("created");
    });
  });

  describe("approvals.getPendingApprovals", () => {
    it("returns pending approvals for the current user", async () => {
      const ctx = createAuthContext(2, "manager"); // User who might have pending approvals
      const caller = appRouter.createCaller(ctx);

      const result = await caller.approvals.getPendingApprovals();

      expect(Array.isArray(result)).toBe(true);
      // Each approval should have the required fields
      result.forEach((approval) => {
        expect(approval).toHaveProperty("approvalId");
        expect(approval).toHaveProperty("stepId");
        expect(approval).toHaveProperty("requestType");
        expect(approval).toHaveProperty("requestId");
        expect(approval).toHaveProperty("stepNumber");
        expect(approval).toHaveProperty("totalSteps");
      });
    });
  });

  describe("approvals.getApprovalDetails", () => {
    it("returns approval details with steps and audit log", async () => {
      const ctx = createAuthContext(1, "manager");
      const caller = appRouter.createCaller(ctx);

      // First create an approval
      const createResult = await caller.approvals.createApproval({
        requestType: "expense_report",
        requestId: 1,
        approvalSteps: [
          {
            stepNumber: 1,
            approverRole: "department_manager",
            assignedTo: 2,
          },
        ],
      });

      // Then get its details
      const result = await caller.approvals.getApprovalDetails({
        approvalId: createResult.approvalId,
      });

      expect(result).toBeDefined();
      expect(result.approval).toBeDefined();
      expect(result.steps).toBeDefined();
      expect(result.audit).toBeDefined();
      expect(Array.isArray(result.steps)).toBe(true);
      expect(Array.isArray(result.audit)).toBe(true);
    });
  });

  describe("approvals.approveStep", () => {
    it("approves a step and moves workflow forward", async () => {
      const ctx = createAuthContext(2, "manager"); // Approver
      const caller = appRouter.createCaller(ctx);

      // First create an approval as another user
      const requesterCtx = createAuthContext(1, "employee");
      const requesterCaller = appRouter.createCaller(requesterCtx);

      const createResult = await requesterCaller.approvals.createApproval({
        requestType: "expense_report",
        requestId: 1,
        approvalSteps: [
          {
            stepNumber: 1,
            approverRole: "department_manager",
            assignedTo: 2, // Assigned to our approver
          },
        ],
      });

      // Get the step ID
      const details = await caller.approvals.getApprovalDetails({
        approvalId: createResult.approvalId,
      });

      const stepToApprove = details.steps.find((s) => s.assignedTo === 2);
      expect(stepToApprove).toBeDefined();

      // Approve the step
      const result = await caller.approvals.approveStep({
        approvalId: createResult.approvalId,
        stepId: stepToApprove!.id,
        comments: "Looks good to me!",
      });

      expect(result).toBeDefined();
      expect(result.status).toBe("approved");
    });

    it("completes workflow when all steps are approved", async () => {
      const ctx = createAuthContext(2, "manager");
      const caller = appRouter.createCaller(ctx);

      // Create single-step approval
      const requesterCtx = createAuthContext(1, "employee");
      const requesterCaller = appRouter.createCaller(requesterCtx);

      const createResult = await requesterCaller.approvals.createApproval({
        requestType: "expense_report",
        requestId: 1,
        approvalSteps: [
          {
            stepNumber: 1,
            approverRole: "department_manager",
            assignedTo: 2,
          },
        ],
      });

      const details = await caller.approvals.getApprovalDetails({
        approvalId: createResult.approvalId,
      });

      const stepToApprove = details.steps[0];

      const result = await caller.approvals.approveStep({
        approvalId: createResult.approvalId,
        stepId: stepToApprove.id,
        comments: "Final approval",
      });

      expect(result.allApproved).toBe(true);
    });
  });

  describe("approvals.rejectApproval", () => {
    it("rejects an approval with reason", async () => {
      const ctx = createAuthContext(2, "manager");
      const caller = appRouter.createCaller(ctx);

      // Create approval
      const requesterCtx = createAuthContext(1, "employee");
      const requesterCaller = appRouter.createCaller(requesterCtx);

      const createResult = await requesterCaller.approvals.createApproval({
        requestType: "expense_report",
        requestId: 1,
        approvalSteps: [
          {
            stepNumber: 1,
            approverRole: "department_manager",
            assignedTo: 2,
          },
        ],
      });

      const details = await caller.approvals.getApprovalDetails({
        approvalId: createResult.approvalId,
      });

      const stepToReject = details.steps[0];

      const result = await caller.approvals.rejectApproval({
        approvalId: createResult.approvalId,
        stepId: stepToReject.id,
        rejectionReason: "Insufficient documentation provided",
      });

      expect(result).toBeDefined();
      expect(result.status).toBe("rejected");
    });
  });

  describe("approvals.getApprovalHistory", () => {
    it("returns approval history for a specific request", async () => {
      const ctx = createAuthContext(1, "manager");
      const caller = appRouter.createCaller(ctx);

      const result = await caller.approvals.getApprovalHistory({
        requestType: "expense_report",
        requestId: 1,
      });

      // Should return null if no approval exists, or approval data if it does
      expect(result === null || typeof result === "object").toBe(true);
    });
  });

  describe("approvals.getApprovalStats", () => {
    it("returns approval statistics for dashboard", async () => {
      const ctx = createAuthContext(2, "manager");
      const caller = appRouter.createCaller(ctx);

      const result = await caller.approvals.getApprovalStats();

      expect(result).toBeDefined();
      expect(result).toHaveProperty("totalPending");
      expect(result).toHaveProperty("history");
      expect(result).toHaveProperty("breakdown");
      expect(typeof result.totalPending).toBe("number");
      expect(typeof result.history).toBe("number");
      expect(typeof result.breakdown).toBe("object");
    });

    it("returns correct breakdown by request type", async () => {
      const ctx = createAuthContext(2, "manager");
      const caller = appRouter.createCaller(ctx);

      const result = await caller.approvals.getApprovalStats();

      expect(result.breakdown).toHaveProperty("purchase_orders");
      expect(result.breakdown).toHaveProperty("leave_requests");
      expect(result.breakdown).toHaveProperty("expense_reports");
      expect(typeof result.breakdown.purchase_orders).toBe("number");
      expect(typeof result.breakdown.leave_requests).toBe("number");
      expect(typeof result.breakdown.expense_reports).toBe("number");
    });
  });

  describe("Multi-step approval workflow", () => {
    it("handles complex multi-step approval process", async () => {
      const requesterCtx = createAuthContext(1, "employee");
      const manager1Ctx = createAuthContext(2, "manager");
      const manager2Ctx = createAuthContext(3, "manager");
      const adminCtx = createAuthContext(4, "admin");

      const requesterCaller = appRouter.createCaller(requesterCtx);
      const manager1Caller = appRouter.createCaller(manager1Ctx);
      const manager2Caller = appRouter.createCaller(manager2Ctx);
      const adminCaller = appRouter.createCaller(adminCtx);

      // Create 3-step approval
      const createResult = await requesterCaller.approvals.createApproval({
        requestType: "purchase_order",
        requestId: 1,
        approvalSteps: [
          {
            stepNumber: 1,
            approverRole: "department_manager",
            assignedTo: 2,
          },
          {
            stepNumber: 2,
            approverRole: "finance_manager",
            assignedTo: 3,
          },
          {
            stepNumber: 3,
            approverRole: "executive",
            assignedTo: 4,
          },
        ],
      });

      // Get initial details
      let details = await manager1Caller.approvals.getApprovalDetails({
        approvalId: createResult.approvalId,
      });

      expect(details.approval.status).toBe("pending");
      expect(details.approval.currentStep).toBe(1);

      // Step 1: Department manager approves
      const step1 = details.steps.find((s) => s.stepNumber === 1);
      await manager1Caller.approvals.approveStep({
        approvalId: createResult.approvalId,
        stepId: step1!.id,
        comments: "Department approval granted",
      });

      // Step 2: Finance manager approves
      details = await manager2Caller.approvals.getApprovalDetails({
        approvalId: createResult.approvalId,
      });
      const step2 = details.steps.find((s) => s.stepNumber === 2);
      await manager2Caller.approvals.approveStep({
        approvalId: createResult.approvalId,
        stepId: step2!.id,
        comments: "Finance approval granted",
      });

      // Step 3: Executive approves (final step)
      details = await adminCaller.approvals.getApprovalDetails({
        approvalId: createResult.approvalId,
      });
      const step3 = details.steps.find((s) => s.stepNumber === 3);
      const finalResult = await adminCaller.approvals.approveStep({
        approvalId: createResult.approvalId,
        stepId: step3!.id,
        comments: "Executive approval granted",
      });

      expect(finalResult.allApproved).toBe(true);

      // Verify final status
      const finalDetails = await adminCaller.approvals.getApprovalDetails({
        approvalId: createResult.approvalId,
      });
      expect(finalDetails.approval.status).toBe("approved");
    });

    it("stops workflow when step is rejected", async () => {
      const requesterCtx = createAuthContext(1, "employee");
      const manager1Ctx = createAuthContext(2, "manager");

      const requesterCaller = appRouter.createCaller(requesterCtx);
      const manager1Caller = appRouter.createCaller(manager1Ctx);

      // Create multi-step approval
      const createResult = await requesterCaller.approvals.createApproval({
        requestType: "purchase_order",
        requestId: 1,
        approvalSteps: [
          {
            stepNumber: 1,
            approverRole: "department_manager",
            assignedTo: 2,
          },
          {
            stepNumber: 2,
            approverRole: "finance_manager",
            assignedTo: 3,
          },
        ],
      });

      // Reject at first step
      const details = await manager1Caller.approvals.getApprovalDetails({
        approvalId: createResult.approvalId,
      });

      const step1 = details.steps.find((s) => s.stepNumber === 1);
      await manager1Caller.approvals.rejectApproval({
        approvalId: createResult.approvalId,
        stepId: step1!.id,
        rejectionReason: "Budget not approved for this purchase",
      });

      // Verify workflow is rejected
      const finalDetails = await manager1Caller.approvals.getApprovalDetails({
        approvalId: createResult.approvalId,
      });
      expect(finalDetails.approval.status).toBe("rejected");
      expect(finalDetails.approval.rejectionReason).toBe("Budget not approved for this purchase");
    });
  });
});