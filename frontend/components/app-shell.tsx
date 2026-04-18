"use client"

import { Navbar } from "@/components/navbar"

interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-background relative selection:bg-blue-100 selection:text-blue-900 flex flex-col">
      <Navbar />
      
      {/* Main Content Area */}
      <main className="flex-1 flex flex-col">
        {children}
      </main>
    </div>
  )
}
