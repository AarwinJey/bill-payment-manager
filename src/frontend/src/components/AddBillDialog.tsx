import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Loader2, Plus } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { usePartyAssignments } from "../hooks/usePartyAssignments";
import { useCreateBill } from "../hooks/useQueries";

const PAYMENT_METHODS = ["Cash", "Cheque", "UPI", "Online"] as const;
type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export function AddBillDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [partyName, setPartyName] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("Cash");
  const createBill = useCreateBill();
  const { setParty, getAllParties } = usePartyAssignments();

  const allParties = getAllParties();

  const resetForm = () => {
    setName("");
    setPartyName("");
    setAmount("");
    setDueDate("");
    setPaymentMethod("Cash");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !amount || !dueDate) {
      toast.error("Please fill in all fields");
      return;
    }
    const parsedAmount = Number.parseFloat(amount);
    if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    try {
      const newBillId = await createBill.mutateAsync({
        name: name.trim(),
        category: "",
        amount: parsedAmount,
        dueDate,
        paymentMethod,
        chequeNumber: null,
        upiId: null,
      });
      if (partyName.trim() && newBillId !== undefined) {
        setParty(newBillId as bigint, partyName.trim());
      }
      toast.success("Bill added successfully");
      resetForm();
      setOpen(false);
    } catch {
      toast.error("Failed to add bill. Please try again.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button data-ocid="bills.open_modal_button" className="gap-2">
          <Plus className="w-4 h-4" />
          Add Bill
        </Button>
      </DialogTrigger>
      <DialogContent data-ocid="bills.dialog" className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl font-bold">
            Add New Bill
          </DialogTitle>
        </DialogHeader>
        <motion.form
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          onSubmit={handleSubmit}
          className="space-y-4 py-2"
        >
          <div className="space-y-1.5">
            <Label htmlFor="bill-name">Invoice Number</Label>
            <Input
              data-ocid="bills.input"
              id="bill-name"
              placeholder="e.g. INV-001"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="bill-party">
              Party / Vendor Name{" "}
              <span className="text-muted-foreground font-normal text-xs">
                (optional)
              </span>
            </Label>
            <Input
              data-ocid="bills.party.input"
              id="bill-party"
              list="party-suggestions"
              placeholder="e.g. Sharma Traders"
              value={partyName}
              onChange={(e) => setPartyName(e.target.value)}
            />
            {allParties.length > 0 && (
              <datalist id="party-suggestions">
                {allParties.map((p) => (
                  <option key={p} value={p} />
                ))}
              </datalist>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="bill-amount">Amount (₹)</Label>
              <Input
                data-ocid="bills.input"
                id="bill-amount"
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
              <Label htmlFor="bill-due-date">Due Date</Label>
              <Input
                data-ocid="bills.input"
                id="bill-due-date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="bill-payment-method">Payment Method</Label>
            <Select
              value={paymentMethod}
              onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}
            >
              <SelectTrigger
                data-ocid="bills.payment_method.select"
                id="bill-payment-method"
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
              data-ocid="bills.cancel_button"
              onClick={() => {
                resetForm();
                setOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              data-ocid="bills.submit_button"
              disabled={createBill.isPending}
            >
              {createBill.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Adding...
                </>
              ) : (
                "Add Bill"
              )}
            </Button>
          </DialogFooter>
        </motion.form>
      </DialogContent>
    </Dialog>
  );
}
