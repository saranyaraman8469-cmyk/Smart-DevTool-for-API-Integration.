"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Package, Download, Code2, Loader2, AlertCircle, FileCode, FileText, ExternalLink } from "lucide-react";
import Sidebar from "@/components/dashboard/Sidebar";
import DashboardHeader from "@/components/dashboard/Header";
import { wrappersAPI, apiDocsAPI } from "@/lib/api";
import { formatDate, cn } from "@/lib/utils";

const LANG_COLORS: Record<string, string> = {
  Python: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  TypeScript: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
  JavaScript: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
  Go: "text-teal-400 bg-teal-500/10 border-teal-500/20",
  Rust: "text-orange-400 bg-orange-500/10 border-orange-500/20",
  Java: "text-red-400 bg-red-500/10 border-red-500/20",
  "C#": "text-purple-400 bg-purple-500/10 border-purple-500/20",
  PHP: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
  Kotlin: "text-violet-400 bg-violet-500/10 border-violet-500/20",
};

export default function WrappersPage() {
  const [docs, setDocs] = useState<any[]>([]);
  const [tasks, setTasks] = useState<Record<number, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [expandedDoc, setExpandedDoc] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiDocsAPI.getAll();
        const completedDocs = res.data.filter((d: any) => d.status === "completed");
        setDocs(completedDocs);

        // Fetch wrapper tasks for each doc
        const taskMap: Record<number, any[]> = {};
        await Promise.all(
          completedDocs.map(async (doc: any) => {
            try {
              const t = await wrappersAPI.getTasks(doc.id);
              taskMap[doc.id] = t.data;
            } catch {}
          })
        );
        setTasks(taskMap);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const downloadZip = (taskId: number) => {
    window.open(wrappersAPI.getDownloadUrl(taskId), "_blank");
  };

  const downloadPostman = async (docId: number) => {
    const res = await wrappersAPI.getPostmanCollection(docId);
    const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `postman_collection_${docId}.json`;
    a.click();
  };

  const downloadOpenAPI = async (docId: number) => {
    const res = await wrappersAPI.getOpenAPISpec(docId);
    const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `openapi_spec_${docId}.json`;
    a.click();
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="mb-6">
            <h2 className="text-foreground font-bold text-xl">Generated SDK Wrappers</h2>
            <p className="text-foreground/40 text-sm mt-0.5">Download and export your generated API client libraries</p>
          </div>

          {loading && <div className="flex justify-center py-24"><Loader2 className="w-6 h-6 animate-spin text-violet-400" /></div>}

          {!loading && docs.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
              <div className="w-14 h-14 rounded-2xl bg-foreground/5 border border-foreground/10 flex items-center justify-center">
                <Package className="w-7 h-7 text-foreground/30" />
              </div>
              <h3 className="text-foreground font-semibold">No wrappers generated yet</h3>
              <p className="text-foreground/40 text-sm">Analyze an API and generate a wrapper from the dashboard.</p>
            </div>
          )}

          <div className="space-y-4">
            {docs.map((doc, i) => {
              const docTasks = tasks[doc.id] || [];
              const isExpanded = expandedDoc === doc.id;

              return (
                <motion.div
                  key={doc.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="glass-card overflow-hidden"
                >
                  {/* Doc header */}
                  <div
                    className="flex items-center gap-4 p-5 cursor-pointer hover:bg-foreground/2 transition-colors"
                    onClick={() => setExpandedDoc(isExpanded ? null : doc.id)}
                  >
                    <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0">
                      <Code2 className="w-5 h-5 text-violet-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-foreground font-semibold text-sm">{doc.title}</h3>
                      <p className="text-foreground/40 text-xs truncate">{doc.base_url}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-foreground/30 text-xs">{docTasks.length} wrapper{docTasks.length !== 1 ? "s" : ""}</span>
                      {/* Export buttons */}
                      <button
                        onClick={(e) => { e.stopPropagation(); downloadPostman(doc.id); }}
                        className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 hover:bg-orange-500/20 transition-all"
                      >
                        <FileText className="w-3 h-3" /> Postman
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); downloadOpenAPI(doc.id); }}
                        className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-teal-500/10 border border-teal-500/20 text-teal-400 hover:bg-teal-500/20 transition-all"
                      >
                        <FileCode className="w-3 h-3" /> OpenAPI
                      </button>
                    </div>
                  </div>

                  {/* Expanded wrapper tasks */}
                  {isExpanded && (
                    <div className="border-t border-foreground/5 px-5 py-4 space-y-3">
                      {docTasks.length === 0 ? (
                        <p className="text-foreground/30 text-sm text-center py-4">No SDK wrappers generated for this API yet.</p>
                      ) : (
                        docTasks.map((task) => (
                          <div key={task.id} className="flex items-center gap-4 p-4 rounded-xl bg-foreground/3 border border-foreground/5">
                            <span className={cn("px-2.5 py-1 rounded-lg text-xs font-semibold border", LANG_COLORS[task.language] || "text-foreground/60 bg-foreground/5 border-foreground/10")}>
                              {task.language}
                            </span>
                            <div className="flex-1">
                              <div className="flex items-center gap-3">
                                <span className={`status-badge ${task.status}`}>{task.status}</span>
                                {task.status === "completed" && (
                                  <span className="text-foreground/30 text-xs">Quality: <span className="text-emerald-400">{task.quality_score}</span></span>
                                )}
                              </div>
                              <p className="text-foreground/30 text-xs mt-0.5">{formatDate(task.created_at)}</p>
                            </div>
                            {task.status === "completed" && (
                              <button
                                onClick={() => downloadZip(task.id)}
                                className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg btn-primary"
                              >
                                <Download className="w-3.5 h-3.5" /> Download ZIP
                              </button>
                            )}
                            {task.status === "generating" || task.status === "reviewing" ? (
                              <Loader2 className="w-4 h-4 animate-spin text-violet-400" />
                            ) : null}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </main>
      </div>
    </div>
  );
}
