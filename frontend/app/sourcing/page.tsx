"use client"
import { useState, useEffect, useRef } from "react"
import { AppShell } from "@/components/app-shell"
import {
  ChevronLeft, ChevronRight, Pencil, Sparkles, Loader2, Copy,
  User, ExternalLink, Download, FileText, Search, RefreshCw, X, CheckCircle2
} from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useJDs } from "@/lib/useJDs"
import { fetchApi, API_BASE_URL } from "@/lib/api"
import { toast } from "sonner"
import { Suspense } from "react"

export default function SourcingPage() {
  return (
    <Suspense fallback={<AppShell><div className="flex w-full items-center justify-center p-20"><Loader2 className="animate-spin w-8 h-8 text-blue-500" /></div></AppShell>}>
      <SourcingPageContent />
    </Suspense>
  )
}

// ─── Match Ring (SVG) ─────────────────────────────────────────────────────────
function MatchRing({ pct }: { pct: number }) {
  const r = 20, circ = 2 * Math.PI * r
  const dash = Math.min((pct / 100) * circ, circ)
  const color = pct >= 80 ? '#16a34a' : pct >= 60 ? '#d97706' : '#ef4444'
  const bg = pct >= 80 ? '#dcfce7' : pct >= 60 ? '#fef9c3' : '#fee2e2'
  return (
    <div className="relative w-14 h-14 shrink-0">
      <svg viewBox="0 0 48 48" className="w-full h-full -rotate-90">
        <circle cx="24" cy="24" r={r} fill={bg} />
        <circle cx="24" cy="24" r={r} fill="none" stroke="#fff" strokeWidth="4" />
        <circle cx="24" cy="24" r={r} fill="none" stroke={color} strokeWidth="4"
          strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.8s ease' }} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[11px] font-black" style={{ color }}>{pct}%</span>
      </div>
    </div>
  )
}

// ─── Rank Card ────────────────────────────────────────────────────────────────
function RankCard({ rank, candidate }: { rank: number; candidate: any }) {
  const [expanded, setExpanded] = useState(false)
  const pct = candidate.match_percentage || 0
  const color = pct >= 80 ? '#16a34a' : pct >= 60 ? '#d97706' : '#ef4444'
  const gradFrom = pct >= 80 ? 'from-emerald-50/80' : pct >= 60 ? 'from-amber-50/80' : 'from-rose-50/80'
  const pillBg = pct >= 80 ? '#dcfce7' : pct >= 60 ? '#fef3c7' : '#fee2e2'
  const initials = (candidate.full_name || '?').split(' ').map((n: string) => n[0]).join('').slice(0, 2)

  return (
    <div className={`relative rounded-2xl bg-gradient-to-br ${gradFrom} to-white border border-white shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group`}>
      {/* Rank watermark */}
      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[72px] font-black leading-none select-none pointer-events-none"
        style={{ color: color, opacity: 0.06 }}>
        {rank}
      </div>

      <div className="relative p-4">
        {/* Header row */}
        <div className="flex items-center gap-3 mb-3">
          <MatchRing pct={pct} />
          <div className="flex-1 min-w-0">
            <h4 className="text-[13px] font-black text-slate-900 truncate">{candidate.full_name}</h4>
            <p className="text-[11px] text-slate-500 font-semibold truncate">{candidate.current_job_title}</p>
            <p className="text-[10px] text-slate-400 font-bold">{candidate.experience_years}y exp</p>
          </div>
          <a href={candidate.profile_url || '#'} target="_blank" rel="noreferrer"
            className="w-8 h-8 rounded-xl bg-white shadow-sm flex items-center justify-center text-slate-300 hover:text-blue-500 hover:shadow-md transition-all">
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Skill pills */}
        {candidate.matched_skills?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {candidate.matched_skills.slice(0, 5).map((skill: string, i: number) => (
              <span key={i} className="text-[9px] font-black uppercase tracking-wider px-2 py-[3px] rounded-lg"
                style={{ backgroundColor: pillBg, color }}>
                {skill}
              </span>
            ))}
          </div>
        )}

        {/* AI explanation */}
        {candidate.explanation && (
          <div className="bg-white/70 rounded-xl p-2.5 border border-white">
            <div className="flex items-center gap-1.5 mb-1">
              <Sparkles className="w-2.5 h-2.5" style={{ color }} />
              <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">AI Fit</span>
            </div>
            <p className={`text-[10px] leading-relaxed text-slate-600 italic ${!expanded ? 'line-clamp-2' : ''}`}>
              "{candidate.explanation}"
            </p>
            {candidate.explanation.length > 120 && (
              <button onClick={() => setExpanded(!expanded)}
                className="text-[9px] font-black uppercase tracking-wide mt-1 transition-colors"
                style={{ color }}>
                {expanded ? '← Less' : 'More →'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── PDF Preview (center) ─────────────────────────────────────────────────────
function JDPreviewPanel({ jdId, templateId, accentColor }: { jdId: string; templateId: string; accentColor: string }) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState(0)
  const steps = ["Analyzing document", "AI filling gaps", "Compiling LaTeX", "Rendering PDF"]

  useEffect(() => {
    if (!loading) return
    const iv = setInterval(() => setStep(s => s < steps.length - 1 ? s + 1 : s), 1800)
    return () => clearInterval(iv)
  }, [loading])

  useEffect(() => {
    let blobUrl: string
    const load = async () => {
      setLoading(true); setError(null); setStep(0); setPdfUrl(null)
      try {
        const token = localStorage.getItem('token')
        const res = await fetch(
          `${API_BASE_URL}/jds/${jdId}/export/pdf?template_id=${templateId}&preview=true${accentColor ? `&accent_color=${accentColor}` : ''}`,
          { headers: token ? { Authorization: `Bearer ${token}` } : {} }
        )
        if (!res.ok) {
          const err = await res.json().catch(() => ({ detail: 'Compilation failed' }))
          throw new Error(err.detail || 'Failed')
        }
        const blob = await res.blob()
        blobUrl = URL.createObjectURL(blob)
        setPdfUrl(blobUrl)
      } catch (e: any) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    if (jdId) load()
    return () => { if (blobUrl) URL.revokeObjectURL(blobUrl) }
  }, [jdId, templateId])

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-full text-center">
      <div className="relative w-20 h-20 mb-6">
        <div className="absolute inset-0 rounded-full border-4 border-slate-100" />
        <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" style={{ animationDuration: '1.2s' }} />
        <div className="absolute inset-4 rounded-full border-2 border-blue-300 border-b-transparent animate-spin" style={{ animationDuration: '2s', animationDirection: 'reverse' }} />
        <div className="absolute inset-0 flex items-center justify-center">
          <FileText className="w-5 h-5 text-blue-600" />
        </div>
      </div>
      <h3 className="font-black text-slate-900 text-lg mb-2">Building PDF</h3>
      <div key={step} className="text-sm text-slate-400 font-semibold animate-in fade-in slide-in-from-bottom-1 duration-500">
        {steps[step]}...
      </div>
      <div className="w-36 h-1.5 bg-slate-100 rounded-full mt-5 overflow-hidden">
        <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-[1800ms]"
          style={{ width: `${((step + 1) / steps.length) * 100}%` }} />
      </div>
    </div>
  )

  if (error) return (
    <div className="flex flex-col items-center justify-center h-full text-center max-w-sm mx-auto px-6">
      <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mb-4">
        <X className="w-7 h-7 text-red-500" />
      </div>
      <h3 className="font-black text-slate-900 mb-2">LaTeX Error</h3>
      <p className="text-sm text-slate-500 leading-relaxed mb-5">{error}</p>
    </div>
  )

  if (!pdfUrl) return null

  return (
    <div className="w-full h-full animate-in fade-in zoom-in-95 duration-500">
      <iframe src={`${pdfUrl}#toolbar=0&view=FitH`} className="w-full h-full bg-white" />
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
function SourcingPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const urlJdId = searchParams.get('jd_id')

  const { jds, isLoaded: isJdsLoaded } = useJDs()
  const finalizedJDs = jds.filter((jd: any) => jd.status === 'finalized')

  const [activeJDId, setActiveJDId] = useState<string>('')
  const [candidates, setCandidates] = useState<any[]>([])
  const [candidatesCache, setCandidatesCache] = useState<Record<string, any[]>>({})
  const [searchQueries, setSearchQueries] = useState<{ label: string; query: string }[]>([])
  const [isFetching, setIsFetching] = useState(false)
  const [isFetchingQueries, setIsFetchingQueries] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState('t1_classic')
  const [accentColor, setAccentColor] = useState('')   // hex without #, e.g. "2563EB"
  const [previewKey, setPreviewKey] = useState(0)
  const [candPage, setCandPage] = useState(1)
  const candPerPage = 5

  const currentJD = jds.find((j: any) => j.id === activeJDId)

  // Sync JD from URL
  useEffect(() => {
    if (!isJdsLoaded || finalizedJDs.length === 0) return
    const target = (urlJdId && jds.some((j: any) => j.id === urlJdId)) ? urlJdId : finalizedJDs[0].id
    if (target && target !== activeJDId) setActiveJDId(target)
  }, [isJdsLoaded, finalizedJDs.length])

  // When JD changes, load template + candidates + queries
  useEffect(() => {
    if (!activeJDId) return
    const jd = jds.find((j: any) => j.id === activeJDId)
    // Restore selected template from DB, then localStorage
    const saved = jd?.template_used || localStorage.getItem(`jdforge_template_${activeJDId}`) || 't1_classic'
    setSelectedTemplate(saved)
    // Restore accent color from DB, then localStorage
    const savedAccent = jd?.accent_color || localStorage.getItem(`jdforge_accent_${activeJDId}`) || ''
    setAccentColor(savedAccent.replace('#', ''))
    // Restore candidates cache
    const cached = candidatesCache[activeJDId]
    setCandidates(cached || [])
    setCandPage(1)
    // Kick off fresh preview
    setPreviewKey(k => k + 1)
    // Fetch boolean queries
    const fetchQueries = async () => {
      setIsFetchingQueries(true)
      try {
        const data = await fetchApi(`/jds/${activeJDId}/search-queries`)
        setSearchQueries(Array.isArray(data) ? data : [])
      } catch { setSearchQueries([]) }
      finally { setIsFetchingQueries(false) }
    }
    fetchQueries()
  }, [activeJDId, jds])

  const handleFetch = async () => {
    if (!activeJDId) return
    setIsFetching(true)
    try {
      const response = await fetchApi(`/jds/${activeJDId}/rank-candidates`, { method: 'POST' })
      if (response?.results) {
        setCandidates(response.results)
        setCandidatesCache(p => ({ ...p, [activeJDId]: response.results }))
        setCandPage(1)
      }
    } catch (e: any) {
      toast.error(`Could not fetch candidates: ${e.message}`)
    } finally {
      setIsFetching(false)
    }
  }

  const handleExportPDF = async () => {
    if (!currentJD) return
    setIsExporting(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(
        `${API_BASE_URL}/jds/${activeJDId}/export/pdf?template_id=${selectedTemplate}&preview=false${accentColor ? `&accent_color=${accentColor}` : ''}`,
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      )
      if (!res.ok) throw new Error('Export failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = `${currentJD.title?.replace(/\s+/g, '_')}_JD.pdf`; a.click()
      URL.revokeObjectURL(url)
      toast.success('PDF downloaded!')
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setIsExporting(false)
    }
  }

  const handleExportCSV = () => {
    if (!candidates.length) { toast.error('No candidates to export'); return }
    const headers = ['Full Name', 'Match %', 'Current Role', 'Experience (Years)', 'Matched Skills', 'Explanation']
    const rows = candidates.map(c => [
      c.full_name, `${c.match_percentage}%`, c.current_job_title,
      c.experience_years, (c.matched_skills || []).join(', '), c.explanation || ''
    ])
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url
    a.download = `candidates_${currentJD?.title?.replace(/\s+/g, '_') || 'export'}.csv`; a.click()
    URL.revokeObjectURL(url)
    toast.success('CSV exported!')
  }

  const pageCandidates = candidates.slice((candPage - 1) * candPerPage, candPage * candPerPage)
  const totalPages = Math.ceil(candidates.length / candPerPage)

  return (
    <AppShell>
      <div className="flex-1 w-full flex overflow-hidden h-full min-h-0">

        {/* ═══ LEFT: JDs + Boolean Queries ═══ */}
        <div className="w-[280px] shrink-0 border-r border-slate-100 bg-white flex flex-col h-full">

          {/* JDs Finalized — scrollable fixed height */}
          <div className="px-6 pt-7 pb-5 shrink-0">
            <p className="text-[9px] font-black uppercase tracking-[0.25em] text-slate-400 mb-4">JD Finalized</p>
            <div className="space-y-2 overflow-y-auto" style={{ maxHeight: '260px', scrollbarWidth: 'thin', scrollbarColor: '#e2e8f0 transparent' }}>
              {!isJdsLoaded && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 animate-pulse" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 bg-slate-100 rounded animate-pulse" />
                    <div className="h-2 w-16 bg-slate-100 rounded animate-pulse" />
                  </div>
                </div>
              )}
              {finalizedJDs.length === 0 && isJdsLoaded && (
                <p className="text-xs text-slate-400 italic text-center py-4">No finalized JDs yet.</p>
              )}
              {finalizedJDs.map((jd: any) => {
                const active = jd.id === activeJDId
                return (
                  <button key={jd.id} onClick={() => setActiveJDId(jd.id)}
                    className={`w-full group flex items-center gap-3 p-3 rounded-xl text-left transition-all ${active ? 'bg-blue-600 shadow-lg shadow-blue-600/20' : 'hover:bg-slate-50 border border-transparent hover:border-slate-100'}`}>
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black uppercase shrink-0 ${active ? 'bg-white/20 text-white' : 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white'}`}>
                      {jd.title?.[0] || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-[11px] font-black truncate ${active ? 'text-white' : 'text-slate-800'}`}>{jd.title}</p>
                      <p className={`text-[9px] font-bold ${active ? 'text-blue-200' : 'text-slate-400'}`}>Finalized</p>
                    </div>
                    {active && <CheckCircle2 className="w-4 h-4 text-white/70 shrink-0" />}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="mx-6 h-px bg-slate-100" />

          {/* Boolean Queries */}
          <div className="flex-1 flex flex-col min-h-0 px-6 py-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[9px] font-black uppercase tracking-[0.25em] text-slate-400">Boolean Queries</p>
              {isFetchingQueries && <Loader2 className="w-3 h-3 animate-spin text-blue-500" />}
            </div>
            <div className="flex-1 overflow-y-auto space-y-3" style={{ scrollbarWidth: 'none' }}>
              {searchQueries.length === 0 && !isFetchingQueries && (
                <div className="text-center py-8">
                  <Search className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                  <p className="text-[10px] text-slate-400">Select a finalized JD to generate queries</p>
                </div>
              )}
              {searchQueries.map((q, i) => {
                const labelColor = q.label === 'Strict' ? 'text-red-500' : q.label === 'Targeted' ? 'text-blue-500' : 'text-emerald-500'
                const stripColor = q.label === 'Strict' ? 'bg-red-500' : q.label === 'Targeted' ? 'bg-blue-500' : 'bg-emerald-500'
                return (
                  <div key={i} className="group rounded-xl bg-slate-50 border border-slate-100 hover:border-blue-100 hover:bg-blue-50/30 transition-all overflow-hidden">
                    <div className={`h-0.5 w-full ${stripColor} rounded-t`} />
                    <div className="p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-[8px] font-black uppercase tracking-[0.2em] ${labelColor}`}>{q.label}</span>
                        <button onClick={() => { navigator.clipboard.writeText(q.query); toast.success('Copied!') }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md text-slate-400 hover:text-blue-600 hover:bg-white">
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                      <p className="text-[10px] font-mono text-slate-600 leading-relaxed break-all select-all">{q.query}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* ═══ CENTER: PDF Preview ═══ */}
        <div className="flex-1 flex flex-col min-w-0 bg-slate-50">

          {/* Export toolbar */}
          <div className="px-8 py-4 bg-white border-b border-slate-100 shrink-0 flex items-center justify-between">
            <div>
              <h1 className="font-black text-slate-900 text-lg leading-tight">{currentJD?.title || 'Select a JD'}</h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                JD Finalized · {selectedTemplate.replace('_', ' ')} template
              </p>
            </div>
            <div className="flex items-center gap-2.5">
              <button onClick={() => router.push(`/builder?jd_id=${currentJD?.id}`)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-black hover:bg-slate-50 transition-all">
                <Pencil className="w-3.5 h-3.5" /> Edit JD
              </button>
              <button onClick={handleExportPDF} disabled={isExporting || !currentJD}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-black transition-all shadow-lg disabled:opacity-40 active:scale-95">
                {isExporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                Export PDF
              </button>
              <button onClick={() => toast.info('DOCX export coming soon!')}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-500 text-xs font-black hover:bg-slate-50 transition-all">
                <FileText className="w-3.5 h-3.5" />
                Export DOCX
                <span className="text-[8px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-md font-black uppercase tracking-wide">Soon</span>
              </button>
              <button onClick={() => setPreviewKey(k => k + 1)}
                className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-200 transition-all">
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* PDF area */}
          <div className="flex-1 overflow-hidden p-8 flex items-center justify-center">
            {!activeJDId ? (
              <div className="text-center">
                <FileText className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                <p className="text-slate-400 font-bold">Select a finalized JD on the left</p>
              </div>
            ) : (
              <div className="w-full h-full max-w-[860px] mx-auto shadow-2xl shadow-slate-900/15 rounded-2xl overflow-hidden">
                <JDPreviewPanel key={`${previewKey}-${activeJDId}-${selectedTemplate}-${accentColor}`} jdId={activeJDId} templateId={selectedTemplate} accentColor={accentColor} />
              </div>
            )}
          </div>
        </div>

        {/* ═══ RIGHT: Candidates ═══ */}
        <div className="w-[360px] shrink-0 border-l border-slate-100 bg-white flex flex-col h-full">

          {/* Header */}
          <div className="px-6 pt-7 pb-4 border-b border-slate-100 shrink-0">
            <div className="flex items-center justify-between mb-1">
              <h2 className="font-black text-slate-900 text-base">Candidates</h2>
              {candidates.length > 0 && (
                <button onClick={handleExportCSV}
                  className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400 hover:text-blue-600 transition-colors">
                  <Download className="w-3 h-3" /> CSV
                </button>
              )}
            </div>
            {candidates.length > 0 && (
              <p className="text-[10px] text-slate-400 font-bold">{candidates.length} profiles ranked by AI match</p>
            )}
          </div>

          {/* Cards or empty state */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3" style={{ scrollbarWidth: 'thin', scrollbarColor: '#e2e8f0 transparent' }}>
            {candidates.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                {/* Animated glow empty state */}
                <div className="relative mb-6">
                  <div className="absolute inset-0 rounded-full bg-blue-500/10 blur-2xl animate-pulse" style={{ transform: 'scale(2)' }} />
                  <div className="relative w-20 h-20 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-3xl flex items-center justify-center shadow-inner">
                    <User className="w-9 h-9 text-blue-300" />
                  </div>
                </div>
                <h3 className="font-black text-slate-800 text-sm mb-1.5">No candidates yet</h3>
                <p className="text-[11px] text-slate-400 leading-relaxed max-w-[200px] mb-6">
                  Fetch ranked profiles from Zoho Recruit using AI-generated boolean queries
                </p>
                <button onClick={handleFetch} disabled={isFetching || !activeJDId}
                  className="flex items-center gap-2.5 px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-blue-600/25 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-40">
                  {isFetching ? <><Loader2 className="w-4 h-4 animate-spin" /> Fetching...</> : <><Search className="w-4 h-4" /> Fetch Candidates</>}
                </button>
              </div>
            ) : (
              <>
                {pageCandidates.map((c, i) => (
                  <RankCard key={c.id || i} rank={(candPage - 1) * candPerPage + i + 1} candidate={c} />
                ))}
              </>
            )}
          </div>

          {/* Footer: refetch + pagination */}
          {candidates.length > 0 && (
            <div className="border-t border-slate-100 px-5 py-4 shrink-0 space-y-3">
              {/* Pagination */}
              <div className="flex items-center justify-between">
                <button disabled={candPage === 1} onClick={() => setCandPage(p => p - 1)}
                  className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 disabled:opacity-30 hover:border-blue-200 hover:text-blue-600 transition-all">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-1.5">
                  {Array.from({ length: totalPages }, (_, i) => (
                    <button key={i} onClick={() => setCandPage(i + 1)}
                      className={`w-6 h-6 rounded-lg text-[10px] font-black transition-all ${candPage === i + 1 ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:bg-slate-50'}`}>
                      {i + 1}
                    </button>
                  ))}
                </div>
                <button disabled={candPage >= totalPages} onClick={() => setCandPage(p => p + 1)}
                  className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 disabled:opacity-30 hover:border-blue-200 hover:text-blue-600 transition-all">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              {/* Refetch */}
              <button onClick={handleFetch} disabled={isFetching}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-blue-200 text-blue-600 text-[11px] font-black uppercase tracking-widest hover:bg-blue-50 transition-all disabled:opacity-40">
                {isFetching ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Fetching...</> : <><RefreshCw className="w-3.5 h-3.5" /> Re-fetch Candidates</>}
              </button>
            </div>
          )}
        </div>

      </div>
    </AppShell>
  )
}
