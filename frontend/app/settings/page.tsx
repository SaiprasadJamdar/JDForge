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

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto px-8 py-10">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Settings</h1>
          <p className="text-sm text-slate-400 mt-1">Manage your account, API keys, and security</p>
        </div>

        {/* ── Row 1: Profile (full-width) ── */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm mb-5">
          <div className="flex items-center justify-between px-7 py-4 border-b border-slate-50">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center">
                <User className="w-3.5 h-3.5 text-slate-500" />
              </div>
              <div>
                <p className="text-sm font-black text-slate-900">Profile</p>
                <p className="text-[10px] text-slate-400">Account identity</p>
              </div>
            </div>
            <button onClick={logout}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-xs font-black uppercase tracking-wider transition-all">
              <LogOut className="w-3 h-3" /> Sign Out
            </button>
          </div>

          {/* Profile body — horizontal */}
          <div className="px-7 py-5 flex items-center gap-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-blue-600/20 shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-base font-black text-slate-900 truncate">{user?.name || "—"}</p>
              <p className="text-sm text-slate-400 font-medium truncate">{user?.email}</p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-[10px] font-black text-emerald-600 uppercase tracking-wider">Active</span>
            </div>
          </div>
        </div>

        {/* ── Row 2: API Keys + Security side by side ── */}
        <div className="grid grid-cols-2 gap-5">

          {/* API Keys */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between px-7 py-4 border-b border-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center">
                  <Key className="w-3.5 h-3.5 text-slate-500" />
                </div>
                <div>
                  <p className="text-sm font-black text-slate-900">API Keys</p>
                  <p className="text-[10px] text-slate-400">Powers AI generation</p>
                </div>
              </div>
              <a href="https://console.groq.com" target="_blank" rel="noreferrer"
                className="flex items-center gap-1 text-[10px] text-blue-500 font-bold hover:underline">
                Get key <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>

            <div className="px-7 py-5 space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">
                  Groq API Key
                </label>
                <div className="relative">
                  <input
                    type={showGroq ? "text" : "password"}
                    placeholder="gsk_..."
                    value={groqKey}
                    onChange={e => setGroqKey(e.target.value)}
                    className="w-full h-10 px-3.5 pr-10 rounded-xl border border-slate-200 bg-slate-50/50 text-sm font-medium text-slate-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-slate-300"
                  />
                  <button type="button" onClick={() => setShowGroq(!showGroq)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                    {showGroq ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-1.5">Whisper transcription + LLaMA generation</p>
              </div>

              <button onClick={handleSaveKeys} disabled={updatingKeys}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-blue-600/20 disabled:opacity-50 active:scale-95">
                {updatingKeys
                  ? <><Loader2 className="w-3 h-3 animate-spin" /> Saving...</>
                  : <><CheckCircle2 className="w-3 h-3" /> Save Key</>}
              </button>
            </div>
          </div>

          {/* Security */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-2.5 px-7 py-4 border-b border-slate-50">
              <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center">
                <Shield className="w-3.5 h-3.5 text-slate-500" />
              </div>
              <div>
                <p className="text-sm font-black text-slate-900">Security</p>
                <p className="text-[10px] text-slate-400">Change login password</p>
              </div>
            </div>

            <div className="px-7 py-5 space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">New Password</label>
                <div className="relative">
                  <input
                    type={showNewPw ? "text" : "password"}
                    placeholder="At least 6 characters"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    className="w-full h-10 px-3.5 pr-10 rounded-xl border border-slate-200 bg-slate-50/50 text-sm font-medium text-slate-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-slate-300"
                  />
                  <button type="button" onClick={() => setShowNewPw(!showNewPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                    {showNewPw ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Confirm Password</label>
                <div className="relative">
                  <input
                    type="password"
                    placeholder="Repeat new password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    className="w-full h-10 px-3.5 pr-10 rounded-xl border border-slate-200 bg-slate-50/50 text-sm font-medium text-slate-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-slate-300"
                  />
                  {confirmPassword && confirmPassword === newPassword && (
                    <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-emerald-500" />
                  )}
                </div>
              </div>

              <button onClick={handlePasswordChange} disabled={updatingPassword || !newPassword}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-black uppercase tracking-wider transition-all shadow-md disabled:opacity-40 active:scale-95">
                {updatingPassword
                  ? <><Loader2 className="w-3 h-3 animate-spin" /> Updating...</>
                  : <><Lock className="w-3 h-3" /> Update Password</>}
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
