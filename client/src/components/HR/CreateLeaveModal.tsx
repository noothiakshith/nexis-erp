import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const leaveSchema = z.object({
    employeeId: z.coerce.number().optional().or(z.literal("self")),
    leaveType: z.string().min(1, "Leave type is required"),
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().min(1, "End date is required"),
    reason: z.string().optional(),
});

type LeaveFormValues = z.infer<typeof leaveSchema>;

interface CreateLeaveModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

export function CreateLeaveModal({
    open,
    onOpenChange,
    onSuccess,
}: CreateLeaveModalProps) {
    const form = useForm<LeaveFormValues>({
        resolver: zodResolver(leaveSchema) as any,
        defaultValues: {
            employeeId: "self",
            leaveType: "sick",
            startDate: new Date().toISOString().split("T")[0],
            endDate: new Date().toISOString().split("T")[0],
            reason: "",
        },
    });

    const { data: employees } = trpc.employee.listAll.useQuery();

    const submitLeave = trpc.employee.submitLeaveRequest.useMutation({
        onSuccess: () => {
            toast.success("Leave request submitted for approval");
            onOpenChange(false);
            form.reset();
            onSuccess?.();
        },
        onError: (error) => {
            toast.error(`Failed to submit leave: ${error.message}`);
        },
    });

    const onSubmit = (values: LeaveFormValues) => {
        const submissionData = {
            ...values,
            employeeId: values.employeeId === "self" ? undefined : values.employeeId,
        };
        submitLeave.mutate(submissionData);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Request Leave</DialogTitle>
                    <DialogDescription>
                        Submit your leave request for manager approval.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                        <FormField
                            control={form.control}
                            name="employeeId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Employee (Optional)</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value?.toString()}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select employee" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="self">Current User</SelectItem>
                                            {employees?.map((emp) => (
                                                <SelectItem key={emp.id} value={emp.id.toString()}>
                                                    {emp.firstName} {emp.lastName}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="leaveType"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Leave Type</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select type" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="annual">Annual Leave</SelectItem>
                                            <SelectItem value="sick">Sick Leave</SelectItem>
                                            <SelectItem value="personal">Personal Leave</SelectItem>
                                            <SelectItem value="unpaid">Unpaid Leave</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="startDate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Start Date</FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="endDate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>End Date</FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="reason"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Reason</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Brief explanation..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter className="pt-4">
                            <Button type="submit" disabled={submitLeave.isPending}>
                                {submitLeave.isPending ? "Submitting..." : "Submit Request"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
