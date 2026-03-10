import { notifyOwner } from "./notification";

/**
 * Email notification templates for approval workflows
 */
const emailTemplates = {
  po_pending_approval: {
    subject: "Purchase Order Pending Your Approval",
    template: (data: any) => `
      <h2>Purchase Order Approval Request</h2>
      <p>A new purchase order requires your approval:</p>
      <ul>
        <li><strong>PO Number:</strong> ${data.poNumber}</li>
        <li><strong>Supplier:</strong> ${data.supplierName}</li>
        <li><strong>Amount:</strong> $${data.totalAmount}</li>
        <li><strong>Submitted by:</strong> ${data.requestorName}</li>
        <li><strong>Date:</strong> ${new Date(data.createdAt).toLocaleDateString()}</li>
      </ul>
      <p><a href="${data.approvalUrl}">Review and Approve</a></p>
    `,
  },
  leave_pending_approval: {
    subject: "Leave Request Pending Your Approval",
    template: (data: any) => `
      <h2>Leave Request Approval</h2>
      <p>A leave request requires your approval:</p>
      <ul>
        <li><strong>Employee:</strong> ${data.employeeName}</li>
        <li><strong>Leave Type:</strong> ${data.leaveType}</li>
        <li><strong>Start Date:</strong> ${new Date(data.startDate).toLocaleDateString()}</li>
        <li><strong>End Date:</strong> ${new Date(data.endDate).toLocaleDateString()}</li>
        <li><strong>Reason:</strong> ${data.reason}</li>
      </ul>
      <p><a href="${data.approvalUrl}">Review and Approve</a></p>
    `,
  },
  expense_pending_approval: {
    subject: "Expense Report Pending Your Approval",
    template: (data: any) => `
      <h2>Expense Report Approval Request</h2>
      <p>An expense report requires your approval:</p>
      <ul>
        <li><strong>Employee:</strong> ${data.employeeName}</li>
        <li><strong>Amount:</strong> $${data.totalAmount}</li>
        <li><strong>Description:</strong> ${data.description}</li>
        <li><strong>Date:</strong> ${new Date(data.createdAt).toLocaleDateString()}</li>
      </ul>
      <p><a href="${data.approvalUrl}">Review and Approve</a></p>
    `,
  },
  approval_approved: {
    subject: "Your Request Has Been Approved",
    template: (data: any) => `
      <h2>Approval Confirmed</h2>
      <p>Your ${data.requestType} has been approved!</p>
      <ul>
        <li><strong>Request ID:</strong> ${data.requestId}</li>
        <li><strong>Approved by:</strong> ${data.approverName}</li>
        <li><strong>Date:</strong> ${new Date(data.approvedAt).toLocaleDateString()}</li>
      </ul>
      <p>Thank you for your submission.</p>
    `,
  },
  approval_rejected: {
    subject: "Your Request Requires Revision",
    template: (data: any) => `
      <h2>Request Needs Revision</h2>
      <p>Your ${data.requestType} was not approved and requires revision:</p>
      <ul>
        <li><strong>Request ID:</strong> ${data.requestId}</li>
        <li><strong>Reviewed by:</strong> ${data.approverName}</li>
        <li><strong>Reason:</strong> ${data.rejectionReason}</li>
      </ul>
      <p><a href="${data.revisionUrl}">Submit Revision</a></p>
    `,
  },
};

type EmailTemplate = keyof typeof emailTemplates;

interface EmailData {
  to: string;
  template: EmailTemplate;
  data: Record<string, any>;
}

/**
 * Send email notification for approval workflows
 * Uses the built-in notification system with email templates
 */
export async function sendApprovalEmail(emailData: EmailData): Promise<boolean> {
  try {
    const templateConfig = emailTemplates[emailData.template];
    if (!templateConfig) {
      console.error(`Unknown email template: ${emailData.template}`);
      return false;
    }

    const subject = templateConfig.subject;
    const htmlContent = templateConfig.template(emailData.data);

    // Log the email for tracking
    console.log(`[Email] Sending ${emailData.template} to ${emailData.to}`);

    // In production, integrate with email service (SendGrid, AWS SES, etc.)
    // For now, use the notification system
    const success = await notifyOwner({
      title: subject,
      content: `Email sent to ${emailData.to}\n\n${htmlContent}`,
    });

    return success;
  } catch (error) {
    console.error("[Email Service] Error sending email:", error);
    return false;
  }
}

/**
 * Send bulk approval emails to multiple approvers
 */
export async function sendBulkApprovalEmails(
  emails: EmailData[]
): Promise<Map<string, boolean>> {
  const results = new Map<string, boolean>();

  for (const email of emails) {
    const success = await sendApprovalEmail(email);
    results.set(email.to, success);
  }

  return results;
}

/**
 * Retry failed email deliveries
 */
export async function retryFailedEmails(
  failedEmails: EmailData[],
  maxRetries: number = 3
): Promise<Map<string, boolean>> {
  const results = new Map<string, boolean>();

  for (const email of failedEmails) {
    let success = false;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        success = await sendApprovalEmail(email);
        if (success) break;
        // Exponential backoff
        await new Promise((resolve) =>
          setTimeout(resolve, Math.pow(2, attempt) * 1000)
        );
      } catch (error) {
        console.error(
          `[Email Service] Retry ${attempt} failed for ${email.to}:`,
          error
        );
      }
    }
    results.set(email.to, success);
  }

  return results;
}
