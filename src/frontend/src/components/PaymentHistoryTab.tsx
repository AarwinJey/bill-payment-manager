import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CheckCircle2, History } from "lucide-react";
import { motion } from "motion/react";
import { useGetPaymentHistory } from "../hooks/useQueries";

const SKELETON_ROWS = ["ph-sk-0", "ph-sk-1", "ph-sk-2", "ph-sk-3"];

function formatDate(nanos: bigint): string {
  const ms = Number(nanos) / 1_000_000;
  return new Date(ms).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function PaymentHistoryTab() {
  const { data: payments = [], isLoading, isError } = useGetPaymentHistory();

  return (
    <section data-ocid="payments.section">
      <div className="mb-5">
        <h2 className="font-display text-xl font-bold text-foreground">
          Payment History
        </h2>
        <p className="text-sm text-muted-foreground">
          {payments.length} recorded payments
        </p>
      </div>

      {isError && (
        <div
          data-ocid="payments.error_state"
          className="text-center py-12 text-destructive text-sm"
        >
          Failed to load payment history. Please refresh.
        </div>
      )}

      <div className="rounded-xl border border-border bg-card shadow-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="font-semibold text-foreground">
                Bill Name
              </TableHead>
              <TableHead className="font-semibold text-foreground">
                Amount
              </TableHead>
              <TableHead className="font-semibold text-foreground">
                Paid On
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading &&
              SKELETON_ROWS.map((id, i) => (
                <TableRow key={id}>
                  <TableCell>
                    <Skeleton
                      className="h-4 w-40"
                      style={{ animationDelay: `${i * 60}ms` }}
                    />
                  </TableCell>
                  <TableCell>
                    <Skeleton
                      className="h-4 w-20"
                      style={{ animationDelay: `${i * 60 + 20}ms` }}
                    />
                  </TableCell>
                  <TableCell>
                    <Skeleton
                      className="h-4 w-28"
                      style={{ animationDelay: `${i * 60 + 40}ms` }}
                    />
                  </TableCell>
                </TableRow>
              ))}
            {!isLoading &&
              payments.map((payment, i) => (
                <motion.tr
                  key={`${String(payment.billId)}-${String(payment.paidAt)}`}
                  data-ocid={`payments.item.${i + 1}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.25 }}
                  className="border-b border-border hover:bg-muted/30 transition-colors"
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" />
                      <span className="font-medium text-foreground">
                        {payment.billName}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono font-semibold text-foreground">
                    ₹{payment.amount.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatDate(payment.paidAt)}
                  </TableCell>
                </motion.tr>
              ))}
          </TableBody>
        </Table>

        {!isLoading && payments.length === 0 && (
          <div data-ocid="payments.empty_state" className="py-16 text-center">
            <div className="w-12 h-12 rounded-2xl bg-muted mx-auto mb-3 flex items-center justify-center">
              <History className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="font-medium text-foreground">
              No payment history yet
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Mark bills as paid to record your payment history
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
