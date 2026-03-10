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
import { Textarea } from "@/components/ui/textarea";

const invoiceSchema = z.object({
    invoiceNumber: z.string().min(1, "Invoice number is required"),
    amount: z.number().min(0.01, "Amount must be greater than 0"),
    tax: z.number().min(0, "Tax cannot be negative"),
    dueDate: z.string().min(1, "Due date is required"),
    description: z.string().optional(),
});

type InvoiceFormValues = z.infer<typeof invoiceSchema>;

interface CreateInvoiceModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

export function CreateInvoiceModal({
    open,
    onOpenChange,
    onSuccess,
}: CreateInvoiceModalProps) {
    const form = useForm<InvoiceFormValues>({
        resolver: zodResolver(invoiceSchema) as any,
        defaultValues: {
            invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
            amount: 0,
            tax: 0,
            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                .toISOString()
                .split("T")[0],
            description: "",
        },
    });

    const createInvoice = trpc.finance.createInvoice.useMutation({
        onSuccess: () => {
            toast.success("Invoice created successfully");
            onOpenChange(false);
            form.reset();
            onSuccess?.();
        },
        onError: (error) => {
            toast.error(`Failed to create invoice: ${error.message}`);
        },
    });

    const onSubmit = (values: InvoiceFormValues) => {
        createInvoice.mutate(values);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] border-none shadow-2xl bg-white/90 backdrop-blur-xl">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                        Create New Invoice
                    </DialogTitle>
                    <DialogDescription>
                        Generate a new billing document for your customer.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="invoiceNumber"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Invoice #</FormLabel>
                                        <FormControl>
                                            <Input placeholder="INV-001" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="dueDate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Due Date</FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="amount"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Amount ($)</FormLabel>
                                        <FormControl>
                                            <Input type="number" step="0.01" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="tax"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Tax ($)</FormLabel>
                                        <FormControl>
                                            <Input type="number" step="0.01" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Enter invoice details..."
                                            className="resize-none"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter className="pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                className="hover:bg-slate-100"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={createInvoice.isPending}
                                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 text-white shadow-lg transition-all active:scale-95"
                            >
                                {createInvoice.isPending ? "Creating..." : "Create Invoice"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
