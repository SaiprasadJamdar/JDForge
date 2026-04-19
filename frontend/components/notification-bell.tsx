"use client"

import { useEffect, useState } from "react"
import { Bell, Check, X } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { fetchApi } from "@/lib/api"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Trash2, Loader2 } from "lucide-react"

interface Notification {
  id: string
  message: string
  status: string
  type: string
  created_at: string
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)

  const loadNotifications = async () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
    if (!token) return

    try {
      const data = await fetchApi("/notifications")
      setNotifications(data)
    } catch (err) {
      console.error("Failed to load notifications:", err)
    }
  }

  useEffect(() => {
    loadNotifications()
    // Poll every 30 seconds
    const interval = setInterval(loadNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  const handleClearAll = async () => {
    setLoading(true)
    try {
      await fetchApi("/notifications", { method: "DELETE" })
      setNotifications([])
      toast.success("All notifications cleared")
    } catch (err) {
      toast.error("Failed to clear notifications")
    } finally {
      setLoading(false)
    }
  }

  const handleRespond = async (id: string, accept: boolean) => {
    setLoading(true)
    try {
      await fetchApi(`/notifications/${id}/respond`, {
        method: "POST",
        body: JSON.stringify({ accept }),
      })
      toast.success(accept ? "Invitation accepted!" : "Invitation declined")
      
      // If accepted, trigger a global refresh for JDs
      if (accept) {
        window.dispatchEvent(new CustomEvent("jd-refresh"))
      }
      
      await loadNotifications()
    } catch (err) {
      toast.error("Failed to respond to invitation")
    } finally {
      setLoading(false)
    }
  }

  const pendingCount = notifications.filter(n => n.status === "pending").length

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative rounded-full text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 bg-slate-100 dark:bg-slate-900">
          <Bell className="h-4 w-4" />
          {pendingCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center bg-red-500 text-[10px] text-white">
              {pendingCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-2 border-slate-200 dark:border-slate-800">
        <DropdownMenuLabel className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>Notifications</span>
            {pendingCount > 0 && <Badge variant="secondary" className="text-[10px] h-4">{pendingCount}</Badge>}
          </div>
          {notifications.length > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 text-[10px] text-slate-400 hover:text-red-500 gap-1 px-2"
              onClick={(e) => { e.stopPropagation(); handleClearAll() }}
              disabled={loading}
            >
              {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
              Clear All
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-500">
              No notifications yet.
            </div>
          ) : (
            notifications.map((n) => (
              <div key={n.id} className="p-3 mb-1 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-100 dark:border-slate-800">
                <p className="text-sm font-medium mb-2">{n.message}</p>
                {n.type === "jd_invite" && n.status === "pending" && (
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      className="h-8 bg-blue-600 hover:bg-blue-700 text-white"
                      disabled={loading}
                      onClick={() => handleRespond(n.id, true)}
                    >
                      <Check className="h-3 w-3 mr-1" /> Accept
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="h-8"
                      disabled={loading}
                      onClick={() => handleRespond(n.id, false)}
                    >
                      <X className="h-3 w-3 mr-1" /> Decline
                    </Button>
                  </div>
                )}
                {n.status !== "pending" && (
                  <span className="text-[10px] uppercase tracking-wider text-slate-400">
                    {n.status}
                  </span>
                )}
              </div>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
