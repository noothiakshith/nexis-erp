import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
    createScheduledReport,
    updateScheduledReport,
    deleteScheduledReport,
    getScheduledReport,
    listScheduledReports,
    toggleScheduledReport,
    triggerReportNow,
} from "../scheduledReports";

// ─────────────────────────────────────────────
//  Zod schemas
// ─────────────────────────────────────────────

const reportTypeEnum = z.enum(["financial", "inventory", "hr", "sales", "comprehensive"]);
const frequencyEnum = z.enum(["daily", "weekly", "monthly"]);
const timeframeEnum = z.enum(["month", "quarter", "year"]);

const scheduleInputSchema = z.object({
    name: z.string().min(1, "Name is required").max(100),
    reportType: reportTypeEnum,
    frequency: frequencyEnum,
    dayOfWeek: z.number().min(0).max(6).optional(),
    dayOfMonth: z.number().min(1).max(28).optional(),
    time: z
        .string()
        .regex(/^\d{2}:\d{2}$/, "Time must be in HH:MM format"),
    recipients: z.array(z.string().email()).min(1, "At least one recipient required"),
    timeframe: timeframeEnum,
    enabled: z.boolean().default(true),
});

// ─────────────────────────────────────────────
//  Router
// ─────────────────────────────────────────────

export const scheduledReportsRouter = router({
    /**
     * List all scheduled report configurations.
     */
    list: protectedProcedure.query(() => {
        return listScheduledReports();
    }),

    /**
     * Get a single scheduled report by ID.
     */
    get: protectedProcedure
        .input(z.object({ id: z.string() }))
        .query(({ input }) => {
            const report = getScheduledReport(input.id);
            if (!report) throw new Error("Scheduled report not found");
            return report;
        }),

    /**
     * Create a new scheduled report.
     */
    create: protectedProcedure
        .input(scheduleInputSchema)
        .mutation(({ input }) => {
            return createScheduledReport({
                name: input.name,
                reportType: input.reportType,
                frequency: input.frequency,
                dayOfWeek: input.dayOfWeek,
                dayOfMonth: input.dayOfMonth,
                time: input.time,
                recipients: input.recipients,
                timeframe: input.timeframe,
                enabled: input.enabled,
            });
        }),

    /**
     * Update an existing scheduled report.
     */
    update: protectedProcedure
        .input(
            z.object({
                id: z.string(),
                data: scheduleInputSchema.partial(),
            })
        )
        .mutation(({ input }) => {
            const updated = updateScheduledReport(input.id, input.data);
            if (!updated) throw new Error("Scheduled report not found");
            return updated;
        }),

    /**
     * Delete a scheduled report and stop its cron job.
     */
    delete: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(({ input }) => {
            const deleted = deleteScheduledReport(input.id);
            if (!deleted) throw new Error("Scheduled report not found");
            return { success: true };
        }),

    /**
     * Enable or disable a scheduled report.
     */
    toggle: protectedProcedure
        .input(z.object({ id: z.string(), enabled: z.boolean() }))
        .mutation(({ input }) => {
            const updated = toggleScheduledReport(input.id, input.enabled);
            if (!updated) throw new Error("Scheduled report not found");
            return updated;
        }),

    /**
     * Manually trigger a report run immediately for testing.
     */
    triggerNow: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ input }) => {
            return triggerReportNow(input.id);
        }),
});
