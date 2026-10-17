import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Loader2,
  Upload,
  X,
} from "lucide-react";
import { useCallback, useId, useRef, useState } from "react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { usePartyAssignments } from "../hooks/usePartyAssignments";
import { useCreateBill } from "../hooks/useQueries";

const VALID_PAYMENT_METHODS = ["Cash", "Cheque", "UPI", "Online"];

interface ParsedRow {
  name: string;
  category: string;
  amount: number;
  dueDate: string;
  date: string;
  paymentMethod: string;
  chequeNumber: string | null;
  upiId: string | null;
  party: string;
  invoiceNumber: string;
  errors: string[];
  rowIndex: number;
}

function parseExcelDate(value: unknown): string {
  if (typeof value === "number") {
    // Excel serial date: days since 1899-12-30
    const date = new Date(Math.round((value - 25569) * 86400 * 1000));
    const y = date.getUTCFullYear();
    const m = String(date.getUTCMonth() + 1).padStart(2, "0");
    const d = String(date.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  if (typeof value === "string") {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value.trim())) return value.trim();
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString().split("T")[0];
    }
  }
  return String(value ?? "");
}

function parseRows(data: unknown[][]): ParsedRow[] {
  if (data.length < 2) return [];
  const header = (data[0] as string[]).map((h) =>
    String(h ?? "")
      .trim()
      .toLowerCase(),
  );

  const colIndex = {
    date: header.findIndex((h) => h === "date"),
    party: header.findIndex((h) => h.includes("party") || h.includes("vendor")),
    invoiceNumber: header.findIndex(
      (h) => h.includes("invoice") || h.includes("invoice number"),
    ),
    amount: header.findIndex((h) => h === "amount"),
    dueDate: header.findIndex((h) => h.includes("due")),
    paymentMethod: header.findIndex(
      (h) => h.includes("payment method") || h.includes("method"),
    ),
  };

  return data
    .slice(1)
    .map((row, i) => {
      const get = (idx: number) =>
        idx >= 0 ? String(row[idx] ?? "").trim() : "";
      const errors: string[] = [];

      const dateRaw = colIndex.date >= 0 ? row[colIndex.date] : "";
      const date = parseExcelDate(dateRaw);
      const party = get(colIndex.party);
      const invoiceNumber = get(colIndex.invoiceNumber);
      const amountRaw = get(colIndex.amount);
      const dueDateRaw = colIndex.dueDate >= 0 ? row[colIndex.dueDate] : "";
      const paymentMethod = get(colIndex.paymentMethod);

      if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date))
        errors.push("Date must be YYYY-MM-DD");
      if (!invoiceNumber) errors.push("Invoice Number is required");
      const amount = Number.parseFloat(amountRaw);
      if (!amountRaw || Number.isNaN(amount))
        errors.push("Amount must be a number");
      const dueDate = parseExcelDate(dueDateRaw);
      if (!dueDate || !/^\d{4}-\d{2}-\d{2}$/.test(dueDate))
        errors.push("Due Date must be YYYY-MM-DD");
      if (!paymentMethod) {
        errors.push("Payment Method is required");
      } else if (!VALID_PAYMENT_METHODS.includes(paymentMethod)) {
        errors.push(
          `Payment Method must be one of: ${VALID_PAYMENT_METHODS.join(", ")}`,
        );
      }

      return {
        name: invoiceNumber || `INV-${i + 1}`,
        category: "Other",
        amount: Number.isNaN(amount) ? 0 : amount,
        dueDate,
        date,
        paymentMethod,
        chequeNumber: null,
        upiId: null,
        party,
        invoiceNumber,
        errors,
        rowIndex: i + 2,
      };
    })
    .filter((r) => r.invoiceNumber || r.amount);
}

function downloadTemplate() {
  const ws = XLSX.utils.aoa_to_sheet([
    ["Date", "Party", "Invoice Number", "Amount", "Due Date", "Payment Method"],
    ["2026-04-01", "City Power Corp", "INV-001", 120.5, "2026-04-30", "Cash"],
    ["2026-04-02", "Sharma Traders", "INV-002", 2500, "2026-05-02", "Cheque"],
    ["2026-04-03", "Rahul Enterprises", "INV-003", 15.99, "2026-05-03", "UPI"],
  ]);
  ws["!cols"] = [12, 18, 16, 10, 12, 16].map((wch: number) => ({ wch }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Bills");
  XLSX.writeFile(wb, "bills-template.xlsx");
}

interface ImportBillsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ImportBillsDialog({
  open,
  onOpenChange,
}: ImportBillsDialogProps) {
  const fileInputId = useId();
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [isImporting, setIsImporting] = useState(false);
  const [importDone, setImportDone] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const createBill = useCreateBill();
  const { setParty } = usePartyAssignments();

  const validRows = rows.filter((r) => r.errors.length === 0);
  const invalidRows = rows.filter((r) => r.errors.length > 0);

  const processFile = useCallback((file: File) => {
    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      toast.error("Please upload an .xlsx or .xls file");
      return;
    }
    setFileName(file.name);
    setImportDone(false);
    setImportProgress(0);
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const wb = XLSX.read(data, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json<unknown[]>(ws, {
        header: 1,
        defval: "",
      });
      const parsed = parseRows(json as unknown[][]);
      setRows(parsed);
    };
    reader.readAsArrayBuffer(file);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile],
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleImport = async () => {
    if (validRows.length === 0) return;
    setIsImporting(true);
    setImportProgress(0);
    let successCount = 0;
    for (let i = 0; i < validRows.length; i++) {
      const row = validRows[i];
      try {
        const newBillId = await createBill.mutateAsync({
          name: row.name,
          category: row.category,
          amount: row.amount,
          dueDate: row.dueDate,
          paymentMethod: row.paymentMethod,
          chequeNumber: row.chequeNumber,
          upiId: row.upiId,
        });
        if (row.party && newBillId !== undefined) {
          setParty(newBillId as bigint, row.party);
        }
        successCount++;
      } catch {
        // continue
      }
      setImportProgress(Math.round(((i + 1) / validRows.length) * 100));
    }
    setIsImporting(false);
    setImportDone(true);
    toast.success(
      `${successCount} bill${successCount !== 1 ? "s" : ""} imported successfully`,
    );
  };

  const handleClose = () => {
    if (isImporting) return;
    setRows([]);
    setFileName("");
    setImportProgress(0);
    setImportDone(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        data-ocid="import.dialog"
        className="max-w-4xl max-h-[90vh] flex flex-col"
      >
        <DialogHeader>
          <DialogTitle className="font-display text-lg flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-primary" />
            Import Bills from Excel
          </DialogTitle>
          <DialogDescription>
            Upload an .xlsx or .xls file to bulk-import bills. Required columns:
            Date, Invoice Number, Amount, Due Date, Payment Method.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {/* Template download */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border">
            <div className="text-sm">
              <p className="font-medium text-foreground">Need the template?</p>
              <p className="text-muted-foreground text-xs mt-0.5">
                Download a sample Excel file with the correct column headers.
              </p>
            </div>
            <Button
              data-ocid="import.secondary_button"
              variant="outline"
              size="sm"
              onClick={downloadTemplate}
              className="gap-2 shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              Template
            </Button>
          </div>

          {/* Drop zone */}
          <label
            htmlFor={fileInputId}
            data-ocid="import.dropzone"
            onDrop={handleDrop}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            className={`relative block border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
              isDragOver
                ? "border-primary bg-primary/5 scale-[1.01]"
                : "border-border hover:border-primary/50 hover:bg-muted/30"
            }`}
          >
            <input
              ref={fileInputRef}
              id={fileInputId}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={handleFileChange}
              data-ocid="import.upload_button"
            />
            {fileName ? (
              <div className="flex items-center justify-center gap-3">
                <FileSpreadsheet className="w-8 h-8 text-primary" />
                <div className="text-left">
                  <p className="font-medium text-foreground">{fileName}</p>
                  <p className="text-xs text-muted-foreground">
                    {rows.length} rows found · Click to change file
                  </p>
                </div>
              </div>
            ) : (
              <div>
                <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="font-medium text-foreground">
                  Drop your Excel file here
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  or click to browse · .xlsx and .xls supported
                </p>
              </div>
            )}
          </label>

          {/* Preview table */}
          {rows.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <p className="text-sm font-medium text-foreground">Preview</p>
                <span className="text-xs px-2 py-0.5 rounded-full bg-success-muted text-success-muted-foreground font-medium">
                  {validRows.length} valid
                </span>
                {invalidRows.length > 0 && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-destructive/10 text-destructive font-medium">
                    {invalidRows.length} with errors
                  </span>
                )}
              </div>

              <div className="rounded-lg border border-border overflow-hidden">
                <div className="overflow-x-auto max-h-64 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50 hover:bg-muted/50">
                        <TableHead className="text-xs font-semibold w-8">
                          #
                        </TableHead>
                        <TableHead className="text-xs font-semibold">
                          Date
                        </TableHead>
                        <TableHead className="text-xs font-semibold">
                          Party
                        </TableHead>
                        <TableHead className="text-xs font-semibold">
                          Invoice No.
                        </TableHead>
                        <TableHead className="text-xs font-semibold">
                          Amount
                        </TableHead>
                        <TableHead className="text-xs font-semibold">
                          Due Date
                        </TableHead>
                        <TableHead className="text-xs font-semibold">
                          Method
                        </TableHead>
                        <TableHead className="text-xs font-semibold">
                          Status
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.map((row, i) => (
                        <TableRow
                          key={row.rowIndex}
                          data-ocid={`import.row.${i + 1}`}
                          className={
                            row.errors.length > 0 ? "bg-destructive/5" : ""
                          }
                        >
                          <TableCell className="text-xs text-muted-foreground">
                            {row.rowIndex}
                          </TableCell>
                          <TableCell className="text-xs">
                            {row.date || "—"}
                          </TableCell>
                          <TableCell className="text-xs">
                            {row.party ? (
                              <span className="px-1.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                                {row.party}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-xs font-medium">
                            {row.invoiceNumber || (
                              <span className="text-muted-foreground italic">
                                —
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-xs font-mono">
                            {row.amount ? `₹${row.amount.toFixed(2)}` : "—"}
                          </TableCell>
                          <TableCell className="text-xs">
                            {row.dueDate || "—"}
                          </TableCell>
                          <TableCell className="text-xs">
                            {row.paymentMethod || "—"}
                          </TableCell>
                          <TableCell className="text-xs">
                            {row.errors.length === 0 ? (
                              <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                                <CheckCircle2 className="w-3 h-3" /> Valid
                              </span>
                            ) : (
                              <span
                                className="flex items-center gap-1 text-destructive"
                                title={row.errors.join(" · ")}
                              >
                                <AlertCircle className="w-3 h-3 shrink-0" />
                                <span className="truncate max-w-[120px]">
                                  {row.errors[0]}
                                </span>
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}

          {/* Import progress */}
          {isImporting && (
            <div data-ocid="import.loading_state" className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Importing bills...
                </span>
                <span className="font-medium text-foreground">
                  {importProgress}%
                </span>
              </div>
              <Progress value={importProgress} className="h-2" />
            </div>
          )}

          {importDone && (
            <div
              data-ocid="import.success_state"
              className="flex items-center gap-2 p-3 rounded-lg bg-success-muted/50 text-success-muted-foreground border border-success-muted/50"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span className="text-sm font-medium">
                {validRows.length} bills imported successfully!
              </span>
            </div>
          )}
        </div>

        <DialogFooter className="pt-2 border-t border-border">
          <Button
            data-ocid="import.cancel_button"
            variant="ghost"
            onClick={handleClose}
            disabled={isImporting}
            className="gap-2"
          >
            <X className="w-3.5 h-3.5" />
            {importDone ? "Close" : "Cancel"}
          </Button>
          {!importDone && (
            <Button
              data-ocid="import.primary_button"
              onClick={handleImport}
              disabled={validRows.length === 0 || isImporting}
              className="gap-2"
            >
              {isImporting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              {isImporting
                ? "Importing..."
                : `Import ${validRows.length} Bill${validRows.length !== 1 ? "s" : ""}`}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
