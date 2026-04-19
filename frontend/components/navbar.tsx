"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Zap, Settings } from "lucide-react"
import { NotificationBell } from "./notification-bell"

export function Navbar() {
  const pathname = usePathname()

  const navItems = [
    { href: "/", icon: Home, label: "Dashboard" },
    { href: "/builder", label: "Builder" },
    { href: "/sourcing", label: "Sourcing" },
  ]

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-slate-100 print:hidden">
      <div className="flex h-14 items-center px-4 sm:px-6 w-full gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="bg-blue-600 p-1.5 rounded-xl shadow-sm shadow-blue-200">
            <Zap className="h-4 w-4 text-white" />
          </div>
          <span className="font-black text-lg tracking-tight text-slate-900 hidden sm:block">JDForge</span>
        </Link>

        {/* Nav links — hidden on mobile */}
        <nav className="hidden md:flex items-center gap-0.5 ml-4">
          {navItems.map(item => {
            const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))
            return (
              <Link key={item.href} href={item.href}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  active
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                }`}>
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Right side */}
        <div className="ml-auto flex items-center gap-2">
          <NotificationBell />
          <Link href="/settings"
            className={`w-8 h-8 flex items-center justify-center rounded-xl transition-all ${
              pathname === "/settings" ? "bg-blue-50 text-blue-600" : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
            }`}>
            <Settings className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </header>
  )
}
