"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTheme } from "next-themes"
import { Moon, Home, Search, Zap, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useEffect, useState } from "react"

export function Navbar() {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <header className="sticky top-0 z-50 w-full bg-[#F8FAFC] dark:bg-slate-950 border-b border-transparent print:hidden">
      <div className="flex h-16 items-center px-6 w-full">
        {/* Logo */}
        <Link href="/" className="mr-8 flex items-center gap-2">
          <div className="bg-[#2563EB] p-1.5 rounded-full">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight text-slate-900 dark:text-white">JDForge</span>
        </Link>

        {/* Right side controls */}
        <div className="ml-auto flex items-center space-x-3">
          {/* Search Bar */}
          <div className="relative hidden md:flex items-center">
            <Search className="absolute left-3 w-4 h-4 text-slate-400" />
            <Input 
              type="text" 
              placeholder="Search" 
              className="pl-9 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full h-9 focus-visible:ring-1 focus-visible:ring-[#2563EB]"
            />
          </div>

          <Link href="/">
            <Button variant="ghost" size="icon" className="rounded-full text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 bg-slate-100 dark:bg-slate-900 ml-2">
              <Home className="h-4 w-4" />
            </Button>
          </Link>

          <Link href="/settings">
            <Button variant="ghost" size="icon" className="rounded-full text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 bg-slate-100 dark:bg-slate-900 ml-2">
              <Settings className="h-4 w-4" />
            </Button>
          </Link>

          <Button
            variant="ghost"
            size="icon"
            className="rounded-full text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 bg-slate-100 dark:bg-slate-900"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {mounted && theme === "dark" ? (
              <Moon className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
            <span className="sr-only">Toggle theme</span>
          </Button>

          <Avatar className="h-8 w-8 cursor-pointer ml-2 border border-slate-200 dark:border-slate-800">
            <AvatarImage src="/placeholder-user.jpg" alt="User" />
            <AvatarFallback className="bg-[#2563EB] text-white text-xs">US</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  )
}
