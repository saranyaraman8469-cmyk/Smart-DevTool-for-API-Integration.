"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Code2, LayoutDashboard, History, Package, BarChart3, Settings, ChevronLeft, ChevronRight, Zap, Check, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "History", href: "/dashboard/history", icon: History },
  { label: "Wrappers", href: "/dashboard/wrappers", icon: Package },
  { label: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const [proModalOpen, setProModalOpen] = useState(false);

  return (
    <>
      <motion.aside
        animate={{ width: collapsed ? 64 : 240 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="relative flex flex-col h-full border-r border-border bg-card/50 backdrop-blur-md"
      >
        {/* Logo */}
        <div className={cn("flex items-center px-4 py-5 border-b border-border", collapsed ? "justify-center" : "gap-3")}>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-lg shadow-violet-500/20">
            <Code2 className="w-4 h-4 text-foreground" />
          </div>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="font-bold text-foreground text-sm tracking-tight"
            >
              Smart<span className="text-violet-600 dark:text-violet-400">DevTool</span>
            </motion.span>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn("nav-item", isActive && "active", collapsed && "justify-center px-2")}
                title={collapsed ? item.label : undefined}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {!collapsed && (
                  <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    {item.label}
                  </motion.span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Pro badge */}
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mx-3 mb-3 p-3 rounded-xl bg-gradient-to-br from-violet-500/10 to-indigo-500/5 border border-violet-500/20"
          >
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
              <span className="text-xs font-semibold text-violet-700 dark:text-violet-300">Upgrade to Pro</span>
            </div>
            <p className="text-xs text-muted-foreground mb-3">Unlimited APIs & all 9 languages.</p>
            <button onClick={() => setProModalOpen(true)} className="w-full text-xs btn-primary py-1.5 shadow-md hover:shadow-lg">Upgrade Now</button>
          </motion.div>
        )}

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-all shadow-md z-10"
          aria-label="Toggle sidebar"
        >
          {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>
      </motion.aside>

      {/* Upgrade Pro Modal */}
      <AnimatePresence>
        {proModalOpen && (
          <div className="modal-overlay" onClick={() => setProModalOpen(false)}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md bg-card border rounded-2xl shadow-2xl p-6"
            >
              <button 
                onClick={() => setProModalOpen(false)}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-muted-foreground hover:bg-accent transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              
              <div className="flex flex-col items-center text-center mb-6">
                <div className="w-12 h-12 rounded-full bg-violet-500/10 flex items-center justify-center mb-3">
                  <Zap className="w-6 h-6 text-violet-500" />
                </div>
                <h2 className="text-2xl font-bold text-foreground">Upgrade to Pro</h2>
                <p className="text-sm text-muted-foreground mt-1">Unlock the full power of Smart DevTool AI</p>
              </div>
              
              <div className="space-y-3 mb-6">
                {[
                  "Unlimited API ingestions",
                  "All 9 supported programming languages",
                  "Priority AI generation speed",
                  "Advanced security vulnerability scans",
                  "Export to Postman and OpenAPI"
                ].map((feature, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm text-foreground">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 text-emerald-500" />
                    </div>
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
              
              <div className="p-4 rounded-xl border bg-accent/50 mb-6 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-foreground">Pro Plan</p>
                  <p className="text-xs text-muted-foreground">Billed monthly</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-foreground">$29<span className="text-sm text-muted-foreground font-normal">/mo</span></p>
                </div>
              </div>
              
              <button className="w-full btn-primary" onClick={() => setProModalOpen(false)}>
                Continue to Checkout
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
