"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Zap, Star, Building2 } from "lucide-react";

const plans = [
  {
    name: "Starter",
    price: { monthly: 0, yearly: 0 },
    icon: Zap,
    description: "Perfect for exploring API integration.",
    color: "border-foreground/10",
    iconColor: "text-foreground/60",
    features: [
      "5 API analyses per month",
      "Python & TypeScript only",
      "Basic endpoint extraction",
      "ZIP export",
      "Community support",
    ],
    cta: "Get Started Free",
    popular: false,
  },
  {
    name: "Pro",
    price: { monthly: 29, yearly: 19 },
    icon: Star,
    description: "For professional developers and teams.",
    color: "border-violet-500/40",
    iconColor: "text-violet-400",
    features: [
      "Unlimited API analyses",
      "All 9 supported languages",
      "AI Chat with documentation",
      "Security Analyzer (Agent 8)",
      "Postman & OpenAPI export",
      "Slack / Discord webhooks",
      "Priority support",
    ],
    cta: "Start Pro Trial",
    popular: true,
  },
  {
    name: "Enterprise",
    price: { monthly: 99, yearly: 79 },
    icon: Building2,
    description: "For large-scale API integration teams.",
    color: "border-indigo-500/30",
    iconColor: "text-indigo-400",
    features: [
      "Everything in Pro",
      "Custom LLM model support",
      "Bring your own OpenAI key",
      "On-prem deployment",
      "SSO / SAML integration",
      "Custom branding",
      "Dedicated account manager",
    ],
    cta: "Contact Sales",
    popular: false,
  },
];

export default function Pricing() {
  const [yearly, setYearly] = useState(false);

  return (
    <section id="pricing" className="py-24 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">
            Simple, transparent <span className="gradient-text">pricing</span>
          </h2>
          <p className="text-foreground/50 text-lg mb-8">Start for free. Upgrade when you need more power.</p>

          {/* Toggle */}
          <div className="inline-flex items-center gap-3 p-1 rounded-xl bg-foreground/5 border border-foreground/10">
            <button
              onClick={() => setYearly(false)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${!yearly ? "bg-violet-500 text-foreground shadow-lg" : "text-foreground/50 hover:text-foreground"}`}
            >
              Monthly
            </button>
            <button
              onClick={() => setYearly(true)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${yearly ? "bg-violet-500 text-foreground shadow-lg" : "text-foreground/50 hover:text-foreground"}`}
            >
              Yearly
              <span className="ml-2 text-xs text-emerald-400">-35%</span>
            </button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan, index) => {
            const Icon = plan.icon;
            return (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={`glass-card p-8 flex flex-col border ${plan.color} relative ${plan.popular ? "ring-1 ring-violet-500/40" : ""}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 text-foreground text-xs font-semibold">
                    Most Popular
                  </div>
                )}

                <div className="mb-6">
                  <Icon className={`w-8 h-8 ${plan.iconColor} mb-3`} />
                  <h3 className="text-foreground font-bold text-xl mb-1">{plan.name}</h3>
                  <p className="text-foreground/40 text-sm">{plan.description}</p>
                </div>

                <div className="mb-8">
                  <div className="flex items-end gap-1">
                    <span className="text-4xl font-extrabold text-foreground">
                      ${yearly ? plan.price.yearly : plan.price.monthly}
                    </span>
                    <span className="text-foreground/40 text-sm mb-1">/month</span>
                  </div>
                  {yearly && plan.price.monthly > 0 && (
                    <p className="text-xs text-emerald-400 mt-1">
                      Billed annually (${plan.price.yearly * 12}/yr)
                    </p>
                  )}
                </div>

                <ul className="flex-1 space-y-3 mb-8">
                  {plan.features.map((feat) => (
                    <li key={feat} className="flex items-start gap-3 text-sm text-foreground/70">
                      <Check className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                      {feat}
                    </li>
                  ))}
                </ul>

                <button
                  className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${plan.popular ? "btn-primary justify-center" : "btn-secondary justify-center"}`}
                >
                  {plan.cta}
                </button>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
