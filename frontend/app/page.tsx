"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { motion, useScroll, useTransform } from "framer-motion"
import { 
  Mic, 
  Sparkles, 
  FileText, 
  ArrowRight, 
  Zap, 
  Shield, 
  Globe, 
  ChevronRight,
  Play
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"

export default function LandingPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (!isLoading && user) {
      router.push("/dashboard")
    }
  }, [user, isLoading, router])

  if (!mounted || (!isLoading && user)) return null

  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-blue-100 overflow-x-hidden font-sans">
      {/* ─── NAVIGATION ───────────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex items-center justify-between backdrop-blur-md bg-white/70 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-black tracking-tighter text-slate-900 uppercase">JDForge</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-[11px] font-black uppercase tracking-widest text-slate-400">
          <a href="#features" className="hover:text-indigo-600 transition-colors">Intelligence</a>
          <a href="#workflow" className="hover:text-indigo-600 transition-colors">Workflow</a>
          <a href="#security" className="hover:text-indigo-600 transition-colors">Enterprise</a>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-[11px] font-black uppercase tracking-widest text-slate-600 hover:text-indigo-600 transition-colors">Login</Link>
          <Link href="/register" className="px-5 py-2.5 bg-indigo-600 text-white text-[11px] font-black uppercase tracking-[0.15em] rounded-full hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 active:scale-95">Get Started</Link>
        </div>
      </nav>

      {/* ─── HERO SECTION ─────────────────────────────────────────────────────────── */}
      <section className="relative pt-40 pb-20 px-6 max-w-7xl mx-auto flex flex-col items-center text-center overflow-visible">
        {/* Glow Effects */}
        <div className="absolute top-20 -left-20 w-[600px] h-[600px] bg-indigo-200/30 rounded-full blur-[120px] -z-10 animate-pulse" />
        <div className="absolute top-40 -right-20 w-[500px] h-[500px] bg-blue-200/20 rounded-full blur-[100px] -z-10" />

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-8 border border-indigo-100/50"
        >
          <Zap className="w-3 h-3 fill-indigo-700" />
          Powered by Llama 3.3 Intelligence
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-6xl md:text-[5.5rem] font-extrabold leading-[1.05] tracking-[-0.04em] text-slate-900 mb-8 max-w-4xl"
        >
          Turn Raw Audio into <br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-500">Perfect JDs.</span>
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="text-lg md:text-xl text-slate-500 font-medium max-w-2xl mb-12 leading-relaxed"
        >
          Stop wrestling with blank pages. Upload meeting recordings or paste unstructured notes. JDForge synthesizes professional, branded job descriptions in seconds.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-4 mb-20 px-4 w-full justify-center"
        >
          <Link href="/register" className="group flex items-center justify-center gap-3 px-8 py-5 bg-slate-900 text-white rounded-[24px] text-sm font-black uppercase tracking-[0.1em] hover:bg-black transition-all shadow-2xl shadow-indigo-900/10 hover:-translate-y-1">
            Start Foraging Free
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <button className="flex items-center justify-center gap-3 px-8 py-5 bg-white border border-slate-200 text-slate-900 rounded-[24px] text-sm font-black uppercase tracking-[0.1em] hover:bg-slate-50 transition-all shadow-lg shadow-slate-900/5 active:scale-95">
            <Play className="w-4 h-4 fill-slate-900" />
            Watch Product Tour
          </button>
        </motion.div>

        {/* Floating Dashboard Preview */}
        <motion.div 
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.6 }}
          className="relative w-full max-w-5xl bg-white border border-slate-200 shadow-[0_40px_100px_rgb(0,0,0,0.1)] rounded-[40px] p-4 group"
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500 to-blue-400 rounded-[40px] blur-3xl opacity-[0.05] group-hover:opacity-10 transition-opacity" />
          <div className="relative rounded-[28px] overflow-hidden bg-slate-50 aspect-video border border-slate-100 flex items-center justify-center">
            {/* Mock Dashboard UI */}
            <div className="w-full h-full p-8 flex flex-col gap-6">
              <div className="flex justify-between items-center h-12">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-slate-200" />
                  <div className="w-3 h-3 rounded-full bg-slate-200" />
                  <div className="w-3 h-3 rounded-full bg-slate-200" />
                </div>
                <div className="w-48 h-full bg-white rounded-xl border border-slate-100 flex items-center px-4">
                  <div className="w-full h-2 bg-slate-100 rounded-full" />
                </div>
              </div>
              <div className="flex-1 flex gap-6">
                <div className="w-[30%] h-full bg-white rounded-3xl border border-slate-100 p-6 flex flex-col gap-4">
                  <div className="w-full h-3 bg-indigo-50 rounded-full" />
                  <div className="w-[70%] h-3 bg-indigo-50 rounded-full" />
                  <div className="mt-8 flex-1 border-2 border-dashed border-slate-100 rounded-2xl flex items-center justify-center">
                    <Mic className="w-6 h-6 text-indigo-300" />
                  </div>
                </div>
                <div className="flex-1 h-full bg-white rounded-3xl border border-slate-100 p-8">
                  <div className="w-[40%] h-6 bg-slate-900 rounded-full mb-8" />
                  <div className="space-y-4">
                    <div className="w-full h-3 bg-slate-100 rounded-full" />
                    <div className="w-full h-3 bg-slate-100 rounded-full" />
                    <div className="w-[85%] h-3 bg-slate-100 rounded-full" />
                    <div className="w-[90%] h-3 bg-slate-100 rounded-full" />
                  </div>
                  <div className="mt-12 flex gap-4">
                    <div className="w-24 h-8 bg-indigo-600 rounded-xl" />
                    <div className="w-24 h-8 bg-slate-100 rounded-xl" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ─── FEATURES ────────────────────────────────────────────────────────────── */}
      <section id="features" className="py-32 px-6 bg-slate-50/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-indigo-600 mb-4">Core Intelligence</h2>
            <h3 className="text-4xl font-black tracking-tight text-slate-900">Revolutionizing the way you hire.</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Mic,
                title: "Voice-First Ingestion",
                desc: "Record stakeholder meetings directly from your browser. JDForge extracts the nuance other tools miss.",
                color: "indigo"
              },
              {
                icon: FileText,
                title: "Template Matching",
                desc: "Upload legacy JDs to train the AI. Every generation will perfectly mirror your brand's unique tone.",
                color: "blue"
              },
              {
                icon: Zap,
                title: "Semantic Analysis",
                desc: "Quality scoring detects gaps before they go live. Get real-time feedback on JD effectiveness.",
                color: "cyan"
              }
            ].map((f, i) => (
              <motion.div 
                key={f.title}
                whileHover={{ y: -10 }}
                className="bg-white p-10 rounded-[32px] border border-slate-100 shadow-xl shadow-slate-900/5 group"
              >
                <div className={`w-14 h-14 bg-${f.color}-50 text-${f.color}-600 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform`}>
                  <f.icon className="w-6 h-6" />
                </div>
                <h4 className="text-xl font-bold text-slate-900 mb-4">{f.title}</h4>
                <p className="text-slate-500 font-medium leading-relaxed italic">"{f.desc}"</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── WORKFLOW CTA ──────────────────────────────────────────────────────────── */}
      <section id="workflow" className="py-32 px-6 overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-20">
          <div className="flex-1">
            <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-indigo-600 mb-4 text-center lg:text-left">One Workflow</h2>
            <h3 className="text-5xl font-extrabold tracking-tight text-slate-900 mb-8 leading-[1.1] text-center lg:text-left">From raw input to <br/> <span className="text-indigo-600">branded PDF</span> in 60s.</h3>
            
            <div className="space-y-10 mt-12 pr-10">
              {[
                { n: "01", t: "Ingest Context", d: "Record audio or paste meeting notes. JDForge cleans and transcribes with 99% accuracy." },
                { n: "02", t: "Structure Intelligence", d: "AI splits combined recordings into multiple distinct, structured job descriptions based on your criteria." },
                { n: "03", t: "Visual Branding", d: "Choose from 10+ premium LaTeX-rendered templates. Export high-quality PDFs instantly." },
              ].map(step => (
                <div key={step.n} className="flex gap-6 items-start">
                  <span className="text-4xl font-black text-slate-100 tabular-nums">{step.n}</span>
                  <div>
                    <h4 className="text-lg font-bold text-slate-900 mb-2">{step.t}</h4>
                    <p className="text-slate-500 font-medium leading-relaxed">{step.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex-1 relative">
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-indigo-100/40 rounded-full blur-[100px] -z-10" />
             <div className="bg-white border border-slate-200 rounded-[40px] p-2 shadow-2xl relative">
                <div className="aspect-[3/4] rounded-[34px] overflow-hidden bg-slate-900 p-12 text-white flex flex-col">
                   <div className="w-12 h-12 rounded-xl bg-indigo-600 mb-10" />
                   <div className="w-3/4 h-8 bg-white/20 rounded-lg mb-4" />
                   <div className="w-1/2 h-8 bg-white/10 rounded-lg mb-12" />
                   
                   <div className="space-y-6">
                      <div className="w-full h-2 bg-white/10 rounded-full" />
                      <div className="w-full h-2 bg-white/10 rounded-full" />
                      <div className="w-[80%] h-2 bg-white/10 rounded-full" />
                   </div>
                   
                   <div className="mt-auto pt-10 border-t border-white/10 flex justify-between items-end">
                      <div className="space-y-2">
                        <div className="w-20 h-2 bg-white/20 rounded-full" />
                        <div className="w-32 h-2 bg-white/10 rounded-full" />
                      </div>
                      <div className="w-14 h-14 bg-indigo-600 rounded-full flex items-center justify-center">
                        <Sparkles className="w-6 h-6 text-white" />
                      </div>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* ─── GLOBAL TRUST ──────────────────────────────────────────────────────────── */}
      <section id="security" className="py-32 px-6 bg-slate-900 text-white rounded-[60px] mx-4 mb-10 overflow-hidden relative">
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[120px] -z-0" />
        <div className="relative z-10 max-w-7xl mx-auto flex flex-col items-center text-center">
          <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-indigo-400 mb-8">Enterprise Grade</h2>
          <h3 className="text-5xl md:text-6xl font-black mb-16 tracking-tight max-w-3xl leading-tight">Securing the next era <br/> of recruiting.</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-16 w-full text-left">
            {[
              { icon: Shield, t: "AES-256 Encryption", d: "Your Groq API keys and JD content are encrypted using industry-standard AES-256-GCM architecture." },
              { icon: Globe, t: "Global Infrastructure", d: "Deployed across Vercel & Render clusters for edge response times and 99.9% availability." },
              { icon: Zap, t: "Lightning Backend", d: "Stateless FastAPI layer ensures high-concurrency processing for large-scale enterprise hiring teams." }
            ].map(item => (
              <div key={item.t}>
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mb-6">
                  <item.icon className="w-6 h-6 text-indigo-400" />
                </div>
                <h4 className="text-xl font-bold mb-4">{item.t}</h4>
                <p className="text-slate-400 font-medium leading-relaxed">{item.d}</p>
              </div>
            ))}
          </div>

          <div className="mt-32 w-full pt-16 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-12">
            <div className="text-left">
              <h4 className="text-3xl font-black mb-2">Ready to forge?</h4>
              <p className="text-slate-400 font-medium italic">Join 5,000+ recruiters scaling their intelligence today.</p>
            </div>
            <Link href="/register" className="group px-10 py-6 bg-indigo-600 text-white rounded-[24px] text-sm font-black uppercase tracking-[0.2em] hover:bg-white hover:text-indigo-600 transition-all flex items-center gap-4">
              Create My Account
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ────────────────────────────────────────────────────────────────── */}
      <footer className="py-20 px-6 border-t border-slate-100">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-black tracking-tighter text-slate-900 uppercase">JDForge</span>
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">© 2026 JDForge Intelligence Systems Inc. Built for Wissen Technology.</p>
          <div className="flex gap-8 text-[10px] font-black uppercase tracking-widest text-slate-400">
            <a href="#" className="hover:text-indigo-600">Twitter (X)</a>
            <a href="#" className="hover:text-indigo-600">LinkedIn</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
