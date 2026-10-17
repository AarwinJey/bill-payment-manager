import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Clock, IndianRupee, Receipt } from "lucide-react";
import { motion } from "motion/react";
import type { Bill } from "../backend";

interface DashboardProps {
  bills: Bill[];
}

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  delay,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
    >
      <Card className="shadow-card border-border hover:shadow-card-hover transition-shadow duration-200">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground font-medium">
                {label}
              </p>
              <p className="text-3xl font-display font-bold text-foreground">
                {value}
              </p>
            </div>
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}
            >
              <Icon className="w-5 h-5" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function Dashboard({ bills }: DashboardProps) {
  const total = bills.length;
  const paid = bills.filter((b) => b.status === "paid").length;
  const unpaid = bills.filter((b) => b.status !== "paid").length;
  const totalDue = bills
    .filter((b) => b.status !== "paid")
    .reduce((sum, b) => sum + b.amount, 0);

  const stats = [
    {
      label: "Total Bills",
      value: total,
      icon: Receipt,
      color: "bg-primary/10 text-primary",
      delay: 0,
    },
    {
      label: "Paid Bills",
      value: paid,
      icon: CheckCircle2,
      color: "bg-success-muted text-success-muted-foreground",
      delay: 0.07,
    },
    {
      label: "Unpaid Bills",
      value: unpaid,
      icon: Clock,
      color: "bg-warning-muted text-warning-muted-foreground",
      delay: 0.14,
    },
    {
      label: "Total Amount Due",
      value: `₹${totalDue.toFixed(2)}`,
      icon: IndianRupee,
      color: "bg-destructive/10 text-destructive",
      delay: 0.21,
    },
  ];

  return (
    <section data-ocid="dashboard.section">
      <motion.h2
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="font-display text-xl font-bold text-foreground mb-5"
      >
        Overview
      </motion.h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </div>

      {bills.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.4 }}
          className="mt-6 grid sm:grid-cols-2 gap-4"
        >
          {/* Paid vs Unpaid visual bar */}
          <Card className="shadow-card border-border">
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground font-medium mb-3">
                Payment Progress
              </p>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl font-display font-bold text-foreground">
                  {total > 0 ? Math.round((paid / total) * 100) : 0}%
                </span>
                <span className="text-sm text-muted-foreground">
                  bills paid
                </span>
              </div>
              <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-success"
                  initial={{ width: 0 }}
                  animate={{
                    width: total > 0 ? `${(paid / total) * 100}%` : "0%",
                  }}
                  transition={{ delay: 0.5, duration: 0.7, ease: "easeOut" }}
                />
              </div>
              <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                <span>{paid} paid</span>
                <span>{unpaid} remaining</span>
              </div>
            </CardContent>
          </Card>

          {/* Upcoming bills */}
          <Card className="shadow-card border-border">
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground font-medium mb-3">
                Upcoming Unpaid
              </p>
              {unpaid === 0 ? (
                <div className="flex items-center gap-2 text-success-muted-foreground">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="text-sm font-medium">
                    All bills are paid!
                  </span>
                </div>
              ) : (
                <div className="space-y-2">
                  {bills
                    .filter((b) => b.status !== "paid")
                    .slice(0, 3)
                    .map((b) => (
                      <div
                        key={String(b.id)}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-foreground truncate max-w-[140px]">
                          {b.name}
                        </span>
                        <span className="text-warning-muted-foreground font-medium">
                          ₹{b.amount.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  {unpaid > 3 && (
                    <p className="text-xs text-muted-foreground">
                      +{unpaid - 3} more
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </section>
  );
}
