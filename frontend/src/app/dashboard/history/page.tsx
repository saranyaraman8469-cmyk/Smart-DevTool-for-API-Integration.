"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { History, Globe, Loader2, AlertCircle, RefreshCw, Trash2 } from "lucide-react";
import Sidebar from "@/components/dashboard/Sidebar";
import DashboardHeader from "@/components/dashboard/Header";
import { apiDocsAPI } from "@/lib/api";
import { formatDate, cn } from "@/lib/utils";
import Link from "next/link";

export default function HistoryPage() {
  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDocs = async () => {
    setLoading(true);
    try {
      const res = await apiDocsAPI.getAll();
      setDocs(res.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadDocs(); }, []);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-foreground font-bold text-xl">Analysis History</h2>
              <p className="text-foreground/40 text-sm mt-0.5">All previously analyzed API documentation</p>
            </div>
            <button onClick={loadDocs} className="btn-secondary text-sm py-2 px-4">
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="w-6 h-6 animate-spin text-violet-400" />
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4" /> {error}
            </div>
          )}

          {!loading && docs.length === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-24 gap-4 text-center">
              <div className="w-14 h-14 rounded-2xl bg-foreground/5 border border-foreground/10 flex items-center justify-center">
                <History className="w-7 h-7 text-foreground/30" />
              </div>
              <h3 className="text-foreground font-semibold">No analyses yet</h3>
              <p className="text-foreground/40 text-sm">Go to the dashboard to analyze your first API.</p>
              <Link href="/dashboard" className="btn-primary text-sm py-2 px-5">
                Go to Dashboard
              </Link>
            </motion.div>
          )}

          {!loading && docs.length > 0 && (
            <div className="space-y-3">
              {docs.map((doc, i) => (
                <motion.div
                  key={doc.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="glass-card p-5 flex items-center gap-4 hover:-translate-y-0.5 transition-transform cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0">
                    <Globe className="w-5 h-5 text-violet-400" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-foreground font-semibold text-sm truncate">{doc.title || "Untitled API"}</h3>
                      <span className={`status-badge ${doc.status} shrink-0`}>{doc.status}</span>
                    </div>
                    <p className="text-foreground/40 text-xs truncate">{doc.url}</p>
                    <div className="flex items-center gap-4 mt-1.5">
                      <span className="text-foreground/25 text-xs">{doc.api_type}</span>
                      <span className="text-foreground/25 text-xs">{doc.base_url}</span>
                      <span className="text-foreground/25 text-xs">{formatDate(doc.created_at)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right hidden sm:block">
                      <p className="text-xs text-foreground/30">Quality</p>
                      <p className="text-sm font-bold text-emerald-400">{doc.quality_score}/100</p>
                    </div>
                    <div className="text-right hidden sm:block">
                      <p className="text-xs text-foreground/30">Security</p>
                      <p className="text-sm font-bold text-blue-400">{doc.security_score}/100</p>
                    </div>
                    <Link href={`/dashboard?url=${encodeURIComponent(doc.url)}`} className="btn-secondary text-xs py-1.5 px-3">
                      Reanalyze
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
