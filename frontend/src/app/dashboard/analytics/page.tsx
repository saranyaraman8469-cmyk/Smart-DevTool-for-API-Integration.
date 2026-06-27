"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Sidebar from "@/components/dashboard/Sidebar";
import DashboardHeader from "@/components/dashboard/Header";
import { analyticsAPI } from "@/lib/api";
import { Loader2, BarChart3, TrendingUp, Shield, Code2 } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";

const COLORS = ["#7C3AED", "#4F46E5", "#06B6D4", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#3B82F6"];

export default function AnalyticsPage() {
  const [overview, setOverview] = useState<any>(null);
  const [wrappers, setWrappers] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [ov, wr] = await Promise.all([analyticsAPI.getOverview(), analyticsAPI.getWrappersSummary()]);
        setOverview(ov.data);
        setWrappers(wr.data);
      } catch (err: any) {
        setError(err.message || "Could not connect to backend. Make sure the server is running.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);


  const apiTypeData = overview ? Object.entries(overview.api_type_distribution).map(([name, value]) => ({ name, value })) : [];
  const langData = wrappers ? Object.entries(wrappers.language_distribution).map(([name, value]) => ({ name, value })) : [];
  const statusData = overview ? Object.entries(overview.status_distribution).map(([name, value]) => ({ name, value })) : [];

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          <div>
            <h2 className="text-foreground font-bold text-xl">Analytics Dashboard</h2>
            <p className="text-foreground/40 text-sm mt-0.5">Overview of your API integration activity</p>
          </div>

          {loading && <div className="flex justify-center py-24"><Loader2 className="w-6 h-6 animate-spin text-violet-400" /></div>}

          {error && !loading && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              <span>⚠️ {error}</span>
            </div>
          )}

          {!loading && overview && (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Total APIs", value: overview.total_apis, icon: BarChart3, color: "text-violet-400" },
                  { label: "Completed", value: overview.completed_apis, icon: TrendingUp, color: "text-emerald-400" },
                  { label: "Avg Security", value: `${overview.avg_security}/100`, icon: Shield, color: "text-blue-400" },
                  { label: "Avg Quality", value: `${overview.avg_quality}/100`, icon: Code2, color: "text-amber-400" },
                ].map((card) => {
                  const Icon = card.icon;
                  return (
                    <motion.div key={card.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="metric-card">
                      <Icon className={`w-5 h-5 ${card.color}`} />
                      <p className="text-foreground/40 text-xs">{card.label}</p>
                      <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
                    </motion.div>
                  );
                })}
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* API Type Pie */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-5 md:col-span-1">
                  <h3 className="text-foreground font-semibold text-sm mb-4">API Types</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={apiTypeData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name }) => name}>
                        {apiTypeData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ background: "#18181b", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, color: "#fff" }} />
                    </PieChart>
                  </ResponsiveContainer>
                </motion.div>

                {/* SDK Languages Bar */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { delay: 0.1 } }} className="glass-card p-5 md:col-span-2">
                  <h3 className="text-foreground font-semibold text-sm mb-4">Generated SDKs by Language</h3>
                  {langData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={langData}>
                        <XAxis dataKey="name" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ background: "#18181b", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, color: "#fff" }} />
                        <Bar dataKey="value" fill="#7C3AED" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-48 text-foreground/25 text-sm">No wrapper data yet</div>
                  )}
                </motion.div>
              </div>

              {/* Status Distribution */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1, transition: { delay: 0.2 } }} className="glass-card p-5">
                <h3 className="text-foreground font-semibold text-sm mb-4">Analysis Status Distribution</h3>
                <div className="flex flex-wrap gap-3">
                  {statusData.map(({ name, value }, i) => (
                    <div key={name} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-foreground/5 border border-foreground/5">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-foreground/60 text-sm capitalize">{name}</span>
                      <span className="text-foreground font-bold text-sm">{String(value)}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
