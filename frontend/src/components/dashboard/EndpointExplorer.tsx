"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, ChevronDown, Play, Copy, Check } from "lucide-react";
import { cn, getMethodColor } from "@/lib/utils";

interface Parameter {
  name: string;
  type: string;
  location: string;
  required: boolean;
  description: string;
}

interface Endpoint {
  id: number;
  path: string;
  method: string;
  summary?: string;
  description?: string;
  parameters?: Parameter[];
  is_healthy: string;
  response_time_ms?: number;
}

interface EndpointExplorerProps {
  endpoints: Endpoint[];
  onHealthCheck?: (endpointId: number) => void;
}

function EndpointRow({ endpoint, onHealthCheck }: { endpoint: Endpoint; onHealthCheck?: (id: number) => void }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyPath = () => {
    navigator.clipboard.writeText(endpoint.path);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const healthColor = endpoint.is_healthy === "healthy" ? "bg-emerald-500" : endpoint.is_healthy === "unhealthy" ? "bg-red-500" : "bg-amber-500";

  return (
    <div className="border border-foreground/5 rounded-xl overflow-hidden">
      {/* Row header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-foreground/3 transition-colors text-left"
      >
        {expanded ? <ChevronDown className="w-3.5 h-3.5 text-foreground/30 shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 text-foreground/30 shrink-0" />}
        
        <span className={cn("px-2 py-0.5 rounded text-xs font-bold border", getMethodColor(endpoint.method))}>
          {endpoint.method}
        </span>
        
        <span className="text-foreground/80 text-sm font-mono flex-1 truncate">{endpoint.path}</span>
        
        {endpoint.summary && (
          <span className="text-foreground/30 text-xs hidden sm:block truncate max-w-xs">{endpoint.summary}</span>
        )}

        {/* Health dot */}
        <div className={cn("w-2 h-2 rounded-full shrink-0", healthColor)} title={endpoint.is_healthy} />
        
        {endpoint.response_time_ms && (
          <span className="text-foreground/30 text-xs shrink-0">{endpoint.response_time_ms}ms</span>
        )}
      </button>

      {/* Expanded detail */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-foreground/5 px-4 py-4 bg-black/20"
          >
            {endpoint.description && (
              <p className="text-foreground/50 text-xs mb-4 leading-relaxed">{endpoint.description}</p>
            )}

            {/* Parameters */}
            {endpoint.parameters && endpoint.parameters.length > 0 && (
              <div className="mb-4">
                <h4 className="text-foreground/40 text-xs font-medium uppercase tracking-wide mb-2">Parameters</h4>
                <div className="space-y-1.5">
                  {endpoint.parameters.map((param) => (
                    <div key={param.name} className="flex items-start gap-3 text-xs">
                      <code className="text-violet-300 bg-violet-500/10 px-2 py-0.5 rounded font-mono">{param.name}</code>
                      <span className="text-foreground/30">{param.type}</span>
                      <span className={cn("px-1.5 py-0.5 rounded text-xs", param.location === "path" ? "bg-amber-500/10 text-amber-400" : "bg-blue-500/10 text-blue-400")}>
                        {param.location}
                      </span>
                      {param.required && <span className="text-red-400">*</span>}
                      <span className="text-foreground/30 flex-1">{param.description}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={copyPath}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-foreground/5 hover:bg-foreground/10 text-foreground/60 hover:text-foreground text-xs transition-all"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                {copied ? "Copied!" : "Copy Path"}
              </button>
              <button
                onClick={() => onHealthCheck?.(endpoint.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-500/10 hover:bg-violet-500/20 text-violet-400 text-xs transition-all border border-violet-500/20"
              >
                <Play className="w-3 h-3" />
                Check Health
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function EndpointExplorer({ endpoints, onHealthCheck }: EndpointExplorerProps) {
  const [filter, setFilter] = useState<string>("ALL");
  const methods = ["ALL", "GET", "POST", "PUT", "DELETE", "PATCH"];

  const filtered = filter === "ALL" ? endpoints : endpoints.filter((ep) => ep.method.toUpperCase() === filter);

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-foreground font-semibold text-sm">Endpoint Explorer</h3>
        <span className="text-foreground/40 text-xs">{endpoints.length} endpoints</span>
      </div>

      {/* Method filters */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {methods.map((m) => (
          <button
            key={m}
            onClick={() => setFilter(m)}
            className={cn(
              "px-3 py-1 rounded-lg text-xs font-medium transition-all",
              filter === m
                ? "bg-violet-500 text-foreground"
                : "bg-foreground/5 text-foreground/40 hover:text-foreground hover:bg-foreground/10"
            )}
          >
            {m}
          </button>
        ))}
      </div>

      {/* Endpoint list */}
      <div className="space-y-2 max-h-96 overflow-y-auto no-scrollbar">
        {filtered.length === 0 ? (
          <p className="text-foreground/30 text-sm text-center py-8">No endpoints found.</p>
        ) : (
          filtered.map((ep) => (
            <EndpointRow key={ep.id} endpoint={ep} onHealthCheck={onHealthCheck} />
          ))
        )}
      </div>
    </div>
  );
}
