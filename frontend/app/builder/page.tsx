"use client"
import { useState, useEffect, useMemo, useRef, useCallback } from "react"
import { AppShell } from "@/components/app-shell"
import {
  CheckCircle2, Circle, ChevronDown, Code2, Mic, MicOff, Pencil,
  CheckCircle, ArrowRight, Loader2, Plus, Sparkles, Copy, Crown,
  Users, Mail, Send, Eye, EyeOff, Download, X, FileText,
  Bold, Italic, Underline, Strikethrough, PlusCircle, RefreshCw, Search, Trash2
} from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useJDs } from "@/lib/useJDs"
import { useAuth } from "@/contexts/auth-context"
import { fetchApi, API_BASE_URL } from "@/lib/api"
import { toast } from "sonner"
import { Suspense } from "react"

export default function BuilderPage() {
  return (
    <Suspense fallback={<AppShell><div className="flex w-full items-center justify-center p-20"><Loader2 className="animate-spin w-8 h-8 text-blue-500" /></div></AppShell>}>
      <BuilderPageContent />
    </Suspense>
  )
}

// ─── Template Catalog ─────────────────────────────────────────────────────────
const TEMPLATES = [
  { id: "t1_classic",  name: "Classic",    desc: "Single col · Logo top-right",         layout: "classic"  },
  { id: "t2_boxed",    name: "Boxed",      desc: "tcolorbox sections · Centered logo",   layout: "boxed"    },
  { id: "t3_sidebar",  name: "Sidebar",    desc: "TikZ blue sidebar · Split layout",     layout: "sidebar"  },
  { id: "t4_logoright", name: "Logo Right",  desc: "Right header · Logo anchored right",    layout: "classic"  },
  { id: "t5_twocol",   name: "Two Column", desc: "Centered logo · Multicols",            layout: "twocol"   },
  { id: "t6_accent",   name: "Accent",     desc: "Left-border headings · Bold",          layout: "accent"   },
  { id: "t7_compact",  name: "Compact",    desc: "Tight spacing · Professional",         layout: "classic"  },
  { id: "t8_split",    name: "Split",      desc: "Blue sidebar · Minipage split",        layout: "sidebar"  },
  { id: "t9_grid",     name: "Grid",       desc: "tabularX header · Two-column grid",    layout: "twocol"   },
  { id: "t10_premium", name: "Premium",    desc: "Large header · Premium tcolorbox",     layout: "boxed"    },
]

const TEXT_COLORS = [
  { name: "Slate",    hex: "#1e293b" },
  { name: "Indigo",   hex: "#2563EB" },
  { name: "Emerald",  hex: "#16a34a" },
  { name: "Rose",     hex: "#dc2626" },
  { name: "Amber",    hex: "#d97706" },
  { name: "Violet",   hex: "#7c3aed" },
  { name: "Cyan",     hex: "#0891b2" },
  { name: "Pink",     hex: "#db2777" },
  { name: "Orange",   hex: "#ea580c" },
  { name: "Teal",     hex: "#065f46" },
  { name: "Purple",   hex: "#6b21a8" },
  { name: "Crimson",  hex: "#9f1239" },
]

// ─── Template Thumb SVGs ──────────────────────────────────────────────────────
function TemplateThumbnail({ layout, active }: { layout: string, active: boolean }) {
  const p = active ? "#2563EB" : "#94a3b8"
  const bg = "#f8fafc"
  if (layout === "sidebar") return (
    <svg viewBox="0 0 80 56" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="56" fill={bg} rx="2"/>
      <rect width="20" height="56" fill={active ? "#dbeafe" : "#e2e8f0"} rx="2"/>
      <rect x="3" y="4" width="10" height="6" fill={p} rx="1" opacity="0.4"/>
      <rect x="3" y="14" width="8" height="1.5" fill={p} rx="0.5"/>
      <rect x="3" y="17" width="12" height="1" fill="#cbd5e1" rx="0.5"/>
      <rect x="25" y="6" width="40" height="4" fill={p} rx="1"/>
      <rect x="25" y="12" width="48" height="0.8" fill={p} opacity="0.3"/>
      <rect x="25" y="16" width="20" height="1.5" fill={p} rx="0.5"/>
      <rect x="25" y="19" width="48" height="1" fill="#cbd5e1" rx="0.5"/>
      <rect x="25" y="21" width="44" height="1" fill="#cbd5e1" rx="0.5"/>
    </svg>
  )
  if (layout === "twocol") return (
    <svg viewBox="0 0 80 56" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="56" fill={bg} rx="2"/>
      <rect x="25" y="3" width="30" height="5" fill={p} rx="1"/>
      <rect x="6" y="10" width="68" height="0.8" fill={p} opacity="0.4"/>
      <rect x="6" y="14" width="35" height="1.5" fill={p} rx="0.5"/>
      <rect x="6" y="17" width="33" height="1" fill="#cbd5e1" rx="0.5"/>
      <rect x="6" y="19" width="35" height="1" fill="#cbd5e1" rx="0.5"/>
      <rect x="6" y="23" width="35" height="1.5" fill={p} rx="0.5"/>
      <rect x="6" y="26" width="33" height="1" fill="#cbd5e1" rx="0.5"/>
      <rect x="45" y="14" width="28" height="1.5" fill={p} rx="0.5"/>
      <rect x="45" y="17" width="28" height="1" fill="#cbd5e1" rx="0.5"/>
      <rect x="45" y="19" width="24" height="1" fill="#cbd5e1" rx="0.5"/>
      <rect x="45" y="23" width="28" height="1.5" fill={p} rx="0.5"/>
    </svg>
  )
  if (layout === "boxed") return (
    <svg viewBox="0 0 80 56" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="56" fill={bg} rx="2"/>
      <rect x="25" y="3" width="30" height="5" fill={p} rx="1"/>
      <rect x="6" y="11" width="68" height="8" fill="none" stroke={p} strokeWidth="0.8" rx="1"/>
      <rect x="8" y="13" width="30" height="1.5" fill={p} opacity="0.5" rx="0.5"/>
      <rect x="8" y="16" width="50" height="1" fill="#cbd5e1" rx="0.5"/>
      <rect x="6" y="22" width="68" height="8" fill="none" stroke={p} strokeWidth="0.8" rx="1"/>
      <rect x="8" y="24" width="24" height="1.5" fill={p} opacity="0.5" rx="0.5"/>
      <rect x="8" y="27" width="58" height="1" fill="#cbd5e1" rx="0.5"/>
      <rect x="6" y="33" width="68" height="8" fill="none" stroke={p} strokeWidth="0.8" rx="1"/>
      <rect x="8" y="35" width="28" height="1.5" fill={p} opacity="0.5" rx="0.5"/>
      <rect x="8" y="38" width="50" height="1" fill="#cbd5e1" rx="0.5"/>
    </svg>
  )
  if (layout === "accent") return (
    <svg viewBox="0 0 80 56" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="56" fill={bg} rx="2"/>
      <rect x="55" y="3" width="18" height="8" fill={p} rx="1" opacity="0.3"/>
      <rect x="6" y="6" width="40" height="5" fill={p} rx="1"/>
      <rect x="6" y="14" width="68" height="0.8" fill="#cbd5e1"/>
      <rect x="6" y="18" width="3" height="10" fill={p} rx="0.5"/>
      <rect x="12" y="19" width="18" height="2" fill={p} opacity="0.7" rx="0.5"/>
      <rect x="12" y="22" width="55" height="1" fill="#cbd5e1" rx="0.5"/>
      <rect x="12" y="24" width="50" height="1" fill="#cbd5e1" rx="0.5"/>
      <rect x="6" y="29" width="3" height="10" fill={p} rx="0.5"/>
      <rect x="12" y="30" width="22" height="2" fill={p} opacity="0.7" rx="0.5"/>
      <rect x="12" y="33" width="48" height="1" fill="#cbd5e1" rx="0.5"/>
    </svg>
  )
  // classic (default)
  return (
    <svg viewBox="0 0 80 56" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="56" fill={bg} rx="2"/>
      <rect x="48" y="3" width="24" height="8" fill={p} rx="1" opacity="0.25"/>
      <rect x="6" y="5" width="38" height="5" fill={p} rx="1"/>
      <rect x="6" y="12" width="68" height="0.8" fill={p} opacity="0.3"/>
      <rect x="6" y="15" width="65" height="1" fill="#cbd5e1" rx="0.5"/>
      <rect x="6" y="20" width="20" height="2" fill={p} rx="0.5"/>
      <rect x="6" y="23" width="65" height="1" fill="#cbd5e1" rx="0.5"/>
      <rect x="6" y="25" width="58" height="1" fill="#cbd5e1" rx="0.5"/>
      <rect x="6" y="30" width="22" height="2" fill={p} rx="0.5"/>
      <rect x="6" y="33" width="65" height="1" fill="#cbd5e1" rx="0.5"/>
      <rect x="6" y="35" width="50" height="1" fill="#cbd5e1" rx="0.5"/>
    </svg>
  )
}

// ─── Inline PDF Preview (center canvas mode) ──────────────────────────────────
function InlinePreview({
  jdId, templateId, accentColor, onBack, onProceed, currentContent
}: { jdId: string, templateId: string, accentColor: string, onBack: () => void, onProceed: () => void, currentContent: any }) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState(0)
  const steps = [
    "Analyzing JD content",
    "Filling missing sections with AI",
    "Compiling LaTeX template",
    "Rendering Wissen PDF",
  ]

  useEffect(() => {
    if (!loading) return
    const iv = setInterval(() => setStep(s => s < steps.length - 1 ? s + 1 : s), 1800)
    return () => clearInterval(iv)
  }, [loading])

  useEffect(() => {
    let url: string
    const load = async () => {
      try {
        const token = localStorage.getItem("token")
        const res = await fetch(
          `${API_BASE_URL}/jds/${jdId}/export/pdf?template_id=${templateId}&preview=true${accentColor ? `&accent_color=${accentColor.replace('#','')}` : ''}`,
          { 
            method: "POST",
            headers: { 
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}) 
            },
            body: JSON.stringify({ content: JSON.stringify(currentContent) })
          }
        )
        if (!res.ok) {
          const err = await res.json().catch(() => ({ detail: "Compilation failed" }))
          throw new Error(err.detail || "Failed")
        }
        const blob = await res.blob()
        url = URL.createObjectURL(blob)
        setPdfUrl(url)
      } catch (e: any) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    load()
    return () => { if (url) URL.revokeObjectURL(url) }
  }, [jdId, templateId, accentColor, currentContent])

  const download = () => {
    if (!pdfUrl) return
    const a = document.createElement("a"); a.href = pdfUrl
    a.download = `wissen_jd_${templateId}.pdf`; a.click()
  }

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* Preview topbar */}
      <div className="flex items-center justify-between px-8 py-4 bg-white border-b border-slate-100 shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 text-sm font-bold transition-colors group">
            <div className="w-8 h-8 rounded-xl bg-slate-100 group-hover:bg-slate-200 flex items-center justify-center transition-colors">
              <EyeOff className="w-4 h-4" />
            </div>
            Back to Edit
          </button>
          <div className="w-px h-6 bg-slate-200" />
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-black uppercase tracking-widest text-slate-400">
              {TEMPLATES.find(t => t.id === templateId)?.name} Template
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {pdfUrl && (
            <button onClick={download} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition-colors">
              <Download className="w-3.5 h-3.5" /> Download
            </button>
          )}
          <button onClick={onProceed} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-black transition-all shadow-lg shadow-blue-600/20 active:scale-95">
            Finalize & Source <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* PDF Area */}
      <div className="flex-1 flex items-center justify-center overflow-hidden p-8">
        {loading && (
          <div className="flex flex-col items-center text-center max-w-xs">
            {/* Orbital loader */}
            <div className="relative w-24 h-24 mb-8">
              <div className="absolute inset-0 rounded-full border-4 border-blue-100" />
              <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" style={{ animationDuration: "1.2s" }} />
              <div className="absolute inset-4 rounded-full border-2 border-blue-300 border-b-transparent animate-spin" style={{ animationDuration: "2s", animationDirection: "reverse" }} />
              <div className="absolute inset-0 flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <h3 className="text-slate-900 font-black text-xl mb-3">Building your PDF</h3>
            <div key={step} className="text-slate-400 text-sm font-semibold animate-in fade-in slide-in-from-bottom-1 duration-500">
              {steps[step]}...
            </div>
            <div className="w-40 h-1.5 bg-slate-200 rounded-full mt-6 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-[1800ms]"
                style={{ width: `${((step + 1) / steps.length) * 100}%` }} />
            </div>
            <div className="flex gap-1.5 mt-4">
              {steps.map((_, i) => (
                <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${i <= step ? 'bg-blue-600' : 'bg-slate-200'}`} />
              ))}
            </div>
          </div>
        )}
        {error && (
          <div className="max-w-md text-center bg-white rounded-3xl border border-red-100 p-10 shadow-xl">
            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <X className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-slate-900 font-black text-lg mb-2">LaTeX Error</h3>
            <p className="text-slate-500 text-sm leading-relaxed mb-6">{error}</p>
            <button onClick={onBack} className="px-6 py-3 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest">
              ← Back to Edit
            </button>
          </div>
        )}
        {pdfUrl && !loading && (
          <div className="w-full h-full animate-in fade-in zoom-in-95 duration-700 shadow-2xl shadow-slate-900/20 rounded-2xl overflow-hidden" style={{ maxWidth: "860px", maxHeight: "100%" }}>
            <iframe
              src={`${pdfUrl}#toolbar=0&view=FitH`}
              className="w-full h-full bg-white"
              style={{ minHeight: "700px" }}
            />
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main Builder ─────────────────────────────────────────────────────────────
function BuilderPageContent() {
  const [chatInput, setChatInput] = useState("")
  const [taggedSections, setTaggedSections] = useState<string[]>([])
  const [showCommandMenu, setShowCommandMenu] = useState(false)
  const [isRefining, setIsRefining] = useState(false)
  const [isEvaluating, setIsEvaluating] = useState(false)
  const [showEvaluation, setShowEvaluation] = useState(false)
  const [currentReport, setCurrentReport] = useState("")
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
  const [isListening, setIsListening] = useState(false)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [tempTitle, setTempTitle] = useState("")
  const [activeColor, setActiveColor] = useState("#1e293b")
  const [selectedTemplate, setSelectedTemplate] = useState("t1_classic")
  const [accentColor, setAccentColor] = useState("#2563EB")   // template tint colour
  const [viewMode, setViewMode] = useState<"edit" | "preview">("edit")
  const [previewKey, setPreviewKey] = useState(0)
  const [inviteEmail, setInviteEmail] = useState("")
  const [isInviting, setIsInviting] = useState(false)
  const [showInviteForm, setShowInviteForm] = useState(false)
  const [showAddSectionModal, setShowAddSectionModal] = useState(false)
  const [newSectionName, setNewSectionName] = useState("")
  // Capture the selection reference for toolbar formatting
  const savedRangeRef = useRef<{ node: Node; start: number; end: number } | null>(null)

  const router = useRouter()
  const searchParams = useSearchParams()
  const urlJdId = searchParams.get("jd_id")
  const { user } = useAuth()
  const { jds, updateJD, markAsFinalized, isLoaded, updateJDTitle } = useJDs()
  const [selectedJDId, setSelectedJDId] = useState<string>(urlJdId || "")
  const [cleanTranscript, setCleanTranscript] = useState<string>("")
  const [collaborators, setCollaborators] = useState<any[]>([])

  const currentJD = jds.find((j: any) => j.id === (selectedJDId || urlJdId)) || jds[0]
  const lastSelectionRange = useRef<Range | null>(null)
  const recognitionRef = useRef<any>(null)

  const saveSelection = useCallback(() => {
    const sel = window.getSelection()
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0)
      let parent: any = range.commonAncestorContainer
      if (parent.nodeType === 3) parent = parent.parentNode
      if (parent?.closest?.('[contenteditable="true"]')) {
        lastSelectionRange.current = range
      }
    }
  }, [])

  const restoreSelection = useCallback(() => {
    const range = lastSelectionRange.current
    if (!range) return
    try {
      const sel = window.getSelection()
      if (sel) { sel.removeAllRanges(); sel.addRange(range) }
    } catch {}
  }, [])

  // execFormat: called via onMouseDown on toolbar buttons.
  // e.preventDefault() keeps focus in the editor, so the selection is still live.
  // We still call restoreSelection() as a fallback for edge cases.
  const execFormat = useCallback((e: React.MouseEvent, cmd: string, val?: string) => {
    e.preventDefault()
    restoreSelection()
    document.execCommand(cmd, false, val)
  }, [restoreSelection])

  useEffect(() => {
    document.addEventListener("mouseup", saveSelection)
    document.addEventListener("keyup", saveSelection)
    return () => { document.removeEventListener("mouseup", saveSelection); document.removeEventListener("keyup", saveSelection) }
  }, [saveSelection])

  // URL sync + load that JD's stored template
  // Also re-runs whenever the URL ?jd_id param changes (e.g. browser back/forward or switchJD)
  useEffect(() => {
    if (!isLoaded || jds.length === 0) return
    const target = urlJdId || jds[0].id
      if (target !== selectedJDId) {
        setSelectedJDId(target)
        
        const jd = jds.find(j => j.id === target)
        const savedTpl = localStorage.getItem(`jdforge_template_${target}`) || jd?.template_used || 't1_classic'
        const savedClr = localStorage.getItem(`jdforge_accent_${target}`) || jd?.accent_color || '#2563EB'
        setSelectedTemplate(savedTpl)
        setAccentColor(savedClr)

        setViewMode('edit')
        setShowEvaluation(false)
        setCollapsed({})
        setCurrentReport("")
        setIsRefining(false)
        setIsEvaluating(false)
      }
  }, [isLoaded, jds, urlJdId, selectedJDId])

  useEffect(() => {
    if (selectedJDId) localStorage.setItem(`jdforge_template_${selectedJDId}`, selectedTemplate)
  }, [selectedTemplate, selectedJDId])

  useEffect(() => {
    if (selectedJDId) localStorage.setItem(`jdforge_accent_${selectedJDId}`, accentColor)
  }, [accentColor, selectedJDId])

  useEffect(() => {
    if (!selectedJDId) return
    fetchApi(`/jds/${selectedJDId}/collaborators`).then(setCollaborators).catch(() => {})
    if (currentJD?.transcript_id) {
      fetchApi(`/transcripts/${currentJD.transcript_id}`)
        .then(t => setCleanTranscript(t.clean_text || t.raw_text || ""))
        .catch(() => {})
    }
  }, [selectedJDId, currentJD?.transcript_id])

  // Dynamically extract sections being spoken or typed
  useEffect(() => {
    if (!chatInput.trim() || !currentJD?.content?.sections) return
    const txt = chatInput.toLowerCase()
    const autoTags = Object.keys(currentJD.content.sections).filter(s => txt.includes(s.toLowerCase()))
    
    if (autoTags.length > 0) {
      setTaggedSections(prev => {
        const toAdd = autoTags.filter(t => !prev.includes(t))
        return toAdd.length > 0 ? [...prev, ...toAdd] : prev
      })
    }
  }, [chatInput, currentJD])

  const handleRefine = async () => {
    if (!selectedJDId || !chatInput.trim() || !currentJD) return
    setIsRefining(true)
    try {
      const updated = await fetchApi(`/jds/${selectedJDId}/refine`, {
        method: "POST",
        body: JSON.stringify({ 
          prompt: chatInput, 
          tags: taggedSections,
          content: JSON.stringify(currentJD.content)
        })
      })
      if (typeof updated.content === "string") { try { updated.content = JSON.parse(updated.content) } catch {} }
      updateJD(updated); setChatInput(""); setTaggedSections([])
      toast.success("Refined!")
    } catch { toast.error("Refinement failed.") } finally { setIsRefining(false) }
  }

  const handleEvaluate = async (targetJD?: any) => {
    // 1. Resolve ID with multi-layer fallback
    let id = targetJD?.id || currentJD?.id || urlJdId
    if (!id && jds.length > 0) id = jds[0].id

    if (!id || id === 'undefined') {
       console.error("Assessment Failed: No valid JD ID found in state, URL, or fallback.");
       toast.error("ID resolution failed. Please refresh.")
       return
    }

    // 2. Resolve Content (ensure we use the improved one if available)
    const activeJD = (targetJD && typeof targetJD === 'object' && targetJD.content) 
                     ? targetJD 
                     : (jds.find((j: any) => j.id === id) || currentJD)

    if (!activeJD || !activeJD.content) {
       console.error("Assessment Failed: No content found for JD", id);
       return
    }

    setIsEvaluating(true); setShowEvaluation(true)
    try {
      console.log(`Starting Quality Audit for JD: ${id}`)
      const res = await fetchApi(`/jds/${id}/score`, {
        method: "POST", body: JSON.stringify({ 
          transcript: "",  
          jd: typeof activeJD.content === 'string' ? activeJD.content : JSON.stringify(activeJD.content) 
        })
      })
      
      // Update state with new score while keeping the improved content
      updateJD({ ...activeJD, quality_score: res.scores })
      setCurrentReport(res.report)
      toast.success("Assessment Complete")
    } catch (err) { 
      console.error("Evaluation API Error:", err)
      toast.error("Evaluation failed.")
      setShowEvaluation(false) 
    } finally { 
      setIsEvaluating(false) 
    }
  }

  const handleAutoApply = async () => {
    if (!currentJD || !currentReport) return
    setIsRefining(true)
    
    // Extract actions/recommendations from report
    const reportLines = currentReport.split('\n').filter(Boolean)
    const recommendations = reportLines.filter(l => /add|includ|mention|emphasize|consider|improve|weak|miss|lack/i.test(l))
    
    if (recommendations.length === 0) {
      toast.info("No specific improvements detected to auto-apply.")
      setIsRefining(false)
      return
    }

    try {
      const updated = await fetchApi(`/jds/${currentJD.id}/auto-apply`, {
        method: "POST",
        body: JSON.stringify({ 
          recommendations,
          content: JSON.stringify(currentJD.content)
        })
      })
      updateJD({ ...updated, quality_score: currentJD.quality_score })
      toast.success("AI improvements applied!")
      
      // Automatically re-evaluate using the FRESHLY UPDATED content
      setTimeout(() => handleEvaluate(updated), 200)
    } catch {
      toast.error("Auto-apply failed.")
    } finally {
      setIsRefining(false)
    }
  }

  const handleMicClick = () => {
    if (isListening) { recognitionRef.current?.stop(); setIsListening(false); return }
    if (!("webkitSpeechRecognition" in window)) { toast.error("Speech not supported."); return }
    const r = new (window as any).webkitSpeechRecognition()
    r.continuous = true
    r.onstart = () => setIsListening(true)
    r.onerror = r.onend = () => setIsListening(false)
    r.onresult = (e: any) => setChatInput(p => p ? `${p} ${e.results[e.results.length - 1][0].transcript}` : e.results[e.results.length - 1][0].transcript)
    r.start(); recognitionRef.current = r
  }

  const handleUpdate = (field: string, value: any) => {
    if (!currentJD) return
    updateJD({ ...currentJD, content: { ...currentJD.content, sections: { ...(currentJD.content?.sections || {}), [field]: value } } })
  }

  const handleDeleteSection = (title: string) => {
    if (!currentJD) return
    const newSections = { ...currentJD.content.sections }
    delete newSections[title]
    updateJD({ ...currentJD, content: { ...currentJD.content, sections: newSections } })
  }


  const handleProceed = async () => {
    if (!currentJD) return
    setIsRefining(true)
    try {
      await fetchApi(`/jds/${currentJD.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          status: "finalized",
          content: JSON.stringify(currentJD.content),
          template_used: selectedTemplate,
          accent_color: accentColor
        })
      })
      localStorage.removeItem(`jd_backup_${currentJD.id}`)
      localStorage.removeItem(`jdforge_template_${currentJD.id}`)
      localStorage.removeItem(`jdforge_accent_${currentJD.id}`)
      router.push(`/sourcing?jd_id=${currentJD.id}`)
    } catch {
      toast.error("Failed to save and proceed.")
    } finally {
      setIsRefining(false)
    }
  }

  const handleInvite = async () => {
    if (!inviteEmail.trim() || !currentJD) return
    setIsInviting(true)
    try {
      await fetchApi(`/jds/${currentJD.id}/invite`, { method: 'POST', body: JSON.stringify({ email: inviteEmail.trim() }) })
      toast.success(`Invited ${inviteEmail}`)
      setInviteEmail('')
      setShowInviteForm(false)
      // Refresh collaborators
      const updated = await fetchApi(`/jds/${currentJD.id}/collaborators`)
      setCollaborators(updated)
    } catch (e: any) { toast.error(e.message || 'Invite failed') }
    finally { setIsInviting(false) }
  }

  const switchJD = (jdId: string) => {
    if (jdId === selectedJDId) return
    // Persist template for current JD before switching
    if (currentJD?.id) localStorage.setItem(`jdforge_template_${currentJD.id}`, selectedTemplate)
    // Load template for target JD immediately (don't wait for effect)
    const saved = localStorage.getItem(`jdforge_template_${jdId}`) || 't1_classic'
    setSelectedTemplate(saved)
    setSelectedJDId(jdId)           
    setViewMode('edit')
    setShowEvaluation(false)
    setCollapsed({})
    setCurrentReport("")
    setIsRefining(false)
    setIsEvaluating(false)
    // Also update URL for bookmarkability (shallow replace to avoid full navigation)
    router.replace(`/builder?jd_id=${jdId}`, { scroll: false })
  }

  const triggerPreview = (templateId?: string) => {
    const tpl = templateId || selectedTemplate
    if (templateId && templateId !== selectedTemplate) setSelectedTemplate(templateId)
    if (currentJD?.id) localStorage.setItem(`jdforge_template_${currentJD.id}`, tpl)
    setPreviewKey(k => k + 1)
    setViewMode("preview")
  }

  // Also save template whenever it's selected in the picker (without triggering preview)
  const selectTemplate = (templateId: string) => {
    setSelectedTemplate(templateId)
    if (currentJD?.id) localStorage.setItem(`jdforge_template_${currentJD.id}`, templateId)
  }

  if (!currentJD) return <AppShell><div className="p-20 text-slate-400">JD not found.</div></AppShell>

  const sections = currentJD?.content?.sections || {}



  const totalSections = Object.keys(sections).length
  const filledCount = Object.values(sections).filter(v => (typeof v === "string" ? v.replace(/<[^>]*>/g, "").trim() : String(v).trim()).length > 0).length
  const pct = totalSections > 0 ? Math.round((filledCount / totalSections) * 100) : 0
  const words = Object.values(sections).reduce((a: number, v: any) => a + (typeof v === "string" ? v.replace(/<[^>]*>/g, "") : String(v)).trim().split(/\s+/).filter(Boolean).length, 0)

  return (
    <AppShell>
      <div className="flex-1 w-full flex overflow-hidden h-full min-h-0">

        {/* ═══ LEFT: ROLES + TEAM ═══ */}
        <div className="w-[260px] shrink-0 flex flex-col h-full border-r border-slate-100 bg-white">
          {/* Roles — ALL JDs with scrollable fixed height */}
          {(() => {
            const draftJDs = jds.filter((j: any) => j.status !== 'finalized')
            const nextDraft = draftJDs.find((j: any) => j.id !== selectedJDId)
            const allDone = draftJDs.length === 0
            return (
              <div className="px-5 pt-7 pb-4 flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-[9px] font-black uppercase tracking-[0.25em] text-slate-400">All Roles</p>
                  <span className="text-[8px] font-black text-slate-400">{jds.filter((j:any)=>j.status==='finalized').length}/{jds.length} done</span>
                </div>
                {/* Scrollable list — fixed height */}
                <div className="space-y-1 overflow-y-auto" style={{ maxHeight: '260px', scrollbarWidth: 'thin', scrollbarColor: '#e2e8f0 transparent' }}>
                  {jds.map((jd: any) => {
                    const active = jd.id === selectedJDId
                    const done = jd.status === 'finalized'
                    // Optimization: Get template from jd object or fallback to cache
                    const templateName = jd.template_used || (typeof window !== 'undefined' ? localStorage.getItem(`jdforge_template_${jd.id}`) : null)
                    
                    return (
                      <button key={jd.id} onClick={() => switchJD(jd.id)}
                        className={`w-full group flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-colors duration-200 ${active ? "bg-blue-600 shadow-lg shadow-blue-600/20" : done ? "hover:bg-emerald-50 bg-slate-50/50" : "hover:bg-slate-50"}`}>
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-[10px] font-black ${active ? "bg-white/20 text-white" : done ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                          {jd.title?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-center h-8">
                          <span className={`text-[11px] font-bold truncate block ${active ? "text-white" : "text-slate-700"}`}>{jd.title}</span>
                          {templateName ? (
                            <span className={`text-[8px] font-bold truncate block ${active ? "text-blue-100 opacity-80" : "text-slate-400"}`}>
                              {templateName.replace(/t\d+_|tpl_/g, '').replace(/_/g, ' ')}
                            </span>
                          ) : (
                            <span className="text-[8px] opacity-0 block h-3">--</span>
                          )}
                        </div>
                        {done
                          ? <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 ${active ? 'text-white/70' : 'text-emerald-500'}`} />
                          : <Circle className={`w-2.5 h-2.5 shrink-0 ${active ? 'text-white/40' : 'text-slate-300'}`} />
                        }
                      </button>
                    )
                  })}
                </div>
                {/* Next Draft / All Done CTA */}
                <div className="mt-3">
                  {allDone ? (
                    <button onClick={() => router.push('/sourcing')}
                      className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-600/20">
                      <CheckCircle2 className="w-3.5 h-3.5" /> All Done · Source
                    </button>
                  ) : nextDraft ? (
                    <button onClick={() => switchJD(nextDraft.id)}
                      className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
                      Next Draft <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  ) : null}
                </div>
              </div>
            )
          })()}

          <div className="mx-5 h-px bg-slate-100" />

          {/* Actions */}
          <div className="px-5 py-4 space-y-1.5 shrink-0">
            <p className="text-[9px] font-black uppercase tracking-[0.25em] text-slate-400 mb-3">Actions</p>
            <button onClick={showEvaluation ? () => setShowEvaluation(false) : handleEvaluate}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold border transition-all ${showEvaluation ? "bg-amber-50 text-amber-700 border-amber-200" : "text-slate-600 border-slate-200 hover:bg-slate-50"}`}>
              <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              {isEvaluating ? "Scoring..." : showEvaluation ? "Hide Score" : "Quality Score"}
            </button>
            <button onClick={() => {
              if (!sections) return
              const text = Object.entries(sections).map(([k, v]) => `${k}\n${typeof v === "string" ? v.replace(/<[^>]*>/g, "") : v}`).join("\n\n")
              navigator.clipboard.writeText(text); toast.success("Copied!")
            }} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-600 border border-slate-200 hover:bg-slate-50 transition-all">
              <Copy className="w-3.5 h-3.5 text-slate-400 shrink-0" /> Copy Text
            </button>
          </div>

          <div className="mx-5 h-px bg-slate-100" />

          {/* Source Transcript — collapsible */}
          {cleanTranscript ? (
            <div className="px-5 py-3 shrink-0">
              <details className="group">
                <summary className="cursor-pointer list-none flex items-center justify-between">
                  <p className="text-[9px] font-black uppercase tracking-[0.25em] text-slate-400">Source Transcript</p>
                  <ChevronDown className="w-3 h-3 text-slate-300 group-open:rotate-180 transition-transform" />
                </summary>
                <div className="mt-2 max-h-36 overflow-y-auto rounded-xl bg-slate-50 p-3 text-[10px] text-slate-500 leading-relaxed font-mono" style={{ scrollbarWidth: 'thin' }}>
                  {cleanTranscript}
                </div>
              </details>
            </div>
          ) : null}

          <div className="mx-5 h-px bg-slate-100" />

          {/* Team */}
          <div className="flex-1 px-5 py-4 flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[9px] font-black uppercase tracking-[0.25em] text-slate-400">Team</p>
              <button onClick={() => setShowInviteForm(p => !p)}
                className="w-6 h-6 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 flex items-center justify-center transition-all" title="Invite">
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
            {showInviteForm && (
              <div className="mb-3 flex gap-1.5">
                <input value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleInvite()}
                  placeholder="colleague@wissen.com"
                  className="flex-1 text-[10px] px-2.5 py-1.5 rounded-lg border border-slate-200 outline-none focus:border-blue-400 bg-white text-slate-700"
                />
                <button onClick={handleInvite} disabled={isInviting}
                  className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black rounded-lg disabled:opacity-40 transition-all">
                  {isInviting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Mail className="w-3 h-3" />}
                </button>
              </div>
            )}
            <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar">
              {collaborators.map(c => {
                const isYou = c.email === user?.email
                return (
                  <div key={c.user_id} className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50">
                    <div className="relative shrink-0">
                      <div className="w-7 h-7 rounded-lg bg-slate-800 text-white text-[10px] font-black flex items-center justify-center uppercase">
                        {c.name?.[0] || c.email[0]}
                      </div>
                      {c.is_owner && <Crown className="w-2.5 h-2.5 text-amber-500 absolute -top-1 -right-1" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-[11px] font-bold text-slate-800 truncate">{c.name || 'Member'}</p>
                        {isYou && <span className="text-[7px] font-black uppercase tracking-wider bg-blue-100 text-blue-600 px-1 py-0.5 rounded">YOU</span>}
                      </div>
                      <p className="text-[9px] text-slate-400 truncate">{c.email}</p>
                    </div>
                  </div>
                )
              })}
              {collaborators.length === 0 && (
                <div className="text-center py-4">
                  <Users className="w-6 h-6 text-slate-200 mx-auto mb-1.5" />
                  <p className="text-[10px] text-slate-400">No team yet</p>
                  <button onClick={() => setShowInviteForm(true)} className="text-[9px] font-black text-blue-500 hover:underline mt-1">+ Invite someone</button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ═══ CENTER: EDITOR or PREVIEW ═══ */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-white">
          {viewMode === "preview" ? (
            <InlinePreview
              key={previewKey}
              jdId={currentJD.id}
              templateId={selectedTemplate}
              accentColor={accentColor}
              onBack={() => setViewMode("edit")}
              onProceed={handleProceed}
              currentContent={currentJD.content}
            />
          ) : (
            <>
              {/* Header */}
              <div className="px-10 py-6 border-b border-slate-50 shrink-0">
                <div className="max-w-3xl mx-auto">
                  {isEditingTitle ? (
                    <input autoFocus value={tempTitle} onChange={e => setTempTitle(e.target.value)}
                      onBlur={() => { setIsEditingTitle(false); if (tempTitle.trim() && tempTitle !== currentJD.title) updateJDTitle(selectedJDId, tempTitle.trim()) }}
                      onKeyDown={e => { if (e.key === "Enter") { setIsEditingTitle(false); if (tempTitle.trim()) updateJDTitle(selectedJDId, tempTitle.trim()) } if (e.key === "Escape") setIsEditingTitle(false) }}
                      className="text-3xl font-black text-slate-900 bg-transparent border-b-2 border-blue-500 outline-none w-full mb-4"
                    />
                  ) : (
                    <button onClick={() => { setTempTitle(currentJD.title); setIsEditingTitle(true) }} className="group flex items-center gap-2 mb-4">
                      <h1 className="text-3xl font-black text-slate-900 tracking-tight">{currentJD.title}</h1>
                      <Pencil className="w-4 h-4 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      <span>{words} words</span>
                      <div className="w-1 h-1 rounded-full bg-slate-200" />
                      <span className="flex items-center gap-2">
                        <div className="w-20 h-1 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: pct >= 80 ? "#16a34a" : pct >= 50 ? "#d97706" : "#dc2626" }} />
                        </div>
                        {pct}% complete
                      </span>
                    </div>
                    
                    <button 
                      onClick={() => handleEvaluate()}
                      disabled={isEvaluating}
                      className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-600 text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50"
                    >
                      {isEvaluating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                      {currentJD?.quality_score ? `Score: ${currentJD.quality_score.overall_score || 0}%` : 'Assess Quality'}
                    </button>
                  </div>
                </div>
              </div>

              {showEvaluation && (() => {
                const score = currentJD?.quality_score?.overall_score || 0
                const scoreColor = score >= 85 ? '#059669' : score >= 70 ? '#2563EB' : score >= 50 ? '#D97706' : '#DC2626'
                const r = 42, circ = 2 * Math.PI * r
                const dash = (Math.min(score, 100) / 100) * circ
                const sectionScores = currentJD?.quality_score?.section_scores || {}
                const reportLines = (currentReport || '').split('\n').filter(Boolean)
                const recommendations = reportLines.filter(l => l.includes('→')).map(l => l.replace(/^[→\s\-]*/, ''))
                
                return (
                  <div className="border-b border-slate-100 bg-white/50 backdrop-blur-md px-10 py-10 shrink-0 relative overflow-hidden">
                    <div className="max-w-4xl mx-auto flex gap-12 items-center relative z-10">
                      {/* Left: Big Score Unit */}
                      <div className="flex flex-col items-center">
                        <div className="relative w-32 h-32 group">
                          <div className={`absolute inset-0 rounded-full blur-2xl opacity-10 transition-colors duration-1000`} style={{ background: scoreColor }} />
                          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                            <circle cx="50" cy="50" r={r} fill="none" stroke="#f1f5f9" strokeWidth="6" />
                            <circle cx="50" cy="50" r={r} fill="none" stroke={scoreColor} strokeWidth="6"
                              strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round"
                              className="transition-all duration-1000 ease-out" />
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-4xl font-black tracking-tighter" style={{ color: scoreColor }}>{score || '--'}</span>
                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest -mt-1">Score</span>
                          </div>
                        </div>
                        <div className={`mt-4 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-white shadow-lg`} style={{ background: scoreColor }}>
                          {score >= 85 ? 'Pristine' : score >= 70 ? 'Professional' : 'Needs Polish'}
                        </div>
                      </div>

                      {/* Middle: Detailed Section Analysis */}
                      <div className="flex-1 grid grid-cols-2 gap-x-8 gap-y-4">
                        {Object.entries(sectionScores).map(([k, v]: any) => (
                          <div key={k} className="group">
                            <div className="flex justify-between items-end mb-2">
                              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover:text-slate-600 transition-colors">{k.replace(/_/g, ' ')}</span>
                              <span className="text-xs font-black text-slate-900">{v}%</span>
                            </div>
                            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full rounded-full transition-all duration-1000 ease-out" 
                                style={{ width: `${v}%`, background: v >= 80 ? '#059669' : v >= 60 ? '#3B82F6' : '#EF4444' }} />
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Right: Smart Recommendations Card */}
                      <div className="w-80 flex flex-col h-full self-stretch">
                        <div className="flex-1 bg-slate-50 border border-slate-100 rounded-[24px] p-6 flex flex-col shadow-sm">
                          <div className="flex items-center gap-2 mb-4">
                            <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Smart Improvements</span>
                          </div>
                          <div className="flex-1 space-y-3 overflow-y-auto max-h-[140px] pr-2 custom-scrollbar">
                            {recommendations.length > 0 ? recommendations.map((msg, i) => (
                              <div key={i} className="flex gap-2 text-[11px] leading-relaxed text-slate-600 font-medium group/rec">
                                <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0 group-hover/rec:scale-125 transition-transform" />
                                {msg}
                              </div>
                            )) : (
                              <p className="text-[11px] text-slate-400 italic">No critical improvements needed. Your JD is looking sharp!</p>
                            )}
                          </div>
                          <button onClick={handleAutoApply} disabled={isRefining}
                            className="mt-6 w-full flex items-center justify-center gap-2 py-3 bg-slate-900 hover:bg-black text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-slate-900/10 active:scale-95 disabled:opacity-50">
                            {isRefining ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5 text-blue-400" />}
                            Apply All Fixes
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    {/* Floating close button */}
                    <button onClick={() => setShowEvaluation(false)} className="absolute top-6 right-6 p-2 text-slate-300 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-all">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )
              })()}
              {/* Document canvas */}
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="max-w-3xl mx-auto px-10 py-10 space-y-8 pb-40">
                  {Object.entries(sections).map(([title, content], idx) => {
                    const id = title.toLowerCase().replace(/\s+/g, "-")
                    const text = typeof content === "string" ? content : ""
                    const empty = !text.replace(/<[^>]*>/g, "").trim()
                    return (
                      <div key={`${selectedJDId}-${idx}`} className={`group ${taggedSections.includes(title) ? "ring-2 ring-blue-400 bg-blue-50/50 rounded-2xl p-4 -mx-4 transition-all" : "transition-all p-4 -mx-4 border border-transparent"}`}>
                        <div className="flex items-center gap-3 mb-3 cursor-pointer select-none" onClick={() => setCollapsed(p => ({ ...p, [id]: !p[id] }))}>
                          <ChevronDown className={`w-3.5 h-3.5 text-blue-400 transition-transform ${collapsed[id] ? "-rotate-90" : ""}`} />
                          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{title}</h3>
                          <div className={`flex-1 h-0.5 rounded-full transition-colors ${taggedSections.includes(title) ? 'bg-blue-200' : 'bg-slate-50 group-hover:bg-slate-100'}`} />
                          {empty && <span className="text-[9px] font-black uppercase tracking-wider text-amber-500 bg-amber-50 px-2 py-0.5 rounded-full">AI Fill</span>}
                          
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDeleteSection(title); }}
                            className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                            title="Delete Section"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>

                        {!collapsed[id] && (
                          <div
                            className={`min-h-[32px] text-base leading-relaxed text-slate-700 outline-none focus:outline-none px-1 rounded-lg transition-all focus-within:ring-2 focus-within:ring-blue-100 ${taggedSections.includes(title) ? 'font-medium' : ''} empty:before:content-['Type_or_use_AI...'] empty:before:text-slate-300`}
                            contentEditable
                            suppressContentEditableWarning
                            onBlur={e => handleUpdate(title, e.currentTarget.innerHTML)}
                            dangerouslySetInnerHTML={{ __html: text || "<br/>" }}
                          />
                        )}
                      </div>
                    )
                  })}
                  <button onClick={() => setShowAddSectionModal(true)}
                    className="w-full py-5 border-2 border-dashed border-slate-100 rounded-2xl text-slate-300 hover:text-blue-400 hover:border-blue-100 transition-all font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2">
                    <PlusCircle className="w-4 h-4" /> Add Custom Section
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* ═══ RIGHT: FORMATTING + TEMPLATES ═══ */}
        <div className="w-[280px] shrink-0 border-l border-slate-100 flex flex-col bg-slate-50/50 overflow-hidden">

          {/* Formatting — Bold + Underline only; Color = Template Accent */}
          <div className="px-5 pt-7 pb-5 border-b border-slate-100 shrink-0">
            <p className="text-[9px] font-black uppercase tracking-[0.25em] text-slate-400 mb-5">Formatting</p>
            <div className="grid grid-cols-3 gap-1.5 mb-5">
              {[
                { icon: Bold, cmd: "bold", label: "Bold" },
                { icon: Italic, cmd: "italic", label: "Italic" },
                { icon: Underline, cmd: "underline", label: "Underline" },
              ].map(t => (
                <button key={t.cmd} onMouseDown={e => execFormat(e, t.cmd)}
                  className="h-11 flex items-center justify-center gap-2 bg-white border border-slate-200 rounded-xl hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 active:scale-95 text-slate-600 transition-all shadow-sm">
                  <t.icon className="w-4 h-4" />
                  <span className="text-[10px] font-bold">{t.label}</span>
                </button>
              ))}
            </div>
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3">
              Template Accent Color
            </p>
            <div className="grid grid-cols-6 gap-2">
              {TEXT_COLORS.map(c => (
                <button key={c.hex}
                  onClick={() => {
                    setAccentColor(c.hex)
                    if (currentJD?.id) localStorage.setItem(`jdforge_accent_${currentJD.id}`, c.hex)
                    // Refresh preview immediately if already in preview mode
                    if (viewMode === 'preview') { setPreviewKey(k => k + 1) }
                  }}
                  title={c.name}
                  className={`w-7 h-7 rounded-full border-2 transition-all hover:scale-125 hover:z-10 relative ${
                    accentColor === c.hex ? 'border-slate-700 scale-110 ring-2 ring-offset-1 ring-slate-300' : 'border-white shadow-sm'
                  }`}
                  style={{ backgroundColor: c.hex }}
                />
              ))}
            </div>
            {/* Preview of selected accent */}
            <div className="mt-3 flex items-center gap-2 px-2 py-1.5 bg-slate-50 rounded-lg">
              <div className="w-3 h-3 rounded-full border border-white shadow-sm" style={{ backgroundColor: accentColor }} />
              <span className="text-[9px] font-bold text-slate-500">Applies to titles & headings in PDF</span>
            </div>
          </div>

          {/* Template Picker */}
          <div className="flex-1 overflow-y-auto custom-scrollbar px-4 py-5">
            <p className="text-[9px] font-black uppercase tracking-[0.25em] text-slate-400 mb-4 px-1">PDF Template</p>
            <div className="grid grid-cols-2 gap-2.5">
              {TEMPLATES.map(t => {
                const active = selectedTemplate === t.id
                return (
                  <button key={t.id} onClick={() => { selectTemplate(t.id); triggerPreview(t.id) }}
                    className={`group rounded-xl border-2 overflow-hidden text-left transition-all active:scale-95 ${active ? "border-blue-500 shadow-lg shadow-blue-500/15" : "border-white hover:border-slate-200 bg-white"}`}>
                    <div className={`aspect-[1.4/1] p-1 ${active ? "bg-blue-50" : "bg-slate-50 group-hover:bg-white"} transition-colors`}>
                      <TemplateThumbnail layout={t.layout} active={active} />
                    </div>
                    <div className={`p-2 ${active ? "bg-blue-600" : "bg-white"}`}>
                      <p className={`text-[10px] font-black truncate ${active ? "text-white" : "text-slate-700"}`}>{t.name}</p>
                      <p className={`text-[8px] font-bold truncate mt-0.5 ${active ? "text-blue-200" : "text-slate-400"}`}>{t.desc}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* CTA Footer */}
          <div className="p-4 border-t border-slate-100 bg-white space-y-2 shrink-0">
            <button onClick={() => triggerPreview()}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-slate-900 hover:bg-black text-white rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all shadow-xl hover:-translate-y-0.5 active:translate-y-0">
              <Eye className="w-4 h-4" />
              {viewMode === "preview" ? "Refresh Preview" : "Preview PDF"}
            </button>
            <button onClick={handleProceed}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all shadow-lg shadow-blue-600/20 hover:-translate-y-0.5 active:translate-y-0">
              Proceed to Sourcing <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ═══ FLOATING CHATBOX ═══ */}
        {viewMode === "edit" && (() => {
          // All section names including custom ones created by user
          const allSections = Object.keys(sections)
          const query = chatInput.startsWith('/') ? chatInput.slice(1).toLowerCase() : ''
          const filtered = query !== undefined
            ? allSections.filter(s => s.toLowerCase().includes(query))
            : []
          const showMenu = chatInput.startsWith('/') && filtered.length > 0

          const selectSection = (s: string) => {
            if (!taggedSections.includes(s)) setTaggedSections(p => [...p, s])
            setChatInput('')
          }

          return (
            <div className="fixed bottom-8 left-[260px] right-[280px] z-50 flex justify-center px-6 pointer-events-none">
              <div className="w-full max-w-2xl pointer-events-auto">
                {/* Tagged section pills */}
                {taggedSections.length > 0 && (
                  <div className="flex flex-wrap gap-2 justify-center mb-3">
                    {taggedSections.map(tag => (
                      <button key={tag} onClick={() => setTaggedSections(p => p.filter(t => t !== tag))}
                        className="flex items-center gap-1.5 px-3 py-1 bg-blue-600 text-white rounded-full text-[10px] font-black uppercase shadow-lg">
                        {tag} <X className="w-3 h-3" />
                      </button>
                    ))}
                  </div>
                )}

                {/* Section command menu — command-palette style */}
                {showMenu && (
                  <div className="mb-3 bg-white/95 backdrop-blur-xl border border-slate-200/80 rounded-2xl shadow-2xl overflow-hidden">
                    <div className="px-4 py-2.5 border-b border-slate-100 flex items-center gap-2">
                      <Search className="w-3 h-3 text-slate-400" />
                      <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Tag a Section</span>
                      <span className="ml-auto text-[8px] font-bold text-slate-300">↵ to select</span>
                    </div>
                    <div className="max-h-48 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
                      {filtered.map((s, i) => (
                        <button key={s} onClick={() => selectSection(s)}
                          className={`w-full text-left px-4 py-2.5 flex items-center gap-3 transition-colors ${
                            i === 0 ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                          }`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${i === 0 ? 'bg-blue-500' : 'bg-slate-300'}`} />
                          <span className="text-[11px] font-bold">{s}</span>
                          {i === 0 && <span className="ml-auto text-[8px] font-black text-blue-400 uppercase tracking-wider">Enter</span>}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Input */}
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-600 rounded-[28px] blur opacity-20 group-hover:opacity-35 transition duration-1000" />
                  <div className="relative bg-white/95 backdrop-blur-2xl border border-slate-200/60 rounded-[24px] shadow-2xl flex items-center p-2.5 gap-2">
                    <button onClick={handleMicClick}
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 transition-all ${
                        isListening ? 'bg-red-500 shadow-lg shadow-red-500/30 animate-pulse' : 'bg-slate-100 hover:bg-slate-200'
                      }`}>
                      {isListening ? <MicOff className="w-4.5 h-4.5 text-white" /> : <Mic className="w-4.5 h-4.5 text-slate-500" />}
                    </button>
                    <input
                      className="flex-1 bg-transparent outline-none text-slate-800 placeholder:text-slate-400 text-sm font-semibold px-2"
                      placeholder="Type '/' to tag sections, or describe what to improve..."
                      value={chatInput}
                      onChange={e => setChatInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && showMenu && filtered.length > 0) {
                          e.preventDefault()
                          selectSection(filtered[0])
                        } else if (e.key === 'Enter' && !showMenu) {
                          handleRefine()
                        } else if (e.key === 'Escape') {
                          setChatInput('')
                        }
                      }}
                    />
                    <button disabled={isRefining || (!chatInput.trim() || chatInput.startsWith('/'))} onClick={handleRefine}
                      className="w-11 h-11 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shrink-0 transition-all shadow-lg shadow-blue-600/30 disabled:opacity-40 active:scale-95">
                      {isRefining ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )
        })()}
      </div>

      {showAddSectionModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
          <div className="w-[400px] bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-sm font-black text-slate-800 mb-2">Add Custom Section</h3>
            <p className="text-xs text-slate-500 mb-5">Enter a clear, descriptive title for your new section.</p>
            
            <input
              autoFocus
              value={newSectionName}
              onChange={e => setNewSectionName(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && newSectionName.trim()) {
                  handleUpdate(newSectionName.trim(), "")
                  toast.success(`Added: ${newSectionName.trim()}`)
                  setShowAddSectionModal(false)
                  setNewSectionName("")
                }
                if (e.key === 'Escape') {
                  setShowAddSectionModal(false)
                  setNewSectionName("")
                }
              }}
              placeholder="e.g., About Company..."
              className="w-full bg-slate-50 border border-slate-200 text-sm font-medium text-slate-800 rounded-xl px-4 py-3 outline-none focus:border-blue-500 focus:bg-white transition-all mb-6 placeholder:font-normal"
            />
            
            <div className="flex gap-3">
              <button
                onClick={() => { setShowAddSectionModal(false); setNewSectionName("") }}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                disabled={!newSectionName.trim()}
                onClick={() => {
                  handleUpdate(newSectionName.trim(), "")
                  toast.success(`Added: ${newSectionName.trim()}`)
                  setShowAddSectionModal(false)
                  setNewSectionName("")
                }}
                className="flex-1 py-2.5 rounded-xl text-xs font-black text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-lg shadow-blue-500/20"
              >
                Add Section
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  )
}
