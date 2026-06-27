"use client";
import { motion } from "framer-motion";
import { Check, Loader2, Clock, Globe, Cpu, Database, Bot, Code2, FileText, Shield, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const PIPELINE_STEPS = [
  { id: "validate", label: "Validate URL", icon: Globe, desc: "Checking URL accessibility" },
  { id: "crawling", label: "Scrape Documentation", icon: Globe, desc: "Playwright headless crawl" },
  { id: "chunking", label: "Split & Chunk Text", icon: Database, desc: "RecursiveCharacterSplitter" },
  { id: "embedding", label: "Generate Embeddings", icon: Cpu, desc: "Sentence Transformers" },
  { id: "indexing", label: "Store in FAISS", icon: Database, desc: "Vector similarity index" },
  { id: "analyzing", label: "AI Agents Analysis", icon: Bot, desc: "8 specialized agents" },
  { id: "extracting", label: "Extract API Info", icon: FileText, desc: "Endpoints, auth, schemas" },
  { id: "reviewing", label: "Code Review", icon: Code2, desc: "Quality scoring" },
  { id: "security", label: "Security Scan", icon: Shield, desc: "Vulnerability analysis" },
  { id: "completed", label: "Pipeline Complete", icon: Check, desc: "Ready to generate wrappers" },
];

const STATUS_ORDER = ["pending", "crawling", "chunking", "analyzing", "completed", "failed"];

interface PipelineVisualizerProps {
  status: string;
  errorLog?: string;
}

function getStepStatus(stepId: string, docStatus: string): "completed" | "active" | "pending" | "failed" {
  const statusToStep: Record<string, number> = {
    pending: 0,
    crawling: 1,
    chunking: 2,
    analyzing: 5,
    completed: 10,
    failed: -1,
  };
  const stepIndex = PIPELINE_STEPS.findIndex((s) => s.id === stepId);
  const currentStepIndex = statusToStep[docStatus] ?? 0;
  
  if (docStatus === "failed") return "failed";
  if (stepIndex < currentStepIndex) return "completed";
  if (stepIndex === currentStepIndex) return "active";
  return "pending";
}

export default function PipelineVisualizer({ status, errorLog }: PipelineVisualizerProps) {
  return (
    <div className="glass-card p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
          <Bot className="w-4 h-4 text-violet-400" />
        </div>
        <div>
          <h3 className="text-foreground font-semibold text-sm">AI Pipeline Progress</h3>
          <p className="text-foreground/40 text-xs">Multi-agent analysis workflow</p>
        </div>
        <div className="ml-auto">
          <span className={cn("status-badge", status)}>
            {status === "analyzing" && <Loader2 className="w-3 h-3 animate-spin" />}
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        </div>
      </div>

      <div className="space-y-2">
        {PIPELINE_STEPS.map((step, index) => {
          const Icon = step.icon;
          const stepStatus = getStepStatus(step.id, status);

          return (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={cn("pipeline-step", stepStatus)}
            >
              {/* Step indicator */}
              <div className={cn(
                "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold",
                stepStatus === "completed" && "bg-emerald-500/20 text-emerald-400",
                stepStatus === "active" && "bg-violet-500/20 text-violet-400",
                stepStatus === "failed" && "bg-red-500/20 text-red-400",
                stepStatus === "pending" && "bg-foreground/5 text-foreground/20",
              )}>
                {stepStatus === "completed" ? (
                  <Check className="w-3.5 h-3.5" />
                ) : stepStatus === "active" ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : stepStatus === "failed" ? (
                  <AlertCircle className="w-3.5 h-3.5" />
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>

              {/* Step info */}
              <div className="flex-1 min-w-0">
                <p className={cn(
                  "text-xs font-medium",
                  stepStatus === "completed" && "text-emerald-300",
                  stepStatus === "active" && "text-violet-300",
                  stepStatus === "failed" && "text-red-300",
                  stepStatus === "pending" && "text-foreground/30",
                )}>
                  {step.label}
                </p>
                <p className="text-xs text-foreground/20 truncate">{step.desc}</p>
              </div>

              {/* Icon */}
              <Icon className={cn(
                "w-3.5 h-3.5 shrink-0",
                stepStatus === "completed" && "text-emerald-400/60",
                stepStatus === "active" && "text-violet-400/60",
                stepStatus === "failed" && "text-red-400/60",
                stepStatus === "pending" && "text-foreground/10",
              )} />
            </motion.div>
          );
        })}
      </div>
      
      {status === "failed" && errorLog && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="whitespace-pre-wrap break-words">{errorLog}</div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
