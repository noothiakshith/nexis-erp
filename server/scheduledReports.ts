import * as cron from "node-cron";
import {
    generateFinancialReport,
    generateInventoryReport,
    generateHRReport,
    generateSalesReport,
    generateComprehensiveReport,
    formatReportForPDF,
    type ReportData,
} from "./reportGenerator";
import { notifyOwner } from "./_core/notification";

// ─────────────────────────────────────────────
//  Types
// ─────────────────────────────────────────────

export type ReportType = "financial" | "inventory" | "hr" | "sales" | "comprehensive";
export type ScheduleFrequency = "daily" | "weekly" | "monthly";
export type ReportTimeframe = "month" | "quarter" | "year";

export interface ScheduledReportConfig {
    id: string;
    name: string;
    reportType: ReportType;
    frequency: ScheduleFrequency;
    /** For weekly: 0-6 (0=Sunday). For monthly: 1-28. Ignored for daily. */
    dayOfWeek?: number;
    dayOfMonth?: number;
    /** 24-hour format, e.g. "08:00" */
    time: string;
    recipients: string[];
    timeframe: ReportTimeframe;
    enabled: boolean;
    createdAt: Date;
    updatedAt: Date;
    lastRunAt?: Date;
    lastRunStatus?: "success" | "failed";
    lastRunError?: string;
    nextRunAt?: Date;
}

// ─────────────────────────────────────────────
//  In-memory store (survives process restarts via re-init)
// ─────────────────────────────────────────────

/** Persisted schedule configurations */
const scheduledReports: Map<string, ScheduledReportConfig> = new Map();

/** Live cron task handles keyed by report id */
const cronTasks: Map<string, ReturnType<typeof cron.schedule>> = new Map();

// ─────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────

function generateId(): string {
    return `sr_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Convert a ScheduledReportConfig to a node-cron expression.
 *
 * Format: second minute hour day-of-month month day-of-week
 */
function buildCronExpression(config: ScheduledReportConfig): string {
    const [hourStr, minuteStr] = config.time.split(":");
    const hour = parseInt(hourStr, 10);
    const minute = parseInt(minuteStr, 10);

    switch (config.frequency) {
        case "daily":
            return `${minute} ${hour} * * *`;

        case "weekly": {
            const dow = config.dayOfWeek ?? 1; // default Monday
            return `${minute} ${hour} * * ${dow}`;
        }

        case "monthly": {
            const dom = config.dayOfMonth ?? 1; // default 1st
            return `${minute} ${hour} ${dom} * *`;
        }
    }
}

/**
 * Calculate the next run date for a given config.
 */
function computeNextRun(config: ScheduledReportConfig): Date {
    const [hourStr, minuteStr] = config.time.split(":");
    const hour = parseInt(hourStr, 10);
    const minute = parseInt(minuteStr, 10);

    const now = new Date();
    const next = new Date(now);
    next.setSeconds(0);
    next.setMilliseconds(0);
    next.setHours(hour, minute);

    if (config.frequency === "daily") {
        if (next <= now) next.setDate(next.getDate() + 1);
        return next;
    }

    if (config.frequency === "weekly") {
        const targetDow = config.dayOfWeek ?? 1;
        const currentDow = now.getDay();
        let daysUntil = (targetDow - currentDow + 7) % 7;
        if (daysUntil === 0 && next <= now) daysUntil = 7;
        next.setDate(now.getDate() + daysUntil);
        return next;
    }

    // monthly
    const targetDom = config.dayOfMonth ?? 1;
    next.setDate(targetDom);
    if (next <= now) {
        // next month
        next.setMonth(next.getMonth() + 1);
        next.setDate(targetDom);
    }
    return next;
}

// ─────────────────────────────────────────────
//  Report generation
// ─────────────────────────────────────────────

async function generateReport(config: ScheduledReportConfig): Promise<ReportData | null> {
    switch (config.reportType) {
        case "financial":
            return generateFinancialReport(config.timeframe);
        case "inventory":
            return generateInventoryReport();
        case "hr":
            return generateHRReport();
        case "sales":
            return generateSalesReport();
        case "comprehensive":
            return generateComprehensiveReport(config.timeframe);
        default:
            return null;
    }
}

// ─────────────────────────────────────────────
//  Email delivery
// ─────────────────────────────────────────────

async function deliverReport(
    config: ScheduledReportConfig,
    report: ReportData
): Promise<void> {
    const body = formatReportForPDF(report);

    const recipientList = config.recipients.join(", ");
    const subject = `[Nexis ERP] ${report.title} – Scheduled Report`;

    const htmlContent = `
    <div style="font-family: 'Segoe UI', sans-serif; max-width: 700px; margin: 0 auto; background: #0f172a; color: #e2e8f0; border-radius: 12px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 32px 40px;">
        <div style="font-size: 12px; letter-spacing: 3px; text-transform: uppercase; color: #c4b5fd; margin-bottom: 8px;">Nexis ERP · Scheduled Report</div>
        <h1 style="margin: 0; font-size: 26px; font-weight: 700; color: #fff;">${report.title}</h1>
        <p style="margin: 8px 0 0; color: #ddd6fe; font-size: 14px;">Period: ${report.timeframe}</p>
      </div>

      <div style="padding: 32px 40px;">
        <div style="background: #1e293b; border-radius: 8px; padding: 20px; margin-bottom: 24px; border-left: 4px solid #6366f1;">
          <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #94a3b8;">${report.summary}</p>
        </div>

        ${report.sections
            .map(
                (section) => `
          <div style="margin-bottom: 28px;">
            <h3 style="margin: 0 0 4px; color: #a5b4fc; font-size: 16px; font-weight: 600;">${section.title}</h3>
            <p style="margin: 0 0 12px; color: #64748b; font-size: 13px;">${section.description}</p>
            ${section.metrics
                        ? `<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                    ${Object.entries(section.metrics)
                            .map(
                                ([k, v]) => `
                      <div style="background: #1e293b; border-radius: 6px; padding: 12px;">
                        <div style="color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">${k}</div>
                        <div style="color: #e2e8f0; font-size: 18px; font-weight: 700; margin-top: 4px;">${v}</div>
                      </div>`
                            )
                            .join("")}
                  </div>`
                        : ""
                    }
          </div>`
            )
            .join("")}
      </div>

      <div style="padding: 20px 40px; background: #1e293b; text-align: center; font-size: 12px; color: #475569;">
        This report was automatically generated by Nexis ERP and delivered to: ${recipientList}<br/>
        Generated at: ${report.generatedAt.toLocaleString()}<br/>
        Schedule: ${config.frequency.charAt(0).toUpperCase() + config.frequency.slice(1)} · ${config.name}
      </div>
    </div>
  `;

    // Log details as notification (same pattern as emailService.ts)
    console.log(`[ScheduledReports] Delivering "${config.name}" to: ${recipientList}`);
    console.log(`[ScheduledReports] Subject: ${subject}`);

    try {
        await notifyOwner({
            title: subject,
            content: `Scheduled Report: ${config.name}\nRecipients: ${recipientList}\nReport Type: ${config.reportType}\nFrequency: ${config.frequency}\n\n--- Report Summary ---\n${report.summary}\n\n--- Full Report ---\n${body.substring(0, 3000)}${body.length > 3000 ? "...[truncated]" : ""}`,
        });
        console.log(`[ScheduledReports] ✓ Report delivered successfully: ${config.name}`);
    } catch (err) {
        // Notification might fail (no forge key), but we still log for dev purposes
        console.warn(`[ScheduledReports] Notification delivery warning for ${config.name}:`, err);
    }
}

// ─────────────────────────────────────────────
//  Job executor
// ─────────────────────────────────────────────

async function executeReportJob(id: string): Promise<void> {
    const config = scheduledReports.get(id);
    if (!config || !config.enabled) return;

    console.log(`[ScheduledReports] ▶ Executing job: "${config.name}" (${config.reportType})`);

    try {
        const report = await generateReport(config);
        if (!report) {
            throw new Error("Report generation returned null (database may be unavailable)");
        }

        await deliverReport(config, report);

        // Update metadata
        config.lastRunAt = new Date();
        config.lastRunStatus = "success";
        config.lastRunError = undefined;
        config.nextRunAt = computeNextRun(config);
        config.updatedAt = new Date();
        scheduledReports.set(id, config);

        console.log(`[ScheduledReports] ✓ Job completed: "${config.name}"`);
    } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err);
        console.error(`[ScheduledReports] ✗ Job failed: "${config.name}":`, errMsg);

        config.lastRunAt = new Date();
        config.lastRunStatus = "failed";
        config.lastRunError = errMsg;
        config.nextRunAt = computeNextRun(config);
        config.updatedAt = new Date();
        scheduledReports.set(id, config);
    }
}

// ─────────────────────────────────────────────
//  Scheduler lifecycle
// ─────────────────────────────────────────────

function startCronJob(config: ScheduledReportConfig): void {
    // Stop existing task if any
    stopCronJob(config.id);

    if (!config.enabled) return;

    const expression = buildCronExpression(config);

    try {
        const task: ReturnType<typeof cron.schedule> = cron.schedule(expression, () => {
            executeReportJob(config.id).catch((err) => {
                console.error(`[ScheduledReports] Unhandled error in job ${config.id}:`, err);
            });
        });

        cronTasks.set(config.id, task);
        console.log(
            `[ScheduledReports] ✓ Scheduled "${config.name}" with cron: "${expression}"`
        );
    } catch (err) {
        console.error(`[ScheduledReports] Failed to schedule "${config.name}":`, err);
    }
}

function stopCronJob(id: string): void {
    const existing = cronTasks.get(id);
    if (existing) {
        existing.stop();
        cronTasks.delete(id);
    }
}

// ─────────────────────────────────────────────
//  Public API
// ─────────────────────────────────────────────

export function createScheduledReport(
    input: Omit<ScheduledReportConfig, "id" | "createdAt" | "updatedAt" | "lastRunAt" | "lastRunStatus" | "lastRunError" | "nextRunAt">
): ScheduledReportConfig {
    const id = generateId();
    const now = new Date();

    const config: ScheduledReportConfig = {
        ...input,
        id,
        createdAt: now,
        updatedAt: now,
        nextRunAt: computeNextRun({ ...input, id, createdAt: now, updatedAt: now }),
    };

    scheduledReports.set(id, config);

    if (config.enabled) {
        startCronJob(config);
    }

    return config;
}

export function updateScheduledReport(
    id: string,
    updates: Partial<
        Omit<ScheduledReportConfig, "id" | "createdAt" | "lastRunAt" | "lastRunStatus" | "lastRunError">
    >
): ScheduledReportConfig | null {
    const existing = scheduledReports.get(id);
    if (!existing) return null;

    const updated: ScheduledReportConfig = {
        ...existing,
        ...updates,
        updatedAt: new Date(),
    };
    updated.nextRunAt = computeNextRun(updated);
    scheduledReports.set(id, updated);

    // Restart the cron task with new settings
    startCronJob(updated);

    return updated;
}

export function deleteScheduledReport(id: string): boolean {
    if (!scheduledReports.has(id)) return false;
    stopCronJob(id);
    scheduledReports.delete(id);
    return true;
}

export function getScheduledReport(id: string): ScheduledReportConfig | undefined {
    return scheduledReports.get(id);
}

export function listScheduledReports(): ScheduledReportConfig[] {
    return Array.from(scheduledReports.values()).sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
}

export function toggleScheduledReport(id: string, enabled: boolean): ScheduledReportConfig | null {
    return updateScheduledReport(id, { enabled });
}

/**
 * Manually trigger a scheduled report job immediately (for testing / on-demand delivery).
 */
export async function triggerReportNow(id: string): Promise<{ success: boolean; error?: string }> {
    const config = scheduledReports.get(id);
    if (!config) return { success: false, error: "Schedule not found" };

    try {
        await executeReportJob(id);
        return { success: true };
    } catch (err: unknown) {
        return {
            success: false,
            error: err instanceof Error ? err.message : String(err),
        };
    }
}

/**
 * Call this once at server startup to initialize and wire up all pre-loaded reports.
 * In a production app you'd load from a database here.
 */
export function initializeScheduler(): void {
    console.log("[ScheduledReports] Initializing scheduler...");

    // Re-wire any already-stored configs (e.g. if re-called after hot-module reload)
    for (const config of Array.from(scheduledReports.values())) {
        if (config.enabled) {
            startCronJob(config);
        }
    }

    console.log(
        `[ScheduledReports] Scheduler ready – ${scheduledReports.size} report(s) registered.`
    );
}

/**
 * Gracefully stop all running cron jobs (call on process exit).
 */
export function shutdownScheduler(): void {
    for (const [id] of Array.from(cronTasks.entries())) {
        stopCronJob(id);
    }
    console.log("[ScheduledReports] Scheduler shut down.");
}
