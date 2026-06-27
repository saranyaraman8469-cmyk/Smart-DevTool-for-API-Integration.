"use client";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, User, Trash2, Loader2, MessageSquare, Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { chatAPI } from "@/lib/api";
import { formatDate } from "@/lib/utils";

interface Message {
  id: number;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

interface ChatInterfaceProps {
  docId: number;
  initialHistory?: Message[];
}

export default function ChatInterface({ docId, initialHistory = [] }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>(initialHistory);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => endRef.current?.scrollIntoView({ behavior: "smooth" });

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMsg: Message = {
      id: Date.now(),
      role: "user",
      content: input.trim(),
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await chatAPI.send(docId, userMsg.content);
      const data = res.data;
      setMessages(data.history || [...messages, userMsg, { id: Date.now() + 1, role: "assistant", content: data.answer, created_at: new Date().toISOString() }]);
    } catch (err: any) {
      setMessages((prev) => [...prev, {
        id: Date.now() + 1,
        role: "assistant",
        content: `⚠️ Error: ${err.message}. Please ensure the API is analyzed and try again.`,
        created_at: new Date().toISOString(),
      }]);
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = async () => {
    try {
      await chatAPI.clearHistory(docId);
      setMessages([]);
    } catch {}
  };

  const suggestions = [
    "How do I authenticate with this API?",
    "What endpoints are available?",
    "Show me a pagination example",
    "What are the rate limits?",
  ];

  return (
    <div className="glass-card flex flex-col h-[600px]">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-foreground/5">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-violet-500/20 flex items-center justify-center">
            <MessageSquare className="w-3.5 h-3.5 text-violet-400" />
          </div>
          <div>
            <h3 className="text-foreground font-semibold text-sm">AI Chat</h3>
            <p className="text-foreground/30 text-xs">RAG-powered documentation assistant</p>
          </div>
        </div>
        <button
          onClick={clearHistory}
          className="p-1.5 rounded-lg text-foreground/30 hover:text-red-400 hover:bg-red-500/10 transition-all"
          title="Clear history"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
        {messages.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center h-full gap-4">
            <div className="w-12 h-12 rounded-2xl bg-violet-500/20 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-violet-400" />
            </div>
            <p className="text-foreground/40 text-sm text-center">
              Ask anything about this API documentation.<br />I'll retrieve the most relevant context for you.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-xs">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => setInput(s)}
                  className="text-left text-xs px-3 py-2.5 rounded-xl border border-foreground/8 bg-foreground/5 text-foreground/50 hover:text-foreground hover:border-violet-500/30 hover:bg-violet-500/10 transition-all"
                >
                  {s}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        <AnimatePresence>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
            >
              {/* Avatar */}
              <div className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center ${msg.role === "user" ? "bg-violet-500" : "bg-foreground/10"}`}>
                {msg.role === "user" ? <User className="w-3.5 h-3.5 text-foreground" /> : <Bot className="w-3.5 h-3.5 text-foreground/70" />}
              </div>

              {/* Bubble */}
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${msg.role === "user" ? "bg-violet-500/20 text-foreground border border-violet-500/20 rounded-tr-sm" : "bg-foreground/5 border border-foreground/5 text-foreground/80 rounded-tl-sm"}`}>
                {msg.role === "assistant" ? (
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      code: ({ children, className }) => (
                        <code className="bg-black/40 px-1.5 py-0.5 rounded text-xs font-mono text-violet-300">{children}</code>
                      ),
                      pre: ({ children }) => (
                        <pre className="bg-black/40 rounded-xl p-3 text-xs font-mono overflow-x-auto my-2 border border-foreground/5">{children}</pre>
                      ),
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                ) : (
                  <p>{msg.content}</p>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
            <div className="w-7 h-7 rounded-full bg-foreground/10 flex items-center justify-center shrink-0">
              <Bot className="w-3.5 h-3.5 text-foreground/70" />
            </div>
            <div className="bg-foreground/5 border border-foreground/5 rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1.5 items-center">
                <Loader2 className="w-3 h-3 animate-spin text-violet-400" />
                <span className="text-foreground/40 text-xs">Searching documentation context...</span>
              </div>
            </div>
          </motion.div>
        )}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-foreground/5">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
            placeholder="Ask about authentication, endpoints, rate limits..."
            className="flex-1 bg-foreground/5 border border-foreground/8 rounded-xl px-4 py-2.5 text-sm text-foreground placeholder-foreground/30 focus:outline-none focus:border-violet-500/50 transition-all"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            className="w-10 h-10 rounded-xl bg-violet-500 hover:bg-violet-600 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-all"
          >
            <Send className="w-4 h-4 text-foreground" />
          </button>
        </div>
      </div>
    </div>
  );
}
