"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Settings, Key, Bot, Server, Save, Eye, EyeOff, Check } from "lucide-react";
import Sidebar from "@/components/dashboard/Sidebar";
import DashboardHeader from "@/components/dashboard/Header";

const PROVIDERS = [
  { id: "gemini", label: "Google Gemini", models: ["gemini-1.5-pro", "gemini-1.5-flash", "gemini-2.0-flash"] },
  { id: "openai", label: "OpenAI Compatible", models: ["gpt-4o", "gpt-4-turbo", "gpt-3.5-turbo"] },
  { id: "ollama", label: "Ollama (Local)", models: ["llama3", "mistral", "codellama", "phi3"] },
];

function SettingsSection({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) {
  return (
    <div className="glass-card p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
          <Icon className="w-4 h-4 text-violet-400" />
        </div>
        <h3 className="text-foreground font-semibold">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function KeyInput({ label, placeholder, id }: { label: string; placeholder: string; id: string }) {
  const [show, setShow] = useState(false);
  const [value, setValue] = useState("");
  const [saved, setSaved] = useState(false);

  const save = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-1.5 mb-4">
      <label htmlFor={id} className="text-foreground/50 text-xs font-medium">{label}</label>
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <input
            id={id}
            type={show ? "text" : "password"}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            className="w-full pl-4 pr-10 py-2.5 rounded-xl bg-foreground/5 border border-foreground/10 text-foreground placeholder-foreground/20 text-sm focus:outline-none focus:border-violet-500/50 transition-all font-mono"
          />
          <button
            type="button"
            onClick={() => setShow(!show)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/30 hover:text-foreground/60 transition-colors"
          >
            {show ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
        </div>
        <button onClick={save} className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${saved ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/20" : "btn-secondary"}`}>
          {saved ? <><Check className="w-3.5 h-3.5" /> Saved</> : <><Save className="w-3.5 h-3.5" /> Save</>}
        </button>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const [provider, setProvider] = useState("gemini");
  const [model, setModel] = useState("gemini-1.5-pro");
  const [embedProvider, setEmbedProvider] = useState("local");
  const [ollamaUrl, setOllamaUrl] = useState("http://localhost:11434");

  const currentProvider = PROVIDERS.find((p) => p.id === provider);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <DashboardHeader />
        <main className="flex-1 overflow-y-auto p-6 space-y-6 max-w-3xl">
          <div>
            <h2 className="text-foreground font-bold text-xl">Settings</h2>
            <p className="text-foreground/40 text-sm mt-0.5">Configure LLM providers, API keys, and system preferences</p>
          </div>

          {/* LLM Provider */}
          <SettingsSection title="LLM Provider" icon={Bot}>
            <div className="space-y-3 mb-5">
              {PROVIDERS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => { setProvider(p.id); setModel(p.models[0]); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left ${provider === p.id ? "border-violet-500/40 bg-violet-500/10" : "border-foreground/8 bg-foreground/3 hover:border-foreground/15"}`}
                >
                  <div className={`w-3 h-3 rounded-full border-2 flex items-center justify-center ${provider === p.id ? "border-violet-500" : "border-foreground/20"}`}>
                    {provider === p.id && <div className="w-1.5 h-1.5 rounded-full bg-violet-500" />}
                  </div>
                  <span className={`text-sm font-medium ${provider === p.id ? "text-foreground" : "text-foreground/60"}`}>{p.label}</span>
                </button>
              ))}
            </div>

            <div className="space-y-1.5">
              <label className="text-foreground/50 text-xs font-medium">Model</label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-foreground/5 border border-foreground/10 text-foreground text-sm focus:outline-none focus:border-violet-500/50"
              >
                {currentProvider?.models.map((m) => <option key={m} value={m} className="bg-zinc-900">{m}</option>)}
              </select>
            </div>
          </SettingsSection>

          {/* API Keys */}
          <SettingsSection title="API Keys" icon={Key}>
            <KeyInput id="gemini-key" label="Google Gemini API Key" placeholder="AIzaSy..." />
            <KeyInput id="openai-key" label="OpenAI API Key (Optional)" placeholder="sk-..." />
            {provider === "ollama" && (
              <div className="space-y-1.5">
                <label className="text-foreground/50 text-xs font-medium">Ollama Server URL</label>
                <input
                  type="url"
                  value={ollamaUrl}
                  onChange={(e) => setOllamaUrl(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-foreground/5 border border-foreground/10 text-foreground text-sm focus:outline-none focus:border-violet-500/50 font-mono"
                />
              </div>
            )}
          </SettingsSection>

          {/* Embeddings */}
          <SettingsSection title="Embeddings Provider" icon={Server}>
            <div className="flex gap-3">
              {["local", "gemini"].map((ep) => (
                <button
                  key={ep}
                  onClick={() => setEmbedProvider(ep)}
                  className={`flex-1 py-3 rounded-xl border text-sm font-medium capitalize transition-all ${embedProvider === ep ? "border-violet-500/40 bg-violet-500/10 text-violet-300" : "border-foreground/8 bg-foreground/3 text-foreground/50 hover:text-foreground"}`}
                >
                  {ep === "local" ? "🖥 Local (Sentence Transformers)" : "☁️ Google Gemini Embeddings"}
                </button>
              ))}
            </div>
            <p className="text-foreground/30 text-xs mt-3">
              {embedProvider === "local" ? "Uses all-MiniLM-L6-v2 locally. No API key required. Runs offline." : "Uses Google's embedding-001 model. Requires GOOGLE_API_KEY."}
            </p>
          </SettingsSection>
        </main>
      </div>
    </div>
  );
}
