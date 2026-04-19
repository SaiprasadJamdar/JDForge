"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { fetchApi } from "@/lib/api"

export interface User {
  id: string
  name: string | null
  email: string
  is_active: boolean
  created_at: string
  groq_api_key?: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  token: string | null
  login: (token: string) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  token: null,
  login: async () => {},
  logout: () => {},
  refreshUser: async () => {},
})

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  const loadUser = async () => {
    const storedToken = localStorage.getItem("token")
    if (!storedToken) {
      setUser(null)
      setToken(null)
      setIsLoading(false)
      // Allow landing page, login, register, and forgot-password without redirect
      const publicPaths = ["/", "/login", "/register", "/forgot-password"]
      if (!publicPaths.includes(pathname)) {
         router.push("/login")
      }
      return
    }

    try {
      const userData = await fetchApi("/auth/me")
      setUser(userData)
      setToken(storedToken)
    } catch (error: any) {
      // Token invalid or expired
      localStorage.removeItem("token")
      setUser(null)
      setToken(null)
      const publicPaths = ["/", "/login", "/register"]
      if (!publicPaths.includes(pathname)) {
         router.push("/login")
      }
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadUser()
  }, [pathname])

  const login = async (newToken: string) => {
    localStorage.setItem("token", newToken)
    setToken(newToken)
    await loadUser()
    router.push("/dashboard")
  }

  const logout = () => {
    localStorage.removeItem("token")
    setToken(null)
    setUser(null)
    router.push("/login")
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, token, login, logout, refreshUser: loadUser }}>
      {children}
    </AuthContext.Provider>
  )
}
