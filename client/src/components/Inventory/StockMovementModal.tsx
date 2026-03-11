import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ArrowDownRight, ArrowUpRight, Settings } from "lucide-react";

interface StockMovementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: number | null;
  movementType: "in" | "out" | "adjustment";
  onSubmit: (data: { quantity: number; reference?: string; notes?: string }) => void;
  isLoading?: boolean;
}

export function StockMovementModal({
  open,
  onOpenChange,
  productId,
  movementType,
  onSubmit,
  isLoading = false,
}: StockMovementModalProps) {
  const [quantity, setQuantity] = useState("");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const qty = parseInt(quantity);
    if (isNaN(qty) || qty <= 0) return;

    onSubmit({
      quantity: qty,
      reference: reference.trim() || undefined,
      notes: notes.trim() || undefined,
    });

    // Reset form
    setQuantity("");
    setReference("");
    setNotes("");
  };

  const getMovementConfig = () => {
    switch (movementType) {
      case "in":
        return {
          title: "Stock In",
          description: "Add inventory to stock",
          icon: <ArrowDownRight className="w-5 h-5" />,
          color: "emerald",
          badge: "bg-emerald-100 text-emerald-700 border-emerald-200",
        };
      case "out":
        return {
          title: "Stock Out",
          description: "Remove inventory from stock",
          icon: <ArrowUpRight className="w-5 h-5" />,
          color: "blue",
          badge: "bg-blue-100 text-blue-700 border-blue-200",
        };
      case "adjustment":
        return {
          title: "Stock Adjustment",
          description: "Adjust inventory levels",
          icon: <Settings className="w-5 h-5" />,
          color: "amber",
          badge: "bg-amber-100 text-amber-700 border-amber-200",
        };
    }
  };

  const config = getMovementConfig();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {config.icon}
            {config.title}
          </DialogTitle>
          <div className="flex items-center gap-2 mt-2">
            <Badge className={config.badge}>
              {config.description}
            </Badge>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="quantity">
              Quantity {movementType === "adjustment" ? "(Set to)" : ""}
            </Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Enter quantity"
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reference">Reference (Optional)</Label>
            <Input
              id="reference"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="PO number, invoice, etc."
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes about this movement"
              rows={3}
              disabled={isLoading}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !quantity}
              className={`${
                config.color === "emerald"
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : config.color === "blue"
                  ? "bg-blue-600 hover:bg-blue-700"
                  : "bg-amber-600 hover:bg-amber-700"
              }`}
            >
              {isLoading ? "Processing..." : `Record ${config.title}`}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}