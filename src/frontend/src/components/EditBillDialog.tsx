import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { Bill } from "../backend";
import { usePartyAssignments } from "../hooks/usePartyAssignments";
import { useUpdateBill } from "../hooks/useQueries";

const PAYMENT_METHODS = ["Cash", "Cheque", "UPI", "Online"] as const;

interface EditBillDialogProps {
  bill: Bill;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditBillDialog({
  bill,
  open,
  onOpenChange,
}: EditBillDialogProps) {
  const [name, setName] = useState(bill.name);
  const [amount, setAmount] = useState(String(bill.amount));
  const [dueDate, setDueDate] = useState(bill.dueDate);
  const [paymentMethod, setPaymentMethod] = useState(bill.paymentMethod);
  const [partyInput, setPartyInput] = useState("");
  const updateBill = useUpdateBill();
  const { getParty, setParty, getAllParties } = usePartyAssignments();
  const allParties = getAllParties();

  useEffect(() => {
    setName(bill.name);
    setAmount(String(bill.amount));
    setDueDate(bill.dueDate);
    setPaymentMethod(bill.paymentMethod);
    setPartyInput(getParty(bill.id));
  }, [bill, getParty]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = Number.parseFloat(amount);
    if (
      !name.trim() ||
      !dueDate ||
      Number.isNaN(parsedAmount) ||
      parsedAmount <= 0
    ) {
      toast.error("Please fill in all fields correctly");
      return;
    }
    try {
      await updateBill.mutateAsync({
        billId: bill.id,
        name: name.trim(),
        category: bill.category,
        amount: parsedAmount,
        dueDate,
        paymentMethod,
      });
      setParty(bill.id, partyInput);
      toast.success("Bill updated successfully");
      onOpenChange(false);
    } catch {
      toast.error("Failed to update bill. Please try again.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-ocid="bills.edit.dialog" className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl font-bold">
            Edit Bill
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="edit-bill-name">Invoice Number</Label>
            <Input
              data-ocid="bills.edit.input"
              id="edit-bill-name"
              placeholder="e.g. INV-001"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-bill-party">Party / Vendor Name</Label>
            <div className="relative">
              <Input
                data-ocid="bills.edit.party_input"
                id="edit-bill-party"
                placeholder="e.g. Sharma Traders"
                value={partyInput}
                onChange={(e) => setPartyInput(e.target.value)}
                list="edit-party-suggestions"
              />
              {partyInput && (
                <button
                  type="button"
                  onClick={() => setPartyInput("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            {allParties.length > 0 && (
              <datalist id="edit-party-suggestions">
                {allParties.map((p) => (
                  <option key={p} value={p} />
                ))}
              </datalist>
            )}
            {allParties.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {allParties.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPartyInput(p)}
                    className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${
                      partyInput === p
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-muted text-foreground border-border hover:border-primary/50"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="edit-bill-amount">Amount (₹)</Label>
              <Input
                data-ocid="bills.edit.input"
                id="edit-bill-amount"
                type="number"
                min="0.01"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-bill-due-date">Due Date</Label>
              <Input
                data-ocid="bills.edit.input"
                id="edit-bill-due-date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-bill-payment-method">Payment Method</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger
                data-ocid="bills.edit.select"
                id="edit-bill-payment-method"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map((method) => (
                  <SelectItem key={method} value={method}>
                    {method}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              data-ocid="bills.edit.cancel_button"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              data-ocid="bills.edit.submit_button"
              disabled={updateBill.isPending}
            >
              {updateBill.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
