"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import { useRouter } from "next/navigation"

type User = {
  id: number
  username: string
  email: string
}

type AuthContextType = {
  user: User | null
  token: string | null
  login: (token: string, user: User) => void
  logout: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const storedToken = localStorage.getItem("token")
    if (storedToken) {
      setToken(storedToken)
      // Validate token via proxy — avoids any CORS issues
      fetch("/auth-api/me", {
        headers: { Authorization: `Bearer ${storedToken}` }
      })
        .then(res => res.json())
        .then(data => {
          if (data.id) {
            setUser(data)
          } else {
            localStorage.removeItem("token")
            setToken(null)
          }
        })
        .catch(() => {
          localStorage.removeItem("token")
          setToken(null)
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem("token", newToken)
    setToken(newToken)
    setUser(newUser)
    router.push("/dashboard")
  }

  const logout = () => {
    localStorage.removeItem("token")
    setToken(null)
    setUser(null)
    router.push("/login")
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
