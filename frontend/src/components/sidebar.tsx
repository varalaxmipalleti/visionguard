"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Video,
  ScanSearch,
  User as UserIcon,
  Settings,
  Users2,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/auth-context";

const userNavItems = [
  { href: "/overview", icon: Sparkles, label: "Overview" },
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/cameras", icon: Video, label: "Live Cameras" },
  { href: "/media", icon: ScanSearch, label: "Media Analysis" },
  { href: "/profile", icon: UserIcon, label: "Profile" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

const adminNavItems = [
  { href: "/users", icon: Users2, label: "User Management" },
];

export function Sidebar() {
  const pathname = usePathname();
  const [activeRoute, setActiveRoute] = useState<string>(pathname);
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  useEffect(() => {
    setActiveRoute(pathname);
  }, [pathname]);

  const renderNavItem = (item: { href: string; icon: React.ElementType; label: string }) => {
    const isActive = activeRoute.startsWith(item.href);
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={() => setActiveRoute(item.href)}
        className={cn(
          "flex items-center space-x-3 px-3.5 py-3 rounded-xl transition-colors duration-150 group font-medium",
          isActive
            ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold shadow-md shadow-blue-500/20"
            : "text-slate-600 dark:text-muted-foreground hover:bg-slate-200/60 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-foreground"
        )}
      >
        <item.icon className={cn("w-5 h-5 transition-colors", isActive ? "text-white" : "text-slate-500 dark:text-muted-foreground group-hover:text-slate-900 dark:group-hover:text-foreground")} />
        <span>{item.label}</span>
      </Link>
    );
  };

  return (
    <aside className="w-64 border-r bg-white/70 dark:bg-background/50 backdrop-blur-xl h-screen flex flex-col hidden md:flex border-slate-200/80 dark:border-border/40">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-slate-200/80 dark:border-border/40 gap-2.5">
        <span className="font-cursive font-bold text-[28px] tracking-normal text-blue-600 dark:text-blue-400 select-none drop-shadow-[0_2px_8px_rgba(37,99,235,0.2)]">
          VisionGuard Ai
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {/* Standard nav — all users */}
        {userNavItems.map(renderNavItem)}

        {/* Admin-only section — visually separated */}
        {isAdmin && (
          <>
            <div className="pt-3 pb-1">
              <div className="flex items-center gap-2 px-3">
                <div className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-widest uppercase">Admin</span>
                <div className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
              </div>
            </div>
            {adminNavItems.map((item) => {
              const isActive = activeRoute.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setActiveRoute(item.href)}
                  className={cn(
                    "flex items-center space-x-3 px-3.5 py-3 rounded-xl transition-colors duration-150 group font-medium",
                    isActive
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold shadow-md shadow-blue-500/20"
                      : "text-slate-600 dark:text-muted-foreground hover:bg-slate-200/60 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-foreground"
                  )}
                >
                  <item.icon className={cn("w-5 h-5", isActive ? "text-white" : "text-slate-500 dark:text-muted-foreground group-hover:text-slate-900 dark:group-hover:text-foreground")} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </>
        )}
      </nav>

      {/* Profile Section */}
      <div className="p-4 border-t border-slate-200/80 dark:border-border/40">
        <Link
          href="/profile"
          onClick={() => setActiveRoute("/profile")}
          className="flex items-center space-x-3 px-3.5 py-3 rounded-xl border bg-white dark:bg-white/5 border-slate-200/80 dark:border-white/10 shadow-sm dark:shadow-none hover:bg-slate-50 dark:hover:bg-white/10 transition-colors duration-200"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/20 shrink-0 text-sm uppercase">
            {user?.full_name ? user.full_name.charAt(0) : (user?.email ? user.email.charAt(0) : "A")}
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-slate-800 dark:text-foreground truncate uppercase tracking-wide">
              {(user?.full_name || (user?.email ? user.email.split("@")[0] : "USER")).toUpperCase()}
            </p>
            <p className="text-xs text-slate-500 dark:text-muted-foreground truncate">
              {isAdmin ? "Administrator" : "Standard User"}
            </p>
          </div>
        </Link>
      </div>
    </aside>
  );
}
