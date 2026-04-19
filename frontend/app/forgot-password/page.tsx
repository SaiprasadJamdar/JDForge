"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { fetchApi } from "@/lib/api"
import { ArrowLeft, CheckCircle2, Eye, EyeOff, Loader2, Mail, Shield, Zap } from "lucide-react"

type Step = "email" | "otp" | "password" | "done"

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>("email")
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState(["", "", "", "", "", ""])
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const otpString = otp.join("")

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(""); setLoading(true)
    try {
      await fetchApi("/auth/forgot-password", { method: "POST", body: JSON.stringify({ email }) })
      setStep("otp")
    } catch (err: any) {
      setError(err.message || "Failed to send OTP")
    } finally {
      setLoading(false)
    }
  }

  const handleOtpChange = (idx: number, val: string) => {
    if (!/^\d?$/.test(val)) return
    const next = [...otp]; next[idx] = val; setOtp(next)
    if (val && idx < 5) document.getElementById(`otp-${idx + 1}`)?.focus()
  }
  const handleOtpKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[idx] && idx > 0)
      document.getElementById(`otp-${idx - 1}`)?.focus()
  }

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    if (otpString.length < 6) { setError("Enter all 6 digits"); return }
    setError(""); setLoading(true)
    try {
      await fetchApi("/auth/verify-otp", { method: "POST", body: JSON.stringify({ email, otp: otpString }) })
      setStep("password")
    } catch (err: any) {
      setError(err.message || "Invalid or expired OTP")
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) { setError("Passwords don't match"); return }
    if (password.length < 6) { setError("At least 6 characters required"); return }
    setError(""); setLoading(true)
    try {
      await fetchApi("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ email, otp: otpString, new_password: password }),
      })
      setStep("done")
    } catch (err: any) {
      setError(err.message || "Password reset failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 flex items-center justify-center p-4">
      <div className="w-full max-w-sm sm:max-w-md">
        {/* Brand */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-xl shadow-blue-600/25 mb-4">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">JDForge</h1>
          <p className="text-slate-500 text-sm mt-1">Transcripts to JD Intelligence</p>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/60">
          {/* Progress */}
          <div className="flex items-center gap-1.5 mb-6">
            {(["email", "otp", "password"] as Step[]).map((s, i) => (
              <div key={s} className={`h-1 rounded-full transition-all duration-500 ${
                step === "done" || ["email","otp","password"].indexOf(step) >= i ? "flex-1 bg-blue-600" : "flex-1 bg-slate-100"
              }`} />
            ))}
          </div>

          {/* Step 1 — Email */}
          {step === "email" && (
            <>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                  <Mail className="w-4.5 h-4.5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900 leading-tight">Forgot password?</h2>
                  <p className="text-slate-400 text-xs">We'll send a 6-digit code to your email</p>
                </div>
              </div>
              <form onSubmit={handleRequestOTP} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Email address</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                    placeholder="you@company.com" autoFocus
                    className="w-full h-11 px-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-300 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-sm font-medium"
                  />
                </div>
                {error && <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5 font-medium">⚠ {error}</div>}
                <button type="submit" disabled={loading}
                  className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm transition-all shadow-lg shadow-blue-600/25 disabled:opacity-50 flex items-center justify-center gap-2 active:scale-[0.98]">
                  {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</> : "Send OTP →"}
                </button>
              </form>
            </>
          )}

          {/* Step 2 — OTP */}
          {step === "otp" && (
            <>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                  <Shield className="w-4 h-4 text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900 leading-tight">Enter OTP</h2>
                  <p className="text-slate-400 text-xs">Sent to <span className="font-bold text-slate-600">{email}</span></p>
                </div>
              </div>
              <form onSubmit={handleVerifyOTP} className="space-y-5">
                <div className="flex gap-2 justify-center">
                  {otp.map((digit, i) => (
                    <input key={i} id={`otp-${i}`}
                      type="text" inputMode="numeric" maxLength={1}
                      value={digit} onChange={e => handleOtpChange(i, e.target.value)}
                      onKeyDown={e => handleOtpKeyDown(i, e)}
                      className="w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-black rounded-xl bg-slate-50 border-2 border-slate-200 text-slate-900 outline-none focus:border-blue-500 focus:bg-blue-50/50 transition-all"
                    />
                  ))}
                </div>
                {error && <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5 font-medium">⚠ {error}</div>}
                <button type="submit" disabled={loading || otpString.length < 6}
                  className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm transition-all shadow-lg shadow-blue-600/25 disabled:opacity-50 flex items-center justify-center gap-2 active:scale-[0.98]">
                  {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Verifying...</> : "Verify →"}
                </button>
                <button type="button" onClick={() => { setStep("email"); setOtp(["","","","","",""]); setError("") }}
                  className="w-full text-slate-400 hover:text-slate-600 text-xs font-bold flex items-center justify-center gap-1 transition-colors">
                  <ArrowLeft className="w-3 h-3" /> Back
                </button>
              </form>
            </>
          )}

          {/* Step 3 — New Password */}
          {step === "password" && (
            <>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                  <Shield className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900 leading-tight">New password</h2>
                  <p className="text-slate-400 text-xs">OTP verified ✓ — choose your new password</p>
                </div>
              </div>
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">New Password</label>
                  <div className="relative">
                    <input type={showPw ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} required
                      placeholder="••••••••"
                      className="w-full h-11 px-4 pr-12 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-300 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-sm font-medium"
                    />
                    <button type="button" onClick={() => setShowPw(!showPw)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Confirm Password</label>
                  <div className="relative">
                    <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required
                      placeholder="••••••••"
                      className="w-full h-11 px-4 pr-12 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder:text-slate-300 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all text-sm font-medium"
                    />
                    {confirm && confirm === password && (
                      <CheckCircle2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                    )}
                  </div>
                </div>
                {error && <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-2.5 font-medium">⚠ {error}</div>}
                <button type="submit" disabled={loading}
                  className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm transition-all shadow-lg shadow-emerald-600/25 disabled:opacity-50 flex items-center justify-center gap-2 active:scale-[0.98]">
                  {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Resetting...</> : "Reset Password →"}
                </button>
              </form>
            </>
          )}

          {/* Step 4 — Done */}
          {step === "done" && (
            <div className="text-center py-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-7 h-7 text-emerald-600" />
              </div>
              <h2 className="text-xl font-black text-slate-900 mb-1">Password reset!</h2>
              <p className="text-slate-400 text-sm mb-6">Your password has been updated.</p>
              <button onClick={() => router.push("/login")}
                className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm transition-all shadow-lg shadow-blue-600/25 active:scale-[0.98]">
                Sign In Now →
              </button>
            </div>
          )}

          {step !== "done" && (
            <div className="mt-5 pt-5 border-t border-slate-100 text-center">
              <Link href="/login" className="text-slate-400 hover:text-slate-600 text-xs font-bold flex items-center justify-center gap-1 transition-colors">
                <ArrowLeft className="w-3 h-3" /> Back to Login
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
