import { getDb } from "../db";
import { employees, users, approvalSteps } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";

/**
 * Approval workflow rules engine
 * Defines routing logic for different types of approval requests
 */

export interface ApprovalStep {
  stepNumber: number;
  approverRole: string;
  assignedTo?: number;
  requiredCondition?: (data: any) => boolean;
}

export interface ApprovalRule {
  requestType: "purchase_order" | "leave_request" | "expense_report";
  steps: ApprovalStep[];
  conditions?: (data: any) => boolean;
}

/**
 * Default approval rules configuration
 */
const approvalRules: ApprovalRule[] = [
  // Purchase Order Approval Rules
  {
    requestType: "purchase_order",
    steps: [
      {
        stepNumber: 1,
        approverRole: "department_manager",
        requiredCondition: (data) => data.totalAmount > 0,
      },
      {
        stepNumber: 2,
        approverRole: "finance_manager",
        requiredCondition: (data) => data.totalAmount > 1000,
      },
      {
        stepNumber: 3,
        approverRole: "executive",
        requiredCondition: (data) => data.totalAmount > 10000,
      },
    ],
  },
  // Leave Request Approval Rules
  {
    requestType: "leave_request",
    steps: [
      {
        stepNumber: 1,
        approverRole: "direct_manager",
        requiredCondition: () => true, // Always required
      },
      {
        stepNumber: 2,
        approverRole: "hr_manager",
        requiredCondition: (data) => {
          // Require HR approval for extended leave (>5 days) or special leave types
          const daysDiff = Math.ceil(
            (new Date(data.endDate).getTime() - new Date(data.startDate).getTime()) / 
            (1000 * 60 * 60 * 24)
          );
          return daysDiff > 5 || ["sick", "maternity", "paternity", "medical"].includes(data.leaveType?.toLowerCase());
        },
      },
      {
        stepNumber: 3,
        approverRole: "executive",
        requiredCondition: (data) => {
          // Executive approval for very long leave (>15 days)
          const daysDiff = Math.ceil(
            (new Date(data.endDate).getTime() - new Date(data.startDate).getTime()) / 
            (1000 * 60 * 60 * 24)
          );
          return daysDiff > 15;
        },
      },
    ],
  },
  // Expense Report Approval Rules
  {
    requestType: "expense_report",
    steps: [
      {
        stepNumber: 1,
        approverRole: "department_manager",
        requiredCondition: (data) => data.totalAmount > 0,
      },
      {
        stepNumber: 2,
        approverRole: "finance_manager",
        requiredCondition: (data) => data.totalAmount > 500,
      },
      {
        stepNumber: 3,
        approverRole: "executive",
        requiredCondition: (data) => data.totalAmount > 5000,
      },
    ],
  },
];

/**
 * Get approval workflow steps for a specific request type and data
 */
export async function getApprovalWorkflow(
  requestType: "purchase_order" | "leave_request" | "expense_report",
  requestData: any,
  requestorId: number
): Promise<ApprovalStep[]> {
  const rule = approvalRules.find((r) => r.requestType === requestType);
  if (!rule) {
    throw new Error(`No approval rule found for request type: ${requestType}`);
  }

  // Filter steps based on conditions
  const applicableSteps = rule.steps.filter((step) => {
    if (!step.requiredCondition) return true;
    return step.requiredCondition(requestData);
  });

  // Assign approvers based on roles
  const stepsWithApprovers = await Promise.all(
    applicableSteps.map(async (step) => {
      const assignedTo = await findApproverByRole(step.approverRole, requestorId, requestData);
      return {
        ...step,
        assignedTo,
      };
    })
  );

  // Re-number steps sequentially
  return stepsWithApprovers.map((step, index) => ({
    ...step,
    stepNumber: index + 1,
  }));
}

/**
 * Find the appropriate approver based on role and context
 */
async function findApproverByRole(
  role: string,
  requestorId: number,
  requestData: any
): Promise<number | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  try {
    switch (role) {
      case "direct_manager":
      case "department_manager": {
        // Find the requestor's reporting manager
        const employee = await db
          .select()
          .from(employees)
          .where(eq(employees.userId, requestorId))
          .limit(1);

        if (employee.length && employee[0].reportingManager) {
          return employee[0].reportingManager;
        }

        // Fallback: Find any manager in the same department
        const departmentManager = await db
          .select()
          .from(employees)
          .leftJoin(users, eq(employees.userId, users.id))
          .where(eq(employees.department, employee[0]?.department || "General"))
          .limit(1);

        return departmentManager[0]?.users?.id;
      }

      case "finance_manager": {
        // Find users with finance manager role
        const financeManager = await db
          .select()
          .from(users)
          .where(eq(users.role, "manager"))
          .leftJoin(employees, eq(users.id, employees.userId))
          .limit(1);

        // Filter by finance department if available
        const financeUser = financeManager.find(
          (u) => u.employees?.department?.toLowerCase().includes("finance")
        );

        return financeUser?.users?.id || financeManager[0]?.users?.id;
      }

      case "hr_manager": {
        // Find HR manager
        const hrManager = await db
          .select()
          .from(users)
          .where(eq(users.role, "manager"))
          .leftJoin(employees, eq(users.id, employees.userId))
          .limit(1);

        // Filter by HR department if available
        const hrUser = hrManager.find(
          (u) => u.employees?.department?.toLowerCase().includes("hr") ||
                 u.employees?.department?.toLowerCase().includes("human")
        );

        return hrUser?.users?.id || hrManager[0]?.users?.id;
      }

      case "executive": {
        // Find admin users (executives)
        const executive = await db
          .select()
          .from(users)
          .where(eq(users.role, "admin"))
          .limit(1);

        return executive[0]?.id;
      }

      default:
        console.warn(`Unknown approver role: ${role}`);
        return undefined;
    }
  } catch (error) {
    console.error(`Error finding approver for role ${role}:`, error);
    return undefined;
  }
}

/**
 * Validate if a user can approve a specific step
 */
export async function canUserApprove(
  userId: number,
  approvalId: number,
  stepNumber: number
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    // Check if user is assigned to this step
    const step = await db
      .select()
      .from(approvalSteps)
      .where(
        and(
          eq(approvalSteps.approvalId, approvalId),
          eq(approvalSteps.stepNumber, stepNumber),
          eq(approvalSteps.assignedTo, userId),
          eq(approvalSteps.status, "pending")
        )
      )
      .limit(1);

    return step.length > 0;
  } catch (error) {
    console.error("Error checking approval permissions:", error);
    return false;
  }
}

/**
 * Get next required approval step
 */
export async function getNextApprovalStep(approvalId: number): Promise<ApprovalStep | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    const nextStep = await db
      .select()
      .from(approvalSteps)
      .where(
        and(
          eq(approvalSteps.approvalId, approvalId),
          eq(approvalSteps.status, "pending")
        )
      )
      .orderBy(approvalSteps.stepNumber)
      .limit(1);

    if (!nextStep.length) return null;

    return {
      stepNumber: nextStep[0].stepNumber,
      approverRole: nextStep[0].approverRole,
      assignedTo: nextStep[0].assignedTo || undefined,
    };
  } catch (error) {
    console.error("Error getting next approval step:", error);
    return null;
  }
}

/**
 * Check if approval workflow is complete
 */
export async function isApprovalComplete(approvalId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  try {
    const pendingSteps = await db
      .select()
      .from(approvalSteps)
      .where(
        and(
          eq(approvalSteps.approvalId, approvalId),
          eq(approvalSteps.status, "pending")
        )
      );

    return pendingSteps.length === 0;
  } catch (error) {
    console.error("Error checking approval completion:", error);
    return false;
  }
}

/**
 * Custom approval rules for specific scenarios
 */
export const customApprovalRules = {
  /**
   * Emergency purchase order approval (expedited process)
   */
  emergencyPurchaseOrder: (data: any): ApprovalStep[] => [
    {
      stepNumber: 1,
      approverRole: "executive",
      requiredCondition: () => true,
    },
  ],

  /**
   * Sick leave approval (simplified process)
   */
  sickLeaveApproval: (data: any): ApprovalStep[] => [
    {
      stepNumber: 1,
      approverRole: "direct_manager",
      requiredCondition: () => true,
    },
  ],

  /**
   * Small expense approval (under $100)
   */
  smallExpenseApproval: (data: any): ApprovalStep[] => [
    {
      stepNumber: 1,
      approverRole: "department_manager",
      requiredCondition: () => data.totalAmount < 100,
    },
  ],
};