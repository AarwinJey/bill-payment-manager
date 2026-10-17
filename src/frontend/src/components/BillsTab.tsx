import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  FileSpreadsheet,
  Layers,
  List,
  Loader2,
  Pencil,
  Receipt,
  Trash2,
  Users,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { Bill } from "../backend";
import { usePartyAssignments } from "../hooks/usePartyAssignments";
import {
  useDeleteBill,
  useGetBills,
  useUpdateBillStatusWithPayment,
} from "../hooks/useQueries";
import { AddBillDialog } from "./AddBillDialog";
import { EditBillDialog } from "./EditBillDialog";
import { ImportBillsDialog } from "./ImportBillsDialog";

const SKELETON_ROWS = ["sk-r0", "sk-r1", "sk-r2", "sk-r3"];
const PAYMENT_SKELETON_ROWS = ["ps-r0", "ps-r1", "ps-r2", "ps-r3"];
export { PAYMENT_SKELETON_ROWS };

function StatusBadge({ status }: { status: string }) {
  if (status === "paid") {
    return (
      <Badge className="bg-success-muted text-success-muted-foreground border-0 gap-1 font-medium">
        <CheckCircle2 className="w-3 h-3" />
        Paid
      </Badge>
    );
  }
  return (
    <Badge className="bg-warning-muted text-warning-muted-foreground border-0 gap-1 font-medium">
      <Clock className="w-3 h-3" />
      Unpaid
    </Badge>
  );
}

function PaymentMethodBadge({ method }: { method: string }) {
  const styles: Record<string, string> = {
    Cash: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
    Cheque:
      "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300",
    UPI: "bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300",
    Online:
      "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
    NEFT: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
  };
  const cls = styles[method] ?? "bg-muted text-muted-foreground";
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold ${cls}`}
    >
      {method}
    </span>
  );
}

function BillRowSkeleton({ id, index }: { id: string; index: number }) {
  return (
    <TableRow key={id}>
      <TableCell>
        <Skeleton
          className="h-4 w-24"
          style={{ animationDelay: `${index * 80}ms` }}
        />
      </TableCell>
      <TableCell>
        <Skeleton
          className="h-4 w-20"
          style={{ animationDelay: `${index * 80 + 10}ms` }}
        />
      </TableCell>
      <TableCell>
        <Skeleton
          className="h-4 w-32"
          style={{ animationDelay: `${index * 80 + 20}ms` }}
        />
      </TableCell>
      <TableCell>
        <Skeleton
          className="h-4 w-16"
          style={{ animationDelay: `${index * 80 + 30}ms` }}
        />
      </TableCell>
      <TableCell>
        <Skeleton
          className="h-4 w-24"
          style={{ animationDelay: `${index * 80 + 40}ms` }}
        />
      </TableCell>
      <TableCell>
        <Skeleton className="h-5 w-16 rounded-full" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-5 w-14 rounded-md" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-20" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-24" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-8 w-24" />
      </TableCell>
    </TableRow>
  );
}

function PartyCell({
  billId,
  allParties,
  getParty,
  setParty,
  index,
}: {
  billId: bigint;
  allParties: string[];
  getParty: (id: bigint) => string;
  setParty: (id: bigint, name: string) => void;
  index: number;
}) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const party = getParty(billId);

  const handleOpen = (o: boolean) => {
    if (o) setInput(party);
    setOpen(o);
  };

  const handleSave = () => {
    setParty(billId, input);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={handleOpen}>
      <PopoverTrigger asChild>
        <button
          data-ocid={`bills.party.button.${index + 1}`}
          className="flex items-center gap-1 group"
          type="button"
        >
          {party ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold border border-primary/20 hover:bg-primary/20 transition-colors">
              <Users className="w-3 h-3 mr-1" />
              {party}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground/60 group-hover:text-primary transition-colors">
              + Add Party
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        data-ocid="bills.party.popover"
        className="w-64 p-3 space-y-3"
        align="start"
      >
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold">Party / Vendor Name</Label>
          <Input
            data-ocid="bills.party.input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="e.g. Sharma Traders"
            className="h-8 text-sm"
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
            autoFocus
          />
        </div>
        {allParties.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground font-medium">
              Quick select
            </p>
            <div className="flex flex-wrap gap-1.5">
              {allParties.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setInput(p)}
                  className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${
                    input === p
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted text-foreground border-border hover:border-primary/50"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="flex gap-2 pt-1">
          <Button size="sm" className="h-7 text-xs flex-1" onClick={handleSave}>
            Save
          </Button>
          {party && (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs text-destructive hover:text-destructive"
              onClick={() => {
                setParty(billId, "");
                setOpen(false);
              }}
            >
              Remove
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function PaymentDetailDialog({
  open,
  onOpenChange,
  paymentMethod,
  onConfirm,
  isPending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paymentMethod: string;
  onConfirm: (value: string) => void;
  isPending: boolean;
}) {
  const [value, setValue] = useState("");
  const label = paymentMethod === "Cheque" ? "Cheque Number" : "UPI ID";
  const placeholder =
    paymentMethod === "Cheque" ? "e.g. 000123" : "e.g. name@upi";

  const handleConfirm = () => {
    if (!value.trim()) {
      toast.error(`Please enter a ${label}`);
      return;
    }
    onConfirm(value.trim());
  };

  const handleOpenChange = (o: boolean) => {
    if (!o) setValue("");
    onOpenChange(o);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        data-ocid="bills.payment_detail.dialog"
        className="sm:max-w-sm"
      >
        <DialogHeader>
          <DialogTitle className="font-display text-lg font-bold">
            Enter Payment Details
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <p className="text-sm text-muted-foreground">
            Enter payment details to mark this bill as paid.
          </p>
          <div className="space-y-1.5">
            <Label htmlFor="payment-detail-input">{label}</Label>
            <Input
              data-ocid="bills.payment_detail.input"
              id="payment-detail-input"
              placeholder={placeholder}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleConfirm()}
              autoFocus
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            data-ocid="bills.payment_detail.cancel_button"
            onClick={() => handleOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            data-ocid="bills.payment_detail.confirm_button"
            onClick={handleConfirm}
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
              </>
            ) : (
              "Confirm & Mark Paid"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function BillRow({
  bill,
  index,
  allParties,
  getParty,
  setParty,
}: {
  bill: Bill;
  index: number;
  allParties: string[];
  getParty: (id: bigint) => string;
  setParty: (id: bigint, name: string) => void;
}) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [paymentDetailOpen, setPaymentDetailOpen] = useState(false);
  const updateStatus = useUpdateBillStatusWithPayment();
  const deleteBill = useDeleteBill();
  const isPaid = bill.status === "paid";

  const handleToggleStatus = async () => {
    if (isPaid) {
      // Marking unpaid — no payment details needed
      try {
        await updateStatus.mutateAsync({
          billId: bill.id,
          status: "unpaid",
          chequeNumber: null,
          upiId: null,
        });
        toast.success("Bill marked as unpaid");
      } catch {
        toast.error("Failed to update bill status");
      }
      return;
    }
    // Marking paid
    if (bill.paymentMethod === "Cash") {
      try {
        await updateStatus.mutateAsync({
          billId: bill.id,
          status: "paid",
          chequeNumber: null,
          upiId: null,
        });
        toast.success("Bill marked as paid");
      } catch {
        toast.error("Failed to update bill status");
      }
    } else {
      // Cheque or UPI — open dialog for payment details
      setPaymentDetailOpen(true);
    }
  };

  const handlePaymentDetailConfirm = async (value: string) => {
    try {
      const chequeNumber = bill.paymentMethod === "Cheque" ? value : null;
      const upiId = bill.paymentMethod === "UPI" ? value : null;
      await updateStatus.mutateAsync({
        billId: bill.id,
        status: "paid",
        chequeNumber,
        upiId,
      });
      toast.success("Bill marked as paid");
      setPaymentDetailOpen(false);
    } catch {
      toast.error("Failed to update bill status");
    }
  };

  const handleDelete = async () => {
    try {
      await deleteBill.mutateAsync(bill.id);
      toast.success("Bill deleted");
      setDeleteOpen(false);
    } catch {
      toast.error("Failed to delete bill");
    }
  };

  const createdDate = new Date(
    Number(bill.createdAt / 1_000_000n),
  ).toLocaleDateString("en-IN");

  return (
    <>
      <motion.tr
        data-ocid={`bills.item.${index + 1}`}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ delay: index * 0.04, duration: 0.25 }}
        className="border-b border-border hover:bg-muted/30 transition-colors"
      >
        <TableCell className="text-muted-foreground text-sm">
          {createdDate}
        </TableCell>
        <TableCell>
          <PartyCell
            billId={bill.id}
            allParties={allParties}
            getParty={getParty}
            setParty={setParty}
            index={index}
          />
        </TableCell>
        <TableCell className="font-medium text-foreground">
          {bill.name}
        </TableCell>
        <TableCell className="font-mono text-foreground font-semibold">
          ₹{bill.amount.toFixed(2)}
        </TableCell>
        <TableCell className="text-muted-foreground text-sm">
          {bill.dueDate}
        </TableCell>
        <TableCell>
          <StatusBadge status={bill.status} />
        </TableCell>
        <TableCell>
          <PaymentMethodBadge method={bill.paymentMethod} />
        </TableCell>
        <TableCell className="text-sm">
          {bill.paymentMethod === "Cheque" && bill.chequeNumber ? (
            <span className="font-mono text-foreground">
              {bill.chequeNumber}
            </span>
          ) : bill.paymentMethod === "UPI" && bill.upiId ? (
            <span className="font-mono text-foreground">{bill.upiId}</span>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </TableCell>
        <TableCell className="text-sm text-muted-foreground">
          {bill.paidAt ? (
            new Date(Number(bill.paidAt / 1_000_000n)).toLocaleDateString(
              "en-IN",
            )
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-1">
            <Button
              data-ocid={`bills.toggle.${index + 1}`}
              variant="outline"
              size="sm"
              onClick={handleToggleStatus}
              disabled={updateStatus.isPending}
              className="h-7 text-xs gap-1"
            >
              {updateStatus.isPending ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : isPaid ? (
                <>
                  <Clock className="w-3 h-3" /> Mark Unpaid
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3 h-3" /> Mark Paid
                </>
              )}
            </Button>
            <Button
              data-ocid={`bills.edit_button.${index + 1}`}
              variant="ghost"
              size="sm"
              onClick={() => setEditOpen(true)}
              className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground hover:bg-muted/60"
            >
              <Pencil className="w-3.5 h-3.5" />
            </Button>
            <Button
              data-ocid={`bills.delete_button.${index + 1}`}
              variant="ghost"
              size="sm"
              onClick={() => setDeleteOpen(true)}
              className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </TableCell>
      </motion.tr>

      {/* Payment detail dialog for Cheque/UPI */}
      <PaymentDetailDialog
        open={paymentDetailOpen}
        onOpenChange={setPaymentDetailOpen}
        paymentMethod={bill.paymentMethod}
        onConfirm={handlePaymentDetailConfirm}
        isPending={updateStatus.isPending}
      />

      {/* Edit bill dialog */}
      <EditBillDialog bill={bill} open={editOpen} onOpenChange={setEditOpen} />

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent data-ocid="bills.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">
              Delete Bill?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{bill.name}</strong>? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="bills.cancel_button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              data-ocid="bills.confirm_button"
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteBill.isPending}
            >
              {deleteBill.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function BillsTable({
  bills,
  isLoading,
  allParties,
  getParty,
  setParty,
}: {
  bills: Bill[];
  isLoading: boolean;
  allParties: string[];
  getParty: (id: bigint) => string;
  setParty: (id: bigint, name: string) => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead className="font-semibold text-foreground">
              Date
            </TableHead>
            <TableHead className="font-semibold text-foreground">
              Party
            </TableHead>
            <TableHead className="font-semibold text-foreground">
              Invoice No.
            </TableHead>
            <TableHead className="font-semibold text-foreground">
              Amount
            </TableHead>
            <TableHead className="font-semibold text-foreground">
              Due Date
            </TableHead>
            <TableHead className="font-semibold text-foreground">
              Status
            </TableHead>
            <TableHead className="font-semibold text-foreground">
              Payment Method
            </TableHead>
            <TableHead className="font-semibold text-foreground">
              Cheque/UPI
            </TableHead>
            <TableHead className="font-semibold text-foreground">
              Payment Date
            </TableHead>
            <TableHead className="font-semibold text-foreground">
              Action
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading &&
            SKELETON_ROWS.map((id, i) => (
              <BillRowSkeleton key={id} id={id} index={i} />
            ))}
          <AnimatePresence>
            {!isLoading &&
              bills.map((bill, i) => (
                <BillRow
                  key={String(bill.id)}
                  bill={bill}
                  index={i}
                  allParties={allParties}
                  getParty={getParty}
                  setParty={setParty}
                />
              ))}
          </AnimatePresence>
        </TableBody>
      </Table>
      {!isLoading && bills.length === 0 && (
        <div data-ocid="bills.empty_state" className="py-16 text-center">
          <div className="w-12 h-12 rounded-2xl bg-muted mx-auto mb-3 flex items-center justify-center">
            <Receipt className="w-6 h-6 text-muted-foreground" />
          </div>
          <p className="font-medium text-foreground">No bills found</p>
          <p className="text-sm text-muted-foreground mt-1">
            Try adjusting your filters
          </p>
        </div>
      )}
    </div>
  );
}

function PartyGroupView({
  bills,
  allParties,
  getParty,
  setParty,
}: {
  bills: Bill[];
  allParties: string[];
  getParty: (id: bigint) => string;
  setParty: (id: bigint, name: string) => void;
}) {
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  const groups: Record<string, Bill[]> = {};
  for (const bill of bills) {
    const party = getParty(bill.id) || "(No Party)";
    if (!groups[party]) groups[party] = [];
    groups[party].push(bill);
  }

  const groupEntries = Object.entries(groups).sort(([a], [b]) => {
    if (a === "(No Party)") return 1;
    if (b === "(No Party)") return -1;
    return a.localeCompare(b);
  });

  const toggleGroup = (name: string) => {
    setOpenGroups((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  return (
    <div className="space-y-3">
      {groupEntries.map(([partyName, partyBills]) => {
        const isOpen = openGroups[partyName] !== false;
        const totalAmount = partyBills.reduce((s, b) => s + b.amount, 0);
        const unpaidAmount = partyBills
          .filter((b) => b.status !== "paid")
          .reduce((s, b) => s + b.amount, 0);

        return (
          <Collapsible
            key={partyName}
            open={isOpen}
            onOpenChange={() => toggleGroup(partyName)}
          >
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <CollapsibleTrigger asChild>
                <button
                  type="button"
                  className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {isOpen ? (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    )}
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-primary" />
                      <span className="font-semibold text-foreground">
                        {partyName}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {partyBills.length} bill
                        {partyBills.length !== 1 ? "s" : ""}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-mono font-bold text-foreground">
                      ₹{totalAmount.toFixed(2)}
                    </p>
                    {unpaidAmount > 0 && (
                      <p className="text-xs text-warning-muted-foreground">
                        ₹{unpaidAmount.toFixed(2)} unpaid
                      </p>
                    )}
                  </div>
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="border-t border-border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30 hover:bg-muted/30">
                        <TableHead className="text-xs font-semibold text-foreground">
                          Date
                        </TableHead>
                        <TableHead className="text-xs font-semibold text-foreground">
                          Party
                        </TableHead>
                        <TableHead className="text-xs font-semibold text-foreground">
                          Invoice No.
                        </TableHead>
                        <TableHead className="text-xs font-semibold text-foreground">
                          Amount
                        </TableHead>
                        <TableHead className="text-xs font-semibold text-foreground">
                          Due Date
                        </TableHead>
                        <TableHead className="text-xs font-semibold text-foreground">
                          Status
                        </TableHead>
                        <TableHead className="text-xs font-semibold text-foreground">
                          Payment Method
                        </TableHead>
                        <TableHead className="text-xs font-semibold text-foreground">
                          Cheque/UPI
                        </TableHead>
                        <TableHead className="text-xs font-semibold text-foreground">
                          Payment Date
                        </TableHead>
                        <TableHead className="text-xs font-semibold text-foreground">
                          Action
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <AnimatePresence>
                        {partyBills.map((bill, i) => (
                          <BillRow
                            key={String(bill.id)}
                            bill={bill}
                            index={i}
                            allParties={allParties}
                            getParty={getParty}
                            setParty={setParty}
                          />
                        ))}
                      </AnimatePresence>
                    </TableBody>
                  </Table>
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>
        );
      })}
      {groupEntries.length === 0 && (
        <div
          data-ocid="bills.empty_state"
          className="py-16 text-center rounded-xl border border-border bg-card"
        >
          <div className="w-12 h-12 rounded-2xl bg-muted mx-auto mb-3 flex items-center justify-center">
            <Users className="w-6 h-6 text-muted-foreground" />
          </div>
          <p className="font-medium text-foreground">No bills found</p>
          <p className="text-sm text-muted-foreground mt-1">
            Try adjusting your filters
          </p>
        </div>
      )}
    </div>
  );
}

export function BillsTab() {
  const { data: bills = [], isLoading, isError } = useGetBills();
  const [filter, setFilter] = useState<"all" | "paid" | "unpaid">("all");
  const [partyFilter, setPartyFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"list" | "byParty">("list");
  const [importOpen, setImportOpen] = useState(false);
  const { getParty, setParty, getAllParties } = usePartyAssignments();

  const allParties = getAllParties();

  const filtered = bills.filter((b) => {
    const statusOk =
      filter === "all" ||
      (filter === "paid" && b.status === "paid") ||
      (filter === "unpaid" && b.status !== "paid");
    const partyOk = partyFilter === "all" || getParty(b.id) === partyFilter;
    return statusOk && partyOk;
  });

  const partyCounts: Record<string, number> = {};
  for (const b of bills) {
    const p = getParty(b.id);
    if (p) partyCounts[p] = (partyCounts[p] ?? 0) + 1;
  }

  return (
    <section data-ocid="bills.section">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div>
          <h2 className="font-display text-xl font-bold text-foreground">
            Bills
          </h2>
          <p className="text-sm text-muted-foreground">
            {bills.length} total bills
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Tabs
            value={filter}
            onValueChange={(v) => setFilter(v as typeof filter)}
          >
            <TabsList className="h-8">
              <TabsTrigger
                data-ocid="bills.filter.tab"
                value="all"
                className="text-xs h-6 px-3"
              >
                All
              </TabsTrigger>
              <TabsTrigger
                data-ocid="bills.filter.tab"
                value="paid"
                className="text-xs h-6 px-3"
              >
                Paid
              </TabsTrigger>
              <TabsTrigger
                data-ocid="bills.filter.tab"
                value="unpaid"
                className="text-xs h-6 px-3"
              >
                Unpaid
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <Select value={partyFilter} onValueChange={setPartyFilter}>
            <SelectTrigger
              data-ocid="bills.party.select"
              className="h-8 text-xs w-40"
            >
              <Users className="w-3.5 h-3.5 mr-1 text-muted-foreground" />
              <SelectValue placeholder="All Parties" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Parties</SelectItem>
              {allParties.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                  {partyCounts[p] ? (
                    <span className="ml-1 text-muted-foreground">
                      ({partyCounts[p]})
                    </span>
                  ) : null}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center rounded-lg border border-border bg-muted/40 p-0.5 gap-0.5">
            <button
              type="button"
              data-ocid="bills.list.toggle"
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-colors ${
                viewMode === "list"
                  ? "bg-background text-foreground shadow-sm font-medium"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <List className="w-3.5 h-3.5" />
              List
            </button>
            <button
              type="button"
              data-ocid="bills.party.toggle"
              onClick={() => setViewMode("byParty")}
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-colors ${
                viewMode === "byParty"
                  ? "bg-background text-foreground shadow-sm font-medium"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              By Party
            </button>
          </div>

          <Button
            data-ocid="bills.import.open_modal_button"
            variant="outline"
            size="sm"
            onClick={() => setImportOpen(true)}
            className="gap-2 h-8 text-xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Import Excel
          </Button>
          <AddBillDialog />
        </div>
      </div>

      <ImportBillsDialog open={importOpen} onOpenChange={setImportOpen} />

      {isError && (
        <div
          data-ocid="bills.error_state"
          className="text-center py-12 text-destructive text-sm"
        >
          Failed to load bills. Please refresh.
        </div>
      )}

      {viewMode === "list" ? (
        <BillsTable
          bills={filtered}
          isLoading={isLoading}
          allParties={allParties}
          getParty={getParty}
          setParty={setParty}
        />
      ) : (
        <PartyGroupView
          bills={filtered}
          allParties={allParties}
          getParty={getParty}
          setParty={setParty}
        />
      )}
    </section>
  );
}
