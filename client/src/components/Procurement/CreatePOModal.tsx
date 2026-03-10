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

const poSchema = z.object({
    poNumber: z.string().min(1, "PO number is required"),
    supplierId: z.coerce.number().min(1, "Supplier is required"),
    totalAmount: z.coerce.number().min(0.01, "Amount must be greater than 0"),
    orderDate: z.string().min(1, "Order date is required"),
    status: z.enum(["draft", "pending_approval", "approved", "sent", "received", "cancelled"]).default("draft"),
});

type POFormValues = z.infer<typeof poSchema>;

interface CreatePOModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

export function CreatePOModal({
    open,
    onOpenChange,
    onSuccess,
}: CreatePOModalProps) {
    const form = useForm<POFormValues>({
        resolver: zodResolver(poSchema) as any,
        defaultValues: {
            poNumber: `PO-${Date.now().toString().slice(-6)}`,
            supplierId: 1,
            totalAmount: 0,
            orderDate: new Date().toISOString().split("T")[0],
            status: "draft",
        },
    });

    const createPO = trpc.procurement.createPurchaseOrder.useMutation({
        onSuccess: () => {
            toast.success("Purchase order created successfully");
            onOpenChange(false);
            form.reset();
            onSuccess?.();
        },
        onError: (error) => {
            toast.error(`Failed: ${error.message}`);
        },
    });

    const onSubmit = (values: POFormValues) => {
        createPO.mutate(values);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Create Purchase Order</DialogTitle>
                    <DialogDescription>
                        Initialize a new purchase request for your suppliers.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                        <FormField
                            control={form.control}
                            name="poNumber"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>PO Number</FormLabel>
                                    <FormControl>
                                        <Input placeholder="PO-001" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="supplierId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Supplier ID</FormLabel>
                                        <FormControl>
                                            <Input type="number" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="orderDate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Order Date</FormLabel>
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
                            name="totalAmount"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Total Amount ($)</FormLabel>
                                    <FormControl>
                                        <Input type="number" step="0.01" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter className="pt-4 flex gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    form.setValue("status", "draft");
                                    form.handleSubmit(onSubmit)();
                                }}
                                disabled={createPO.isPending}
                            >
                                Save Draft
                            </Button>
                            <Button
                                type="button"
                                className="bg-indigo-600 hover:bg-indigo-700"
                                onClick={() => {
                                    form.setValue("status", "pending_approval");
                                    form.handleSubmit(onSubmit)();
                                }}
                                disabled={createPO.isPending}
                            >
                                {createPO.isPending ? "Submitting..." : "Submit for Approval"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
