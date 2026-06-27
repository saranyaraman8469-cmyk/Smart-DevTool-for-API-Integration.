"use client";
import { motion } from "framer-motion";
import { TrendingUp, Shield, Code2, AlertTriangle } from "lucide-react";
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer } from "recharts";

interface MetricCardsProps {
  complexityScore: number;
  qualityScore: number;
  securityScore: number;
}

function ScoreRing({ score, color, size = 80 }: { score: number; color: string; size?: number }) {
  const r = (size - 12) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} strokeWidth="6" fill="none" stroke="rgba(255,255,255,0.05)" />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r} strokeWidth="6" fill="none"
          stroke={color}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
          style={{ filter: `drop-shadow(0 0 6px ${color}60)` }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-foreground font-bold text-lg">{score}</span>
      </div>
    </div>
  );
}

const radarData = (complexity: number, quality: number, security: number) => [
  { metric: "Quality", score: quality },
  { metric: "Security", score: security },
  { metric: "Simplicity", score: 100 - complexity },
  { metric: "Coverage", score: Math.min(quality + 10, 100) },
  { metric: "Reliability", score: Math.round((quality + security) / 2) },
];

export default function MetricCards({ complexityScore, qualityScore, securityScore }: MetricCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {/* Quality Score */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="metric-card"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-foreground/40 text-xs font-medium mb-1">Code Quality</p>
            <div className="flex items-center gap-2">
              <Code2 className="w-4 h-4 text-emerald-400" />
              <span className="text-emerald-400 text-sm font-medium">
                {qualityScore >= 80 ? "Excellent" : qualityScore >= 60 ? "Good" : "Needs Work"}
              </span>
            </div>
          </div>
          <ScoreRing score={qualityScore} color="#10B981" />
        </div>
        <div className="h-1.5 rounded-full bg-foreground/5 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${qualityScore}%` }}
            transition={{ duration: 1, delay: 0.5 }}
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-green-400"
          />
        </div>
      </motion.div>

      {/* Security Score */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="metric-card"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-foreground/40 text-xs font-medium mb-1">Security Score</p>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-400" />
              <span className="text-blue-400 text-sm font-medium">
                {securityScore >= 70 ? "Low Risk" : securityScore >= 40 ? "Medium Risk" : "High Risk"}
              </span>
            </div>
          </div>
          <ScoreRing score={securityScore} color="#3B82F6" />
        </div>
        <div className="h-1.5 rounded-full bg-foreground/5 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${securityScore}%` }}
            transition={{ duration: 1, delay: 0.6 }}
            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400"
          />
        </div>
      </motion.div>

      {/* API Complexity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="metric-card"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-foreground/40 text-xs font-medium mb-1">API Complexity</p>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-amber-400" />
              <span className="text-amber-400 text-sm font-medium">
                {complexityScore <= 30 ? "Simple" : complexityScore <= 70 ? "Medium" : "Complex"}
              </span>
            </div>
          </div>
          <ScoreRing score={complexityScore} color="#F59E0B" />
        </div>
        <div className="h-1.5 rounded-full bg-foreground/5 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${complexityScore}%` }}
            transition={{ duration: 1, delay: 0.7 }}
            className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-400"
          />
        </div>
      </motion.div>

      {/* Radar Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="metric-card md:col-span-3"
      >
        <h4 className="text-foreground/60 text-xs font-medium mb-4">API Health Overview</h4>
        <ResponsiveContainer width="100%" height={200}>
          <RadarChart data={radarData(complexityScore, qualityScore, securityScore)}>
            <PolarGrid stroke="rgba(255,255,255,0.05)" />
            <PolarAngleAxis dataKey="metric" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} />
            <Radar name="Score" dataKey="score" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.2} strokeWidth={2} />
          </RadarChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  );
}
