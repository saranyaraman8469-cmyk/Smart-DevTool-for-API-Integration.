"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Zap, Sparkles, Code2, Globe } from "lucide-react";
import Link from "next/link";

const DEMO_URLS = [
  "https://api.github.com/",
  "https://stripe.com/docs/api",
  "https://developers.openai.com/",
  "https://api.slack.com/",
];

export default function Hero() {
  const [demoUrl, setDemoUrl] = useState("");

  return (
    <section className="relative min-h-screen flex items-center justify-center pt-24 pb-16 px-4 overflow-hidden">
      {/* Background orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-violet-600/10 blur-[120px] animate-pulse-slow" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-indigo-600/10 blur-[100px] animate-pulse-slow" style={{ animationDelay: "2s" }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-cyan-500/5 blur-[80px]" />

      <div className="relative max-w-5xl mx-auto text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-300 text-sm font-medium mb-8"
        >
          <Sparkles className="w-4 h-4" />
          Powered by Gemini AI + LangChain Multi-Agent Pipeline
        </motion.div>

        {/* Main Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-tight tracking-tight text-foreground mb-6"
        >
          Stop reading API docs.
          <br />
          <span className="gradient-text">Let AI do it for you.</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-xl text-foreground/50 max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          Paste any API documentation URL. Our 8-agent AI pipeline crawls, analyzes, and generates
          production-ready SDK wrappers in seconds — with auth, retries, pagination, and tests included.
        </motion.p>

        {/* URL Input Demo */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto mb-8"
        >
          <div className="flex-1 relative">
            <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/30" />
            <input
              type="url"
              placeholder="https://api.stripe.com/docs"
              value={demoUrl}
              onChange={(e) => setDemoUrl(e.target.value)}
              className="w-full pl-11 pr-4 py-4 rounded-xl bg-foreground/5 border border-foreground/10 text-foreground placeholder-foreground/30 text-sm focus:outline-none focus:border-violet-500/50 focus:bg-foreground/8 transition-all backdrop-blur-sm"
            />
          </div>
          <Link
            href={`/dashboard${demoUrl ? `?url=${encodeURIComponent(demoUrl)}` : ""}`}
            className="btn-primary whitespace-nowrap"
          >
            <Zap className="w-4 h-4" />
            Analyze API
            <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>

        {/* Demo URL chips */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex flex-wrap items-center justify-center gap-2"
        >
          <span className="text-xs text-foreground/30">Try:</span>
          {DEMO_URLS.map((url) => (
            <button
              key={url}
              onClick={() => setDemoUrl(url)}
              className="text-xs px-3 py-1.5 rounded-full border border-foreground/10 bg-foreground/5 text-foreground/50 hover:text-foreground hover:border-violet-500/30 hover:bg-violet-500/10 transition-all"
            >
              {new URL(url).hostname}
            </button>
          ))}
        </motion.div>

        {/* Feature pills */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="flex flex-wrap justify-center gap-3 mt-14"
        >
          {["8 AI Agents", "9 Languages", "FAISS RAG", "SDK + Tests", "Postman Export", "OpenAPI Spec"].map((feat) => (
            <div
              key={feat}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-foreground/5 border border-foreground/8 text-xs text-foreground/60"
            >
              <Code2 className="w-3 h-3 text-violet-400" />
              {feat}
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
