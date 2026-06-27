import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import Features from "@/components/landing/Features";
import Pricing from "@/components/landing/Pricing";
import { Code2, Github, Twitter } from "lucide-react";
import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <Hero />
      <Features />
      <Pricing />

      {/* Footer */}
      <footer className="border-t border-foreground/5 py-12 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
              <Code2 className="w-3.5 h-3.5 text-foreground" />
            </div>
            <span className="text-foreground/60 text-sm font-medium">
              Smart<span className="text-violet-400">DevTool</span> © 2026
            </span>
          </div>
          <div className="flex items-center gap-6 text-sm text-foreground/40">
            <Link href="#" className="hover:text-foreground/70 transition-colors">Privacy</Link>
            <Link href="#" className="hover:text-foreground/70 transition-colors">Terms</Link>
            <Link href="#" className="hover:text-foreground/70 transition-colors">API</Link>
            <a href="https://github.com" className="hover:text-foreground/70 transition-colors">
              <Github className="w-4 h-4" />
            </a>
            <a href="https://twitter.com" className="hover:text-foreground/70 transition-colors">
              <Twitter className="w-4 h-4" />
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
