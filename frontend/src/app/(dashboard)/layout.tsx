import { Sidebar } from "@/components/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { ApiStatus } from "@/components/api-status";
import { AuthGuard } from "@/components/auth-guard";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-background text-foreground transition-colors duration-300 relative overflow-hidden font-sans">
        {/* Dynamic Background Glow */}
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-500/15 dark:bg-primary/20 rounded-full blur-[150px] opacity-60 pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/15 dark:bg-blue-500/10 rounded-full blur-[150px] opacity-60 pointer-events-none" />
        
        <Sidebar />
        <main className="flex-1 flex flex-col h-screen overflow-hidden z-10 relative">
          {/* Top Command Bar */}
          <header className="h-16 border-b border-slate-200/80 dark:border-border/40 bg-white/70 dark:bg-background/50 backdrop-blur-xl flex items-center justify-between px-8 transition-colors duration-300">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-muted-foreground">
              <span className="text-slate-800 dark:text-foreground">Surveillance Workspace</span>
              <span className="text-slate-300 dark:text-zinc-700">/</span>
              <span>Live Operations</span>
            </div>
            <div className="flex items-center space-x-2">
              <ApiStatus />
              <ThemeToggle />
            </div>
          </header>
          {/* Main Content Area */}
          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
            {children}
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}

