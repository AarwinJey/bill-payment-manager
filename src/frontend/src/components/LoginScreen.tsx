import { Button } from "@/components/ui/button";
import {
  Loader2,
  Receipt,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { motion } from "motion/react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

export function LoginScreen() {
  const { login, isLoggingIn } = useInternetIdentity();

  const features = [
    { icon: Receipt, label: "Track all your bills in one place" },
    { icon: Wallet, label: "Monitor payment history instantly" },
    { icon: TrendingUp, label: "Never miss a due date again" },
    { icon: TrendingDown, label: "Reduce overdue expenses" },
  ];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-4xl grid md:grid-cols-2 gap-12 items-center">
        {/* Left — Branding */}
        <motion.div
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-8"
        >
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <Receipt className="w-4 h-4" />
              BillTrack
            </div>
            <h1 className="font-display text-5xl font-bold text-foreground leading-tight">
              Manage bills
              <br />
              <span className="text-primary">effortlessly.</span>
            </h1>
            <p className="text-muted-foreground text-lg leading-relaxed">
              A clean, powerful tool to track payments, manage recurring bills,
              and stay on top of your finances.
            </p>
          </div>

          <ul className="space-y-3">
            {features.map(({ icon: Icon, label }, i) => (
              <motion.li
                key={label}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.08, duration: 0.35 }}
                className="flex items-center gap-3 text-foreground/80"
              >
                <span className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-primary" />
                </span>
                <span className="text-sm">{label}</span>
              </motion.li>
            ))}
          </ul>
        </motion.div>

        {/* Right — Login card */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-card rounded-2xl p-8 shadow-card border border-border space-y-6"
        >
          <div className="space-y-2">
            <h2 className="font-display text-2xl font-bold text-foreground">
              Sign in to continue
            </h2>
            <p className="text-muted-foreground text-sm">
              Use your secure identity to access your bills and payment history.
            </p>
          </div>

          <div className="space-y-3">
            <Button
              data-ocid="auth.primary_button"
              onClick={login}
              disabled={isLoggingIn}
              className="w-full h-12 text-base font-semibold"
              size="lg"
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Signing
                  in...
                </>
              ) : (
                "Sign In Securely"
              )}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Your data is encrypted and stored on the Internet Computer
            blockchain.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
