"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Globe, Zap, Code2, AlertCircle, Loader2, ChevronDown } from "lucide-react";
import Sidebar from "@/components/dashboard/Sidebar";
import DashboardHeader from "@/components/dashboard/Header";
import PipelineVisualizer from "@/components/dashboard/PipelineVisualizer";
import MetricCards from "@/components/dashboard/MetricCards";
import AuthFlowDiagram from "@/components/dashboard/AuthFlowDiagram";
import EndpointExplorer from "@/components/dashboard/EndpointExplorer";
import ChatInterface from "@/components/dashboard/ChatInterface";
import { apiDocsAPI, wrappersAPI } from "@/lib/api";

const LANGUAGES = ["Python", "TypeScript", "JavaScript", "Go", "Rust", "Java", "C#", "PHP", "Kotlin"];
const POLL_INTERVAL = 3000;

function DashboardContent() {
  const searchParams = useSearchParams();
  const [url, setUrl] = useState(searchParams.get("url") || "");
  const [language, setLanguage] = useState("Python");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [doc, setDoc] = useState<any>(null);
  const [endpoints, setEndpoints] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"pipeline" | "endpoints" | "auth" | "chat" | "metrics">("pipeline");

  // Poll for document status until completed
  useEffect(() => {
    if (!doc || doc.status === "completed" || doc.status === "failed") return;
    const timer = setInterval(async () => {
      try {
        const res = await apiDocsAPI.getById(doc.id);
        setDoc(res.data);
        if (res.data.status === "completed") {
          const epRes = await apiDocsAPI.getEndpoints(doc.id);
          setEndpoints(epRes.data);
          clearInterval(timer);
        }
      } catch {}
    }, POLL_INTERVAL);
    return () => clearInterval(timer);
  }, [doc]);

  const handleIngest = async () => {
    if (!url.trim()) return;
    setLoading(true);
    setError(null);
    setDoc(null);
    setEndpoints([]);
    try {
      const res = await apiDocsAPI.ingest(url.trim(), language);
      setDoc(res.data);
      if (res.data.status === "completed") {
        const epRes = await apiDocsAPI.getEndpoints(res.data.id);
        setEndpoints(epRes.data);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateWrapper = async () => {
    if (!doc) return;
    try {
      await wrappersAPI.generate(doc.id, language);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleHealthCheck = async (endpointId: number) => {
    if (!doc) return;
    try {
      const res = await apiDocsAPI.checkEndpointHealth(doc.id, endpointId);
      setEndpoints((prev) => prev.map((ep) => ep.id === endpointId ? res.data : ep));
    } catch {}
  };

  const authConfig = doc?.auth_configs?.[0];

  const tabs = [
    { id: "pipeline", label: "Pipeline" },
    { id: "metrics", label: "Metrics" },
    { id: "endpoints", label: `Endpoints (${endpoints.length})` },
    { id: "auth", label: "Auth Flow" },
    { id: "chat", label: "AI Chat" },
  ];

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* URL Ingestion Card */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
            <h2 className="text-foreground font-semibold text-base mb-1">Analyze API Documentation</h2>
            <p className="text-muted-foreground text-xs mb-5">Paste any API documentation URL to start the AI pipeline</p>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleIngest()}
                  placeholder="https://api.stripe.com/docs or any API documentation URL"
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-background border border-border text-foreground placeholder:text-muted-foreground/70 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all shadow-sm"
                />
              </div>

              {/* Language selector */}
              <div className="relative">
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="appearance-none pl-4 pr-8 py-3 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 cursor-pointer shadow-sm"
                >
                  {LANGUAGES.map((l) => <option key={l} value={l} className="bg-background text-foreground">{l}</option>)}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>

              <button
                onClick={handleIngest}
                disabled={loading || !url.trim()}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                {loading ? "Analyzing..." : "Analyze API"}
              </button>

              {doc?.status === "completed" && (
                <button onClick={handleGenerateWrapper} className="btn-secondary whitespace-nowrap">
                  <Code2 className="w-4 h-4" />
                  Generate {language} SDK
                </button>
              )}
            </div>

            {error && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </motion.div>
            )}

            {doc && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3 mt-4 p-3 rounded-xl bg-card border border-border shadow-sm">
                <div className="flex-1">
                  <p className="text-foreground font-medium text-sm">{doc.title || "Loading API info..."}</p>
                  <p className="text-muted-foreground text-xs mt-0.5">{doc.base_url || doc.url}</p>
                </div>
                <span className={`status-badge ${doc.status}`}>
                  {doc.status === "analyzing" && <Loader2 className="w-3 h-3 animate-spin" />}
                  {doc.status}
                </span>
              </motion.div>
            )}
          </motion.div>

          {/* Tabs */}
          {doc && (
            <>
              <div className="flex gap-1 p-1 rounded-xl bg-accent/50 border border-border w-fit">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id ? "bg-violet-600 text-foreground shadow-md" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  {activeTab === "pipeline" && <PipelineVisualizer status={doc.status} errorLog={doc.error_log} />}
                  {activeTab === "metrics" && <MetricCards complexityScore={doc.complexity_score || 0} qualityScore={doc.quality_score || 0} securityScore={doc.security_score || 0} />}
                  {activeTab === "endpoints" && <EndpointExplorer endpoints={endpoints} onHealthCheck={handleHealthCheck} />}
                  {activeTab === "auth" && authConfig && (
                    <AuthFlowDiagram
                      authType={authConfig.auth_type}
                      headerName={authConfig.header_name}
                      tokenUrl={authConfig.token_url}
                      description={authConfig.description}
                      rateLimitLimit={authConfig.rate_limit_limit}
                      rateLimitWindow={authConfig.rate_limit_window}
                    />
                  )}
                  {activeTab === "chat" && doc.status === "completed" && <ChatInterface docId={doc.id} />}
                </div>

                <div className="space-y-6">
                  <PipelineVisualizer status={doc.status} errorLog={doc.error_log} />
                  {doc.status === "completed" && (
                    <div className="glass-card p-5">
                      <h3 className="text-foreground font-semibold text-sm mb-3">API Summary</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Type</span>
                          <span className="text-violet-600 dark:text-violet-400 font-medium">{doc.api_type}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Base URL</span>
                          <span className="text-foreground/80 truncate max-w-32 font-mono">{doc.base_url}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Endpoints</span>
                          <span className="text-foreground/80">{endpoints.length}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Empty state */}
          {!doc && !loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-24 text-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                <Globe className="w-8 h-8 text-violet-600 dark:text-violet-400" />
              </div>
              <h3 className="text-foreground font-semibold text-lg">Ready to analyze your first API?</h3>
              <p className="text-muted-foreground text-sm max-w-sm">Paste any API documentation URL above and our 8-agent AI pipeline will analyze it in seconds.</p>
            </motion.div>
          )}
        </main>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-violet-400" /></div>}>
      <DashboardContent />
    </Suspense>
  );
}
