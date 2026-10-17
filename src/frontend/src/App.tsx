import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Toaster } from "@/components/ui/sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ChevronDown,
  History,
  LayoutDashboard,
  LogOut,
  Receipt,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { BillsTab } from "./components/BillsTab";
import { Dashboard } from "./components/Dashboard";
import { LoginScreen } from "./components/LoginScreen";
import { PaymentHistoryTab } from "./components/PaymentHistoryTab";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { useGetBills } from "./hooks/useQueries";

const SKELETON_ITEMS = ["sk-0", "sk-1", "sk-2", "sk-3"];

function AppShell() {
  const { identity, clear, isInitializing } = useInternetIdentity();
  const [activeTab, setActiveTab] = useState("dashboard");
  const { data: bills = [], isLoading: billsLoading } = useGetBills();

  const principal = identity?.getPrincipal().toString() ?? "";
  const shortPrincipal = principal
    ? `${principal.slice(0, 5)}...${principal.slice(-4)}`
    : "";
  const initials = principal ? principal.slice(0, 2).toUpperCase() : "?";

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div
          data-ocid="app.loading_state"
          className="space-y-4 w-full max-w-sm px-6"
        >
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-64" />
          <Skeleton className="h-4 w-48" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Receipt className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-lg text-foreground">
              BillTrack
            </span>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                data-ocid="nav.open_modal_button"
                variant="ghost"
                className="gap-2 h-9 px-2 text-sm"
              >
                <Avatar className="w-6 h-6">
                  <AvatarFallback className="text-xs bg-primary/15 text-primary font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden sm:inline text-muted-foreground">
                  {shortPrincipal}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              data-ocid="nav.dropdown_menu"
              align="end"
              className="w-48"
            >
              <DropdownMenuItem
                data-ocid="nav.button"
                onClick={clear}
                className="text-destructive focus:text-destructive gap-2"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6 h-10 gap-1">
              <TabsTrigger
                data-ocid="nav.tab"
                value="dashboard"
                className="gap-1.5 text-sm"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                Dashboard
              </TabsTrigger>
              <TabsTrigger
                data-ocid="nav.tab"
                value="bills"
                className="gap-1.5 text-sm"
              >
                <Receipt className="w-3.5 h-3.5" />
                Bills
              </TabsTrigger>
              <TabsTrigger
                data-ocid="nav.tab"
                value="history"
                className="gap-1.5 text-sm"
              >
                <History className="w-3.5 h-3.5" />
                History
              </TabsTrigger>
            </TabsList>

            <AnimatePresence mode="wait">
              <TabsContent value="dashboard" className="mt-0">
                {billsLoading ? (
                  <div
                    data-ocid="dashboard.loading_state"
                    className="grid grid-cols-2 lg:grid-cols-4 gap-4"
                  >
                    {SKELETON_ITEMS.map((key, i) => (
                      <Skeleton
                        key={key}
                        className="h-32 rounded-xl"
                        style={{ animationDelay: `${i * 80}ms` }}
                      />
                    ))}
                  </div>
                ) : (
                  <Dashboard bills={bills} />
                )}
              </TabsContent>

              <TabsContent value="bills" className="mt-0">
                <BillsTab />
              </TabsContent>

              <TabsContent value="history" className="mt-0">
                <PaymentHistoryTab />
              </TabsContent>
            </AnimatePresence>
          </Tabs>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-5 mt-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()}. Built with ❤️ using{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-foreground transition-colors"
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </footer>

      <Toaster richColors position="top-right" />
    </div>
  );
}

export default function App() {
  const { identity, isInitializing } = useInternetIdentity();

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div
          data-ocid="app.loading_state"
          className="flex flex-col items-center gap-3"
        >
          <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
            <Receipt className="w-5 h-5 text-primary animate-pulse" />
          </div>
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
    );
  }

  if (!identity) {
    return <LoginScreen />;
  }

  return <AppShell />;
}
