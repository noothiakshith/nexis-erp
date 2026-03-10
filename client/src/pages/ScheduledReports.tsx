import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { trpc } from "@/lib/trpc";
import { ERPDashboardLayout } from "@/components/ERPDashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
    CalendarClock,
    Mail,
    Plus,
    Trash2,
    PlayCircle,
    Pencil,
    Clock,
    CheckCircle2,
    XCircle,
    FileText,
    BarChart3,
    Users,
    TrendingUp,
    Layers,
    Loader2,
    AlertCircle,
    Calendar,
} from "lucide-react";

// ─────────────────────────────────────────────
//  Form schema (matching server-side zod schema)
// ─────────────────────────────────────────────

const formSchema = z.object({
    name: z.string().min(1, "Name is required"),
    reportType: z.enum(["financial", "inventory", "hr", "sales", "comprehensive"]),
    frequency: z.enum(["daily", "weekly", "monthly"]),
    dayOfWeek: z.number().min(0).max(6).optional(),
    dayOfMonth: z.number().min(1).max(28).optional(),
    time: z.string().regex(/^\d{2}:\d{2}$/, "Must be HH:MM"),
    recipients: z.string().min(1, "At least one recipient required"),
    timeframe: z.enum(["month", "quarter", "year"]),
    enabled: z.boolean(),
});

type FormData = z.infer<typeof formSchema>;

// ─────────────────────────────────────────────
//  Constants
// ─────────────────────────────────────────────

const REPORT_TYPE_META = {
    financial: { label: "Financial", icon: BarChart3, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
    inventory: { label: "Inventory", icon: Layers, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
    hr: { label: "Human Resources", icon: Users, color: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/20" },
    sales: { label: "Sales", icon: TrendingUp, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
    comprehensive: { label: "Comprehensive", icon: FileText, color: "text-rose-400", bg: "bg-rose-500/10 border-rose-500/20" },
} as const;

const FREQUENCY_LABELS = { daily: "Daily", weekly: "Weekly", monthly: "Monthly" };

const DAYS_OF_WEEK = [
    { value: "0", label: "Sunday" },
    { value: "1", label: "Monday" },
    { value: "2", label: "Tuesday" },
    { value: "3", label: "Wednesday" },
    { value: "4", label: "Thursday" },
    { value: "5", label: "Friday" },
    { value: "6", label: "Saturday" },
];

// ─────────────────────────────────────────────
//  Sub-components
// ─────────────────────────────────────────────

type ScheduledReport = {
    id: string;
    name: string;
    reportType: "financial" | "inventory" | "hr" | "sales" | "comprehensive";
    frequency: "daily" | "weekly" | "monthly";
    dayOfWeek?: number;
    dayOfMonth?: number;
    time: string;
    recipients: string[];
    timeframe: "month" | "quarter" | "year";
    enabled: boolean;
    createdAt: Date;
    updatedAt: Date;
    lastRunAt?: Date;
    lastRunStatus?: "success" | "failed";
    lastRunError?: string;
    nextRunAt?: Date;
};

function StatusBadge({ status }: { status?: "success" | "failed" }) {
    if (!status) return <Badge variant="outline" className="text-slate-400 border-slate-600">Never run</Badge>;
    if (status === "success") return (
        <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 border">
            <CheckCircle2 className="w-3 h-3 mr-1" /> Success
        </Badge>
    );
    return (
        <Badge className="bg-red-500/15 text-red-400 border-red-500/30 border">
            <XCircle className="w-3 h-3 mr-1" /> Failed
        </Badge>
    );
}

function FrequencyBadge({ frequency, dayOfWeek, dayOfMonth, time }: {
    frequency: string; dayOfWeek?: number; dayOfMonth?: number; time: string;
}) {
    let detail = "";
    if (frequency === "weekly" && dayOfWeek !== undefined) {
        detail = ` · ${DAYS_OF_WEEK[dayOfWeek]?.label || "Mon"}`;
    } else if (frequency === "monthly" && dayOfMonth !== undefined) {
        detail = ` · Day ${dayOfMonth}`;
    }
    return (
        <span className="text-xs text-slate-400 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {FREQUENCY_LABELS[frequency as keyof typeof FREQUENCY_LABELS]}{detail} at {time}
        </span>
    );
}

function ReportCard({
    report,
    onEdit,
    onDelete,
    onToggle,
    onTrigger,
    isTriggering,
}: {
    report: ScheduledReport;
    onEdit: (r: ScheduledReport) => void;
    onDelete: (id: string) => void;
    onToggle: (id: string, enabled: boolean) => void;
    onTrigger: (id: string) => void;
    isTriggering: boolean;
}) {
    const meta = REPORT_TYPE_META[report.reportType];
    const Icon = meta.icon;

    return (
        <Card className={`border transition-all duration-200 hover:shadow-lg hover:shadow-black/20 ${report.enabled
            ? "bg-slate-800/60 border-slate-700/50 hover:border-slate-600"
            : "bg-slate-800/30 border-slate-700/30 opacity-60"
            }`}>
            <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                    {/* Icon + Name */}
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 border ${meta.bg}`}>
                            <Icon className={`w-5 h-5 ${meta.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-semibold text-slate-100 truncate">{report.name}</h3>
                                <Badge variant="outline" className={`text-xs ${meta.color} border-current/30`}>
                                    {meta.label}
                                </Badge>
                            </div>
                            <FrequencyBadge
                                frequency={report.frequency}
                                dayOfWeek={report.dayOfWeek}
                                dayOfMonth={report.dayOfMonth}
                                time={report.time}
                            />
                        </div>
                    </div>

                    {/* Toggle */}
                    <Switch
                        id={`toggle-${report.id}`}
                        checked={report.enabled}
                        onCheckedChange={(checked) => onToggle(report.id, checked)}
                        className="flex-shrink-0"
                    />
                </div>

                {/* Recipients */}
                <div className="mt-4 flex items-center gap-2 flex-wrap">
                    <Mail className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                    <div className="flex flex-wrap gap-1">
                        {report.recipients.slice(0, 3).map((r) => (
                            <span key={r} className="text-xs bg-slate-700/50 text-slate-300 px-2 py-0.5 rounded-full border border-slate-600/50">
                                {r}
                            </span>
                        ))}
                        {report.recipients.length > 3 && (
                            <span className="text-xs text-slate-400">+{report.recipients.length - 3} more</span>
                        )}
                    </div>
                </div>

                {/* Status row */}
                <div className="mt-4 pt-3 border-t border-slate-700/50 flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-3">
                        <StatusBadge status={report.lastRunStatus} />
                        {report.nextRunAt && (
                            <span className="text-xs text-slate-500 flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                Next: {new Date(report.nextRunAt).toLocaleDateString()}
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-1.5">
                        <Button
                            id={`trigger-${report.id}`}
                            size="sm"
                            variant="outline"
                            className="h-7 px-2.5 text-xs border-slate-600 hover:bg-slate-700 hover:border-slate-500 text-slate-300"
                            onClick={() => onTrigger(report.id)}
                            disabled={isTriggering}
                        >
                            {isTriggering ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                                <PlayCircle className="w-3 h-3 mr-1" />
                            )}
                            Run Now
                        </Button>
                        <Button
                            id={`edit-${report.id}`}
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-slate-400 hover:text-slate-100 hover:bg-slate-700"
                            onClick={() => onEdit(report)}
                        >
                            <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                            id={`delete-${report.id}`}
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-slate-400 hover:text-red-400 hover:bg-red-500/10"
                            onClick={() => onDelete(report.id)}
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                    </div>
                </div>

                {/* Error display */}
                {report.lastRunStatus === "failed" && report.lastRunError && (
                    <div className="mt-3 flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-lg p-2.5">
                        <AlertCircle className="w-3.5 h-3.5 text-red-400 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-red-300 line-clamp-2">{report.lastRunError}</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

// ─────────────────────────────────────────────
//  Create/Edit Dialog
// ─────────────────────────────────────────────

function ScheduleDialog({
    open,
    onClose,
    editingReport,
}: {
    open: boolean;
    onClose: () => void;
    editingReport: ScheduledReport | null;
}) {
    const utils = trpc.useUtils();

    const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<FormData, unknown, FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: editingReport
            ? {
                name: editingReport.name,
                reportType: editingReport.reportType,
                frequency: editingReport.frequency,
                dayOfWeek: editingReport.dayOfWeek,
                dayOfMonth: editingReport.dayOfMonth,
                time: editingReport.time,
                recipients: editingReport.recipients.join(", "),
                timeframe: editingReport.timeframe,
                enabled: editingReport.enabled,
            }
            : {
                name: "",
                reportType: "financial",
                frequency: "weekly",
                dayOfWeek: 1,
                time: "08:00",
                recipients: "",
                timeframe: "month",
                enabled: true,
            },
    });

    const frequency = watch("frequency");
    const reportType = watch("reportType");

    const createMutation = trpc.scheduledReports.create.useMutation({
        onSuccess: () => {
            utils.scheduledReports.list.invalidate();
            toast.success("Schedule created successfully!");
            onClose();
            reset();
        },
        onError: (err) => toast.error(`Failed to create: ${err.message}`),
    });

    const updateMutation = trpc.scheduledReports.update.useMutation({
        onSuccess: () => {
            utils.scheduledReports.list.invalidate();
            toast.success("Schedule updated successfully!");
            onClose();
        },
        onError: (err) => toast.error(`Failed to update: ${err.message}`),
    });

    const onSubmit = (data: FormData) => {
        const recipientsArray = data.recipients
            .split(/[\s,;]+/)
            .map((r) => r.trim())
            .filter(Boolean);

        if (recipientsArray.length === 0) {
            toast.error("Please enter at least one valid email recipient");
            return;
        }

        const payload = {
            name: data.name,
            reportType: data.reportType,
            frequency: data.frequency,
            dayOfWeek: data.frequency === "weekly" ? data.dayOfWeek : undefined,
            dayOfMonth: data.frequency === "monthly" ? data.dayOfMonth : undefined,
            time: data.time,
            recipients: recipientsArray,
            timeframe: data.timeframe,
            enabled: data.enabled,
        };

        if (editingReport) {
            updateMutation.mutate({ id: editingReport.id, data: payload });
        } else {
            createMutation.mutate(payload);
        }
    };

    const isPending = createMutation.isPending || updateMutation.isPending;

    return (
        <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="bg-slate-900 border-slate-700 text-slate-100 max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold">
                        {editingReport ? "Edit Scheduled Report" : "Create Scheduled Report"}
                    </DialogTitle>
                    <DialogDescription className="text-slate-400">
                        Configure automatic report delivery to stakeholders.
                    </DialogDescription>
                </DialogHeader>

                <form id="schedule-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
                    {/* Name */}
                    <div className="space-y-1.5">
                        <Label htmlFor="schedule-name" className="text-slate-300">Schedule Name</Label>
                        <Input
                            id="schedule-name"
                            {...register("name")}
                            placeholder="e.g. Weekly Finance Summary"
                            className="bg-slate-800 border-slate-600 text-slate-100 focus:border-violet-500 placeholder:text-slate-500"
                        />
                        {errors.name && <p className="text-xs text-red-400">{errors.name.message}</p>}
                    </div>

                    {/* Report Type */}
                    <div className="space-y-1.5">
                        <Label className="text-slate-300">Report Type</Label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {(Object.keys(REPORT_TYPE_META) as Array<keyof typeof REPORT_TYPE_META>).map((type) => {
                                const meta = REPORT_TYPE_META[type];
                                const Icon = meta.icon;
                                const selected = reportType === type;
                                return (
                                    <button
                                        key={type}
                                        type="button"
                                        id={`report-type-${type}`}
                                        onClick={() => setValue("reportType", type)}
                                        className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all ${selected
                                            ? `${meta.bg} ${meta.color} border-current/40`
                                            : "border-slate-600 text-slate-400 hover:border-slate-500 hover:text-slate-300"
                                            }`}
                                    >
                                        <Icon className="w-4 h-4" />
                                        <span>{meta.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Frequency */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label className="text-slate-300">Frequency</Label>
                            <Select
                                value={watch("frequency")}
                                onValueChange={(v) => setValue("frequency", v as FormData["frequency"])}
                            >
                                <SelectTrigger id="frequency-select" className="bg-slate-800 border-slate-600 text-slate-100">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-800 border-slate-700">
                                    <SelectItem value="daily">Daily</SelectItem>
                                    <SelectItem value="weekly">Weekly</SelectItem>
                                    <SelectItem value="monthly">Monthly</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Time */}
                        <div className="space-y-1.5">
                            <Label htmlFor="schedule-time" className="text-slate-300">Time (24h)</Label>
                            <Input
                                id="schedule-time"
                                type="time"
                                {...register("time")}
                                className="bg-slate-800 border-slate-600 text-slate-100 focus:border-violet-500"
                            />
                        </div>
                    </div>

                    {/* Day of week / month */}
                    {frequency === "weekly" && (
                        <div className="space-y-1.5">
                            <Label className="text-slate-300">Day of Week</Label>
                            <Select
                                value={String(watch("dayOfWeek") ?? "1")}
                                onValueChange={(v) => setValue("dayOfWeek", parseInt(v))}
                            >
                                <SelectTrigger id="day-of-week-select" className="bg-slate-800 border-slate-600 text-slate-100">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-800 border-slate-700">
                                    {DAYS_OF_WEEK.map((d) => (
                                        <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {frequency === "monthly" && (
                        <div className="space-y-1.5">
                            <Label htmlFor="day-of-month" className="text-slate-300">Day of Month (1–28)</Label>
                            <Input
                                id="day-of-month"
                                type="number"
                                min={1}
                                max={28}
                                {...register("dayOfMonth")}
                                className="bg-slate-800 border-slate-600 text-slate-100 focus:border-violet-500"
                                placeholder="1"
                            />
                        </div>
                    )}

                    {/* Timeframe */}
                    <div className="space-y-1.5">
                        <Label className="text-slate-300">Report Timeframe</Label>
                        <Select
                            value={watch("timeframe")}
                            onValueChange={(v) => setValue("timeframe", v as FormData["timeframe"])}
                        >
                            <SelectTrigger id="timeframe-select" className="bg-slate-800 border-slate-600 text-slate-100">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-800 border-slate-700">
                                <SelectItem value="month">This Month</SelectItem>
                                <SelectItem value="quarter">This Quarter</SelectItem>
                                <SelectItem value="year">This Year</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Recipients */}
                    <div className="space-y-1.5">
                        <Label htmlFor="recipients" className="text-slate-300">Recipients</Label>
                        <Input
                            id="recipients"
                            {...register("recipients")}
                            placeholder="ceo@company.com, cfo@company.com"
                            className="bg-slate-800 border-slate-600 text-slate-100 focus:border-violet-500 placeholder:text-slate-500"
                        />
                        <p className="text-xs text-slate-500">Separate multiple emails with commas</p>
                        {errors.recipients && <p className="text-xs text-red-400">{errors.recipients.message}</p>}
                    </div>

                    {/* Enabled toggle */}
                    <div className="flex items-center gap-3 py-2">
                        <Switch
                            id="enabled-toggle"
                            checked={watch("enabled")}
                            onCheckedChange={(v) => setValue("enabled", v)}
                        />
                        <Label htmlFor="enabled-toggle" className="text-slate-300 cursor-pointer">
                            Enable this schedule immediately
                        </Label>
                    </div>
                </form>

                <DialogFooter className="gap-2">
                    <Button
                        id="cancel-schedule"
                        type="button"
                        variant="ghost"
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-200"
                    >
                        Cancel
                    </Button>
                    <Button
                        id="save-schedule"
                        type="submit"
                        form="schedule-form"
                        disabled={isPending}
                        className="bg-violet-600 hover:bg-violet-500 text-white"
                    >
                        {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        {editingReport ? "Save Changes" : "Create Schedule"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ─────────────────────────────────────────────
//  Main Page
// ─────────────────────────────────────────────

export default function ScheduledReports() {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingReport, setEditingReport] = useState<ScheduledReport | null>(null);
    const [triggeringId, setTriggeringId] = useState<string | null>(null);

    const utils = trpc.useUtils();
    const { data: reports = [], isLoading } = trpc.scheduledReports.list.useQuery(undefined, {
        refetchInterval: 15000, // refresh every 15s to show updated run status
    });

    const deleteMutation = trpc.scheduledReports.delete.useMutation({
        onSuccess: () => {
            utils.scheduledReports.list.invalidate();
            toast.success("Schedule deleted");
        },
        onError: (err) => toast.error(`Delete failed: ${err.message}`),
    });

    const toggleMutation = trpc.scheduledReports.toggle.useMutation({
        onSuccess: (data) => {
            utils.scheduledReports.list.invalidate();
            toast.success(data.enabled ? "Schedule enabled" : "Schedule paused");
        },
        onError: (err) => toast.error(`Toggle failed: ${err.message}`),
    });

    const triggerMutation = trpc.scheduledReports.triggerNow.useMutation({
        onSuccess: (result, vars) => {
            setTriggeringId(null);
            utils.scheduledReports.list.invalidate();
            if (result.success) {
                toast.success("Report triggered and delivered successfully!");
            } else {
                toast.error(`Report failed: ${result.error}`);
            }
        },
        onError: (err) => {
            setTriggeringId(null);
            toast.error(`Trigger failed: ${err.message}`);
        },
    });

    const handleOpenCreate = () => {
        setEditingReport(null);
        setDialogOpen(true);
    };

    const handleEdit = (report: ScheduledReport) => {
        setEditingReport(report);
        setDialogOpen(true);
    };

    const handleDelete = (id: string) => {
        if (confirm("Are you sure you want to delete this scheduled report?")) {
            deleteMutation.mutate({ id });
        }
    };

    const handleToggle = (id: string, enabled: boolean) => {
        toggleMutation.mutate({ id, enabled });
    };

    const handleTrigger = (id: string) => {
        setTriggeringId(id);
        triggerMutation.mutate({ id });
    };

    // Stats
    const activeCount = reports.filter((r) => r.enabled).length;
    const successCount = reports.filter((r) => r.lastRunStatus === "success").length;
    const failedCount = reports.filter((r) => r.lastRunStatus === "failed").length;
    const totalRecipients = new Set(reports.flatMap((r) => r.recipients)).size;

    return (
        <ERPDashboardLayout>
            <div className="space-y-6 p-1">
                {/* ── Header ── */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-violet-500/15 border border-violet-500/25 flex items-center justify-center">
                                <CalendarClock className="w-5 h-5 text-violet-400" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-slate-100">Scheduled Reports</h1>
                                <p className="text-sm text-slate-400">
                                    Automated report delivery to stakeholders on your schedule
                                </p>
                            </div>
                        </div>
                    </div>
                    <Button
                        id="create-schedule-btn"
                        onClick={handleOpenCreate}
                        className="bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-500/20 self-start sm:self-auto"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        New Schedule
                    </Button>
                </div>

                {/* ── Stats Cards ── */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {[
                        {
                            label: "Total Schedules",
                            value: reports.length,
                            icon: CalendarClock,
                            color: "text-violet-400",
                            bg: "bg-violet-500/10",
                        },
                        {
                            label: "Active",
                            value: activeCount,
                            icon: CheckCircle2,
                            color: "text-emerald-400",
                            bg: "bg-emerald-500/10",
                        },
                        {
                            label: "Successful Runs",
                            value: successCount,
                            icon: PlayCircle,
                            color: "text-blue-400",
                            bg: "bg-blue-500/10",
                        },
                        {
                            label: "Unique Recipients",
                            value: totalRecipients,
                            icon: Mail,
                            color: "text-amber-400",
                            bg: "bg-amber-500/10",
                        },
                    ].map(({ label, value, icon: Icon, color, bg }) => (
                        <Card key={label} className="bg-slate-800/50 border-slate-700/50">
                            <CardContent className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center`}>
                                        <Icon className={`w-4.5 h-4.5 ${color}`} />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-slate-100">{value}</p>
                                        <p className="text-xs text-slate-400 mt-0.5">{label}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* ── Report Grid ── */}
                {isLoading ? (
                    <div className="flex items-center justify-center py-24">
                        <div className="flex flex-col items-center gap-3">
                            <Loader2 className="w-8 h-8 animate-spin text-violet-400" />
                            <p className="text-slate-400 text-sm">Loading schedules...</p>
                        </div>
                    </div>
                ) : reports.length === 0 ? (
                    <Card className="bg-slate-800/30 border-slate-700/30 border-dashed">
                        <CardContent className="py-20 flex flex-col items-center text-center gap-4">
                            <div className="w-16 h-16 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                                <CalendarClock className="w-8 h-8 text-violet-400" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-slate-200">No schedules configured</h3>
                                <p className="text-slate-400 text-sm mt-1 max-w-sm">
                                    Create your first scheduled report to automatically deliver insights to stakeholders.
                                </p>
                            </div>
                            <Button
                                id="create-first-schedule"
                                onClick={handleOpenCreate}
                                className="bg-violet-600 hover:bg-violet-500 text-white mt-2"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Create First Schedule
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {reports.map((report) => (
                            <ReportCard
                                key={report.id}
                                report={report as ScheduledReport}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                                onToggle={handleToggle}
                                onTrigger={handleTrigger}
                                isTriggering={triggeringId === report.id && triggerMutation.isPending}
                            />
                        ))}
                    </div>
                )}

                {/* ── Info Card ── */}
                <Card className="bg-slate-800/40 border-slate-700/40">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-violet-400" />
                            How Scheduled Reports Work
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid sm:grid-cols-3 gap-4 text-sm text-slate-400">
                            <div className="space-y-1">
                                <p className="font-medium text-slate-300">⏰ Scheduling</p>
                                <p>Reports run automatically using node-cron based on your frequency settings — daily, weekly, or monthly.</p>
                            </div>
                            <div className="space-y-1">
                                <p className="font-medium text-slate-300">📊 Data Sources</p>
                                <p>Each report type pulls live data: Finance from invoices & expenses, Inventory from stock levels, HR from employee records, and Sales from leads.</p>
                            </div>
                            <div className="space-y-1">
                                <p className="font-medium text-slate-300">📧 Delivery</p>
                                <p>Reports are formatted and delivered as rich HTML emails to all configured recipients. Use "Run Now" to test a schedule immediately.</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* ── Dialog ── */}
            <ScheduleDialog
                open={dialogOpen}
                onClose={() => {
                    setDialogOpen(false);
                    setEditingReport(null);
                }}
                editingReport={editingReport}
            />
        </ERPDashboardLayout>
    );
}
