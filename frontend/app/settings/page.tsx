"use client"

import { useState, useEffect } from "react"
import { AppShell } from "@/components/app-shell"
import { User, Shield, LogOut, Key, Eye, EyeOff, CheckCircle2, Lock, Loader2, ExternalLink } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/contexts/auth-context"
import { fetchApi } from "@/lib/api"

export default function SettingsPage() {
  const { user, logout, refreshUser } = useAuth()

  const [groqKey, setGroqKey] = useState("")
  const [showGroq, setShowGroq] = useState(false)
  const [updatingKeys, setUpdatingKeys] = useState(false)

  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showNewPw, setShowNewPw] = useState(false)
  const [updatingPassword, setUpdatingPassword] = useState(false)

  useEffect(() => {
    if (user) setGroqKey(user.groq_api_key || "")
  }, [user])

  const handleSaveKeys = async () => {
    setUpdatingKeys(true)
    try {
      await fetchApi("/auth/keys", { method: "PATCH", body: JSON.stringify({ groq_api_key: groqKey }) })
      await refreshUser()
      toast.success("API key saved")
    } catch (err: any) {
      toast.error(err.message || "Failed to save")
    } finally {
      setUpdatingKeys(false)
    }
  }

  const handlePasswordChange = async () => {
    if (!newPassword || newPassword.length < 6) { toast.error("Minimum 6 characters"); return }
    if (newPassword !== confirmPassword) { toast.error("Passwords don't match"); return }
    setUpdatingPassword(true)
    try {
      await fetchApi("/auth/password", { method: "PATCH", body: JSON.stringify({ new_password: newPassword }) })
      toast.success("Password updated")
      setNewPassword(""); setConfirmPassword("")
    } catch (err: any) {
      toast.error(err.message || "Update failed")
    } finally {
      setUpdatingPassword(false)
    }
  }

  const initials = (user?.name || user?.email || "?")
    .split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase()

  const [usageLogs, setUsageLogs] = useState<any[]>([])
  const [loadingLogs, setLoadingLogs] = useState(true)

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const data = await fetchApi("/auth/logs")
        setUsageLogs(data)
      } catch (err) {
        console.error("Failed to fetch logs", err)
      } finally {
        setLoadingLogs(false)
      }
    }
    fetchLogs()
  }, [])

  return (
    <AppShell>
      <div className="h-full overflow-y-auto w-full">
        <div className="max-w-5xl mx-auto px-8 py-10">
          <div className="mb-8">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Settings</h1>
            <p className="text-sm text-slate-400 mt-1">Manage your account, API keys, and security</p>
          </div>

        <div className="grid grid-cols-12 gap-5">
          {/* Row 1: Profile & Password side-by-side (8 + 4) */}
          <div className="col-span-8 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-7 py-4 border-b border-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center">
                  <User className="w-3.5 h-3.5 text-slate-500" />
                </div>
                <div>
                  <p className="text-sm font-black text-slate-900">Profile</p>
                  <p className="text-[10px] text-slate-400 uppercase tracking-tight font-bold">Identity</p>
                </div>
              </div>
              <button onClick={logout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-[10px] font-black uppercase tracking-wider transition-all">
                <LogOut className="w-3 h-3" /> Sign Out
              </button>
            </div>
            <div className="px-7 py-6 flex items-center gap-6 flex-1">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-600/20 shrink-0">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-lg font-black text-slate-900 truncate">{user?.name || "—"}</p>
                <p className="text-sm text-slate-400 font-medium truncate">{user?.email}</p>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 shrink-0">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Active</span>
              </div>
            </div>
          </div>

          <div className="col-span-4 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
            <div className="flex items-center gap-2.5 px-7 py-4 border-b border-slate-50">
              <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center">
                <Shield className="w-3.5 h-3.5 text-slate-500" />
              </div>
              <div>
                <p className="text-sm font-black text-slate-900">Security</p>
                <p className="text-[10px] text-slate-400 uppercase tracking-tight font-bold">Password</p>
              </div>
            </div>
            <div className="px-7 py-6 flex flex-col gap-3 justify-center flex-1">
                <div className="relative">
                  <input
                    type={showNewPw ? "text" : "password"}
                    placeholder="New Password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    className="w-full h-10 px-3.5 pr-10 rounded-xl border border-slate-200 bg-slate-50/50 text-sm font-medium text-slate-800 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition-all"
                  />
                  <button type="button" onClick={() => setShowNewPw(!showNewPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showNewPw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <input
                  type="password"
                  placeholder="Confirm New Password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm font-medium text-slate-800 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition-all"
                />
               <button onClick={handlePasswordChange} disabled={updatingPassword}
                className="w-full h-10 mt-1 rounded-xl bg-slate-900 text-white text-[11px] font-black uppercase tracking-wider hover:bg-black transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                {updatingPassword ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Lock className="w-3.5 h-3.5" />}
                {updatingPassword ? "Updating..." : "Reset Password"}
               </button>
            </div>
          </div>

          {/* Row 2: API Keys & Usage Logs (Full Width) */}
          <div className="col-span-12 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mb-5">
            <div className="flex items-center justify-between px-7 py-4 border-b border-slate-50">
               <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center">
                  <Key className="w-3.5 h-3.5 text-slate-500" />
                </div>
                <div>
                  <p className="text-sm font-black text-slate-900">Infrastructure</p>
                  <p className="text-[10px] text-slate-400 uppercase tracking-tight font-bold">API Access</p>
                </div>
              </div>
              <a href="https://console.groq.com" target="_blank" rel="noreferrer"
                className="flex items-center gap-1 text-[10px] text-blue-500 font-bold hover:underline">
                Groq Console <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
            
            <div className="px-7 py-6 grid grid-cols-12 gap-8 items-start">
              <div className="col-span-4">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">
                  Groq API Key
                </label>
                <div className="relative mb-3">
                  <input
                    type={showGroq ? "text" : "password"}
                    placeholder="gsk_..."
                    value={groqKey}
                    onChange={e => setGroqKey(e.target.value)}
                    className="w-full h-10 px-3.5 pr-10 rounded-xl border border-slate-200 bg-slate-50/50 text-sm font-medium text-slate-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                  />
                  <button type="button" onClick={() => setShowGroq(!showGroq)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showGroq ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <button onClick={handleSaveKeys} disabled={updatingKeys}
                  className="w-full h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-black uppercase tracking-wider transition-all disabled:opacity-50">
                  {updatingKeys ? "Saving..." : "Update Infrastructure Key"}
                </button>
              </div>

              <div className="col-span-8">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">
                  Usage History & Governance
                </label>
                <div className="rounded-xl border border-slate-100 overflow-hidden">
                  <div className="bg-slate-50 px-4 py-2 flex text-[9px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-100">
                    <span className="flex-1">Activity Tag</span>
                    <span className="w-32 text-center">Model</span>
                    <span className="w-24 text-center">In/Out</span>
                    <span className="w-20 text-right">Total</span>
                  </div>
                  <div className="max-h-[200px] overflow-y-auto">
                    {loadingLogs ? (
                      <div className="text-center py-10 text-[10px] text-slate-400 font-bold uppercase animate-pulse">Scanning Logs...</div>
                    ) : usageLogs.length === 0 ? (
                      <div className="text-center py-10 text-[10px] text-slate-400 font-bold uppercase">No records found</div>
                    ) : usageLogs.map((log) => (
                      <div key={log.id} className="px-4 py-3 flex items-center border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
                        <div className="flex-1">
                          <p className="text-xs font-black text-slate-900">{log.feature}</p>
                          <p className="text-[9px] text-slate-400 font-bold">{new Date(log.created_at).toLocaleString()}</p>
                        </div>
                        <div className="w-32 text-center text-[10px] font-bold text-slate-500">{log.model_name?.split("-")[0].toUpperCase()}</div>
                        <div className="w-24 text-center text-[10px] font-bold text-slate-500">
                          {log.prompt_tokens}/{log.completion_tokens}
                        </div>
                        <div className="w-20 text-right text-[11px] font-black text-slate-900">{log.total_tokens.toLocaleString()}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>
    </AppShell>
  )
}
