"use client"

import { Navbar } from "@/components/navbar"
import { ProtectedRoute } from "@/components/protected-route"

interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  return (
    <ProtectedRoute>
      <div className="h-screen bg-background relative selection:bg-blue-100 selection:text-blue-900 flex flex-col overflow-hidden">
        <Navbar />
        
        {/* Main Content Area */}
        <main className="flex-1 flex flex-col min-h-0">
          {children}
        </main>
      </div>
    </ProtectedRoute>
  )
}
