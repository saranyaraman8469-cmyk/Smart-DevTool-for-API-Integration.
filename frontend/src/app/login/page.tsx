"use client"

import { useState } from "react"
import { useAuth } from "@/lib/AuthContext"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Suspense } from "react"

function LoginForm() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAuth()
  const searchParams = useSearchParams()
  const justRegistered = searchParams.get("registered") === "true"

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const formData = new URLSearchParams()
      formData.append("username", username)
      formData.append("password", password)

      // Uses /auth-api/* proxy — Next.js forwards this to FastAPI /api/auth/login
      const response = await fetch("/auth-api/login", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData,
      })

      if (!response.ok) {
        let errorMsg = "Invalid username or password"
        try {
          const errData = await response.json()
          errorMsg = errData.detail || errorMsg
        } catch {
          if (response.status >= 500) {
            errorMsg = `Server error (${response.status}). Make sure the backend is running.`
          }
        }
        throw new Error(errorMsg)
      }

      const data = await response.json()

      // Fetch user profile via proxy
      const meResponse = await fetch("/auth-api/me", {
        headers: { Authorization: `Bearer ${data.access_token}` },
      })
      const meData = await meResponse.json()

      login(data.access_token, meData)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md p-8 space-y-6 bg-card border border-border/50 rounded-2xl shadow-xl glass-panel">
        <div className="text-center space-y-1">
          <h2 className="text-3xl font-bold text-foreground">Welcome Back</h2>
          <p className="text-sm text-muted-foreground">Sign in to your Smart DevTool account</p>
        </div>

        {justRegistered && (
          <div className="p-3 text-sm text-emerald-400 bg-emerald-500/10 rounded-md border border-emerald-500/20">
            ✅ Account created! Please sign in.
          </div>
        )}

        {error && (
          <div className="p-3 text-sm text-red-400 bg-red-500/10 rounded-md border border-red-500/20">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground placeholder:text-muted-foreground/50"
              placeholder="johndoe"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {isLoading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-primary hover:underline font-medium">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary" /></div>}>
      <LoginForm />
    </Suspense>
  )
}
