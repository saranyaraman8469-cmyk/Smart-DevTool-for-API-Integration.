"use client";
import { useState, useEffect } from "react";
import { Bell, Search, Moon, Sun, LogOut, User as UserIcon, Code2, Globe } from "lucide-react";
import { useTheme } from "next-themes";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import { motion, AnimatePresence } from "framer-motion";

const breadcrumbMap: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/history": "History",
  "/dashboard/wrappers": "Wrappers",
  "/dashboard/analytics": "Analytics",
  "/dashboard/settings": "Settings",
};

export default function DashboardHeader() {
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();
  const router = useRouter();
  const title = breadcrumbMap[pathname] ?? "Dashboard";
  const { user, logout } = useAuth();
  
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Keyboard shortcut for search
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearchOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return (
    <>
      <header className="flex items-center justify-between px-6 py-4 border-b bg-card/50 backdrop-blur-md sticky top-0 z-40">
        {/* Title breadcrumb */}
        <div>
          <h1 className="text-foreground font-semibold text-lg">{title}</h1>
          <p className="text-muted-foreground text-xs mt-0.5">Smart DevTool AI Platform</p>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {/* Search */}
          <button 
            onClick={() => setSearchOpen(true)}
            className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl bg-foreground/5 hover:bg-foreground/10 border border-border text-muted-foreground transition-all text-sm"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search...</span>
            <kbd className="text-xs border border-border rounded px-1.5 py-0.5 bg-background text-foreground/70">⌘K</kbd>
          </button>

          {/* Notifications */}
          <div className="relative">
            <button 
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="relative p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-all" 
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-violet-500" />
            </button>
            
            <AnimatePresence>
              {notificationsOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setNotificationsOpen(false)}
                  />
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-72 rounded-xl border bg-card shadow-xl overflow-hidden z-50 flex flex-col"
                  >
                    <div className="px-4 py-3 border-b border-border/50 flex justify-between items-center">
                      <p className="text-sm font-semibold text-foreground">Notifications</p>
                      <button className="text-xs text-violet-500 hover:text-violet-400">Mark all read</button>
                    </div>
                    
                    <div className="max-h-[300px] overflow-y-auto">
                      <div className="p-3 border-b border-border/50 hover:bg-foreground/5 transition-colors cursor-pointer flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0 mt-1">
                          <Code2 className="w-4 h-4 text-emerald-500" />
                        </div>
                        <div>
                          <p className="text-sm text-foreground">SDK Wrapper Generated</p>
                          <p className="text-xs text-muted-foreground mt-0.5">Python SDK for Stripe API is ready to download.</p>
                          <p className="text-[10px] text-muted-foreground mt-1">2 hours ago</p>
                        </div>
                      </div>
                      
                      <div className="p-3 hover:bg-foreground/5 transition-colors cursor-pointer flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0 mt-1">
                          <Globe className="w-4 h-4 text-blue-500" />
                        </div>
                        <div>
                          <p className="text-sm text-foreground">New API Analyzed</p>
                          <p className="text-xs text-muted-foreground mt-0.5">GitHub REST API v3 analysis completed with 98% quality score.</p>
                          <p className="text-[10px] text-muted-foreground mt-1">1 day ago</p>
                        </div>
                      </div>
                    </div>
                    
                    <button className="w-full p-2 text-xs text-center text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-colors border-t border-border/50">
                      View all notifications
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Theme toggle */}
          {mounted && (
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-all"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          )}

          {/* Avatar & Dropdown */}
          <div className="relative ml-2">
            <button 
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-foreground text-sm font-bold shadow-lg hover:shadow-violet-500/25 transition-all focus:outline-none focus:ring-2 focus:ring-violet-500/50"
            >
              {user?.username ? user.username.charAt(0).toUpperCase() : "AI"}
            </button>

            <AnimatePresence>
              {dropdownOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setDropdownOpen(false)}
                  />
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-48 rounded-xl border bg-card shadow-xl overflow-hidden z-50 p-1"
                  >
                    <div className="px-3 py-2 border-b border-border/50 mb-1">
                      <p className="text-sm font-medium text-foreground truncate">{user?.username || "Guest User"}</p>
                      <p className="text-xs text-muted-foreground truncate">{user?.email || "guest@example.com"}</p>
                    </div>
                    
                    <button 
                      onClick={() => {
                        setDropdownOpen(false);
                        router.push('/dashboard/settings');
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground/80 hover:text-foreground hover:bg-foreground/5 rounded-lg transition-colors"
                    >
                      <UserIcon className="w-4 h-4" />
                      Profile Settings
                    </button>
                    
                    <button 
                      onClick={() => {
                        setDropdownOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-500/10 rounded-lg transition-colors mt-1"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* Search Command Palette Overlay */}
      <AnimatePresence>
        {searchOpen && (
          <div className="cmd-overlay" onClick={() => setSearchOpen(false)}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-card border rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="flex items-center px-4 py-3 border-b border-border/50">
                <Search className="w-5 h-5 text-muted-foreground mr-3" />
                <input 
                  autoFocus
                  type="text" 
                  placeholder="Search APIs, endpoints, or settings..." 
                  className="flex-1 bg-transparent border-none outline-none text-foreground text-sm"
                />
                <kbd className="text-[10px] border border-border rounded px-1.5 py-0.5 bg-foreground/5 text-muted-foreground ml-2">ESC</kbd>
              </div>
              <div className="p-2 max-h-[300px] overflow-y-auto">
                <p className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Quick Actions</p>
                <button 
                  onClick={() => {
                    setSearchOpen(false); 
                    router.push('/dashboard');
                    setTimeout(() => document.querySelector<HTMLInputElement>('input[type="url"]')?.focus(), 100);
                  }} 
                  className="w-full flex items-center px-3 py-2.5 text-sm text-foreground hover:bg-violet-500/10 hover:text-violet-500 rounded-lg transition-colors"
                >
                  Analyze new API
                </button>
                <button 
                  onClick={() => {
                    setSearchOpen(false);
                    router.push('/dashboard/wrappers');
                  }} 
                  className="w-full flex items-center px-3 py-2.5 text-sm text-foreground hover:bg-violet-500/10 hover:text-violet-500 rounded-lg transition-colors"
                >
                  View recent Wrappers
                </button>
                <button 
                  onClick={() => {
                    setSearchOpen(false);
                    router.push('/dashboard/analytics');
                  }} 
                  className="w-full flex items-center px-3 py-2.5 text-sm text-foreground hover:bg-violet-500/10 hover:text-violet-500 rounded-lg transition-colors"
                >
                  Open Analytics
                </button>
                <button 
                  onClick={() => {
                    setSearchOpen(false);
                    router.push('/dashboard/settings');
                  }} 
                  className="w-full flex items-center px-3 py-2.5 text-sm text-foreground hover:bg-violet-500/10 hover:text-violet-500 rounded-lg transition-colors"
                >
                  Manage Settings
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
