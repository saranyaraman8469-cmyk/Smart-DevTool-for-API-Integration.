"use client";
import { motion } from "framer-motion";
import {
  Globe, Shield, Zap, Code2, FileText, Download, MessageSquare,
  BarChart3, Bot, Layers, Search, Lock
} from "lucide-react";

const features = [
  {
    icon: Bot,
    title: "8 Specialized AI Agents",
    description: "Doc Analyzer, Auth Detector, Endpoint Extractor, SDK Finder, Wrapper Generator, README Writer, Code Reviewer, Security Analyzer.",
    color: "from-violet-500/20 to-purple-500/10",
    border: "border-violet-500/20",
    iconColor: "text-violet-400",
  },
  {
    icon: Globe,
    title: "Universal Doc Crawler",
    description: "Playwright headless browser + BeautifulSoup crawls static HTML and JavaScript-rendered Swagger, ReDoc, Docusaurus sites.",
    color: "from-blue-500/20 to-cyan-500/10",
    border: "border-blue-500/20",
    iconColor: "text-blue-400",
  },
  {
    icon: Code2,
    title: "9-Language SDK Generator",
    description: "Generates type-safe wrappers for Python, TypeScript, JavaScript, Go, Rust, Java, C#, PHP, and Kotlin with full auth and error handling.",
    color: "from-emerald-500/20 to-green-500/10",
    border: "border-emerald-500/20",
    iconColor: "text-emerald-400",
  },
  {
    icon: Shield,
    title: "Security Risk Analysis",
    description: "Agent 8 scans auth patterns, endpoint exposure, and transport protocols, assigning a scored security audit report.",
    color: "from-red-500/20 to-orange-500/10",
    border: "border-red-500/20",
    iconColor: "text-red-400",
  },
  {
    icon: MessageSquare,
    title: "Chat with Your Docs",
    description: "Ask natural language questions about any API. Our RAG pipeline retrieves context from FAISS and answers via Gemini AI.",
    color: "from-indigo-500/20 to-violet-500/10",
    border: "border-indigo-500/20",
    iconColor: "text-indigo-400",
  },
  {
    icon: Download,
    title: "One-Click Export",
    description: "Download a complete ZIP package including the SDK client, README, unit tests, Postman Collection, and OpenAPI 3.0 spec.",
    color: "from-cyan-500/20 to-blue-500/10",
    border: "border-cyan-500/20",
    iconColor: "text-cyan-400",
  },
  {
    icon: Layers,
    title: "FAISS Vector Search",
    description: "Documentation text is chunked, embedded with Sentence Transformers, and stored in FAISS for precise semantic retrieval.",
    color: "from-amber-500/20 to-yellow-500/10",
    border: "border-amber-500/20",
    iconColor: "text-amber-400",
  },
  {
    icon: BarChart3,
    title: "API Complexity Metrics",
    description: "Visual gauges displaying Code Quality Score, API Complexity Meter, and Security Risk Score across all your integrated APIs.",
    color: "from-pink-500/20 to-rose-500/10",
    border: "border-pink-500/20",
    iconColor: "text-pink-400",
  },
  {
    icon: Zap,
    title: "Multi-Provider LLM Support",
    description: "Switch between Google Gemini, OpenAI-compatible APIs, or run locally with Ollama. Zero lock-in to one provider.",
    color: "from-yellow-500/20 to-amber-500/10",
    border: "border-yellow-500/20",
    iconColor: "text-yellow-400",
  },
];

export default function Features() {
  return (
    <section id="features" className="py-24 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-300 text-sm font-medium mb-6">
            <Zap className="w-4 h-4" />
            Packed with powerful features
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">
            Everything you need to <span className="gradient-text">integrate any API</span>
          </h2>
          <p className="text-foreground/50 text-lg max-w-2xl mx-auto">
            From documentation crawling to production-ready SDK generation, our AI pipeline handles the entire integration workflow.
          </p>
        </motion.div>

        {/* Features grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                whileHover={{ y: -5, scale: 1.01 }}
                className={`glass-card p-6 bg-gradient-to-br ${feature.color} border ${feature.border} cursor-default group`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 bg-black/30 group-hover:scale-110 transition-transform`}>
                  <Icon className={`w-5 h-5 ${feature.iconColor}`} />
                </div>
                <h3 className="text-foreground font-semibold text-base mb-2">{feature.title}</h3>
                <p className="text-foreground/50 text-sm leading-relaxed">{feature.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
