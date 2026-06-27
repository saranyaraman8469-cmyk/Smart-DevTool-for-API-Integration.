"use client";
import { motion } from "framer-motion";
import { Lock, Key, RefreshCw, AlertCircle } from "lucide-react";

interface AuthFlowDiagramProps {
  authType: string;
  headerName?: string;
  tokenUrl?: string;
  description?: string;
  rateLimitLimit?: number;
  rateLimitWindow?: string;
}

const AUTH_FLOWS: Record<string, { steps: string[]; color: string; icon: typeof Lock }> = {
  bearer: {
    color: "#7C3AED",
    icon: Key,
    steps: [
      "Client obtains Bearer token (login/OAuth)",
      "Stores token in memory",
      `Injects: Authorization: Bearer <token>`,
      "Server validates JWT signature",
      "Returns resource or 401 Unauthorized",
    ],
  },
  oauth2: {
    color: "#2563EB",
    icon: RefreshCw,
    steps: [
      "Client requests authorization code",
      "User grants permission on Auth Server",
      "Exchange code for access_token + refresh_token",
      "Attach: Authorization: Bearer <access_token>",
      "Refresh token on expiry (usually HTTP 401)",
    ],
  },
  apiKey: {
    color: "#059669",
    icon: Key,
    steps: [
      "Generate API Key in developer portal",
      "Store key in environment variable",
      "Attach via header or query parameter",
      "Server validates key against store",
      "Throttle based on key-level rate limits",
    ],
  },
  basic: {
    color: "#D97706",
    icon: Lock,
    steps: [
      "Encode username:password in Base64",
      "Attach: Authorization: Basic <encoded>",
      "Server decodes and validates credentials",
      "Not recommended for production APIs",
      "Always use over HTTPS (TLS required)",
    ],
  },
};

export default function AuthFlowDiagram({ authType, headerName, tokenUrl, description, rateLimitLimit, rateLimitWindow }: AuthFlowDiagramProps) {
  const flow = AUTH_FLOWS[authType] || AUTH_FLOWS["bearer"];
  const Icon = flow.icon;

  return (
    <div className="glass-card p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${flow.color}20` }}>
          <Icon className="w-4 h-4" style={{ color: flow.color }} />
        </div>
        <div>
          <h3 className="text-foreground font-semibold text-sm">Authentication Flow</h3>
          <p className="text-foreground/40 text-xs capitalize">{authType} authentication strategy</p>
        </div>
        <div className="ml-auto px-3 py-1 rounded-full text-xs font-medium uppercase" style={{ backgroundColor: `${flow.color}20`, color: flow.color }}>
          {authType}
        </div>
      </div>

      {/* Flow diagram */}
      <div className="space-y-2 mb-6">
        {flow.steps.map((step, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="flex items-start gap-3"
          >
            <div className="flex flex-col items-center gap-0">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{ backgroundColor: `${flow.color}20`, color: flow.color }}>
                {i + 1}
              </div>
              {i < flow.steps.length - 1 && (
                <div className="w-px h-5 my-0.5" style={{ backgroundColor: `${flow.color}30` }} />
              )}
            </div>
            <p className="text-foreground/60 text-xs pt-1 font-mono">{step}</p>
          </motion.div>
        ))}
      </div>

      {/* Metadata */}
      <div className="grid grid-cols-2 gap-3">
        {headerName && (
          <div className="p-3 rounded-xl bg-foreground/5 border border-foreground/5">
            <p className="text-foreground/30 text-xs mb-1">Header Name</p>
            <p className="text-foreground text-xs font-mono">{headerName}</p>
          </div>
        )}
        {tokenUrl && (
          <div className="p-3 rounded-xl bg-foreground/5 border border-foreground/5">
            <p className="text-foreground/30 text-xs mb-1">Token URL</p>
            <p className="text-foreground text-xs font-mono truncate">{tokenUrl}</p>
          </div>
        )}
        {rateLimitLimit && (
          <div className="p-3 rounded-xl bg-foreground/5 border border-foreground/5">
            <p className="text-foreground/30 text-xs mb-1">Rate Limit</p>
            <p className="text-amber-400 text-xs font-semibold">{rateLimitLimit} / {rateLimitWindow}</p>
          </div>
        )}
        {description && (
          <div className="p-3 rounded-xl bg-foreground/5 border border-foreground/5 col-span-2">
            <p className="text-foreground/30 text-xs mb-1">Notes</p>
            <p className="text-foreground/60 text-xs">{description}</p>
          </div>
        )}
      </div>
    </div>
  );
}
