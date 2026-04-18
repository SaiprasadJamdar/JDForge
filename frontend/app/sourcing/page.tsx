"use client"
import { useState } from "react"
import { AppShell } from "@/components/app-shell"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { 
  Code2, Layout, Database, Settings, 
  ChevronLeft, ChevronRight, ArrowLeft, RotateCcw, Printer, Save, X,
  User, Search, ExternalLink, Mail, Linkedin, Github
} from "lucide-react"
import { useEffect } from "react"
import { initialJDs } from "@/lib/data"
import { useJDs } from "@/lib/useJDs"

export default function SourcingPage() {
  const [isFetching, setIsFetching] = useState(false)
  const [isExportingExcel, setIsExportingExcel] = useState(false)
  const [isExportingCSV, setIsExportingCSV] = useState(false)
  const { jds, saveToFile, isLoaded } = useJDs()
  const finalizedJDs = jds.filter(jd => jd.status === "finalized")
  
  const [activeJDId, setActiveJDId] = useState<string>("java_architect_x1")

  // Ensure an active JD is selected if available
  useEffect(() => {
    if (isLoaded && finalizedJDs.length > 0 && !finalizedJDs.find(j => j.id === activeJDId)) {
      setActiveJDId(finalizedJDs[0].id)
    }
  }, [isLoaded, finalizedJDs, activeJDId])

  const handleFetch = () => {
    setIsFetching(true)
    setTimeout(() => setIsFetching(false), 1500)
  }

  const handleExport = (type: 'excel' | 'csv') => {
    if (type === 'excel') {
      setIsExportingExcel(true)
      setTimeout(() => setIsExportingExcel(false), 1000)
    } else {
      setIsExportingCSV(true)
      setTimeout(() => setIsExportingCSV(false), 1000)
    }
  }

  const [currentPage, setCurrentPage] = useState(1)

  const candidates = [
    { id: 1, name: "Robert Mitchell", platform: "Email", icon: <Mail className="w-4 h-4 text-slate-400" />, avatar: "RM", rejected: false },
    { id: 2, name: "Priya Sharma", platform: "Indeed", icon: <Linkedin className="w-4 h-4 text-blue-600" />, avatar: "PS", rejected: false },
    { id: 3, name: "Priya Sharma", platform: "Indeed", icon: <Search className="w-4 h-4 text-blue-500" />, avatar: "PS", rejected: false },
    { id: 4, name: "Arjun Patel", platform: "GitHub", icon: <Github className="w-4 h-4 text-slate-800 dark:text-white" />, avatar: "AP", rejected: true },
  ]

  const currentJD = jds.find(j => j.id === activeJDId) || initialJDs[0];

  return (
    <AppShell>
      <div className="flex-1 w-full p-4 lg:p-6 bg-[#F8FAFC] dark:bg-slate-950 flex gap-6 h-[calc(100vh-64px)] overflow-hidden print:p-0 print:h-auto print:bg-white print:overflow-visible print:block">
        
        {/* --- LEFT COLUMN: Widgets --- */}
        <div className="w-[260px] shrink-0 flex flex-col gap-6 pb-4 h-full pr-1 overflow-hidden print:hidden">
          
          {/* JDs Finalized Widget */}
          <div className="bg-white dark:bg-slate-900 border border-transparent shadow-[0_4px_20px_rgb(0,0,0,0.03)] rounded-2xl flex flex-col flex-1 overflow-hidden">
            <div className="p-5 pb-2 shrink-0">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-4">JDs Finalized</h3>
            </div>
            <div className="px-3 pb-3 space-y-1 flex-1 overflow-y-auto hide-scrollbar">
              {isLoaded && finalizedJDs.length === 0 && (
                <div className="p-4 text-sm text-slate-500 text-center">No finalized JDs yet. Mark some as done in the Builder!</div>
              )}
              {isLoaded && finalizedJDs.map(jd => {
                const isActive = jd.id === activeJDId;
                return (
                  <div 
                    key={jd.id} 
                    onClick={() => setActiveJDId(jd.id)}
                    className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${isActive ? 'bg-[#EAF3FF] dark:bg-[#2563EB]/10' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                  >
                    <div className={`w-8 h-8 rounded-full ${jd.color} flex items-center justify-center shadow-sm shrink-0`}>
                      {jd.iconType === "code" && <Code2 className="w-4 h-4 text-white" />}
                      {jd.iconType === "layout" && <Layout className="w-4 h-4 text-white" />}
                      {jd.iconType === "database" && <Database className="w-4 h-4 text-white" />}
                    </div>
                    <span className={`text-[15px] font-medium ${isActive ? 'text-slate-900 dark:text-slate-100' : 'text-slate-600 dark:text-slate-400'}`}>
                      {jd.title}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* --- MIDDLE COLUMN: Document View --- */}
        <div className="flex-1 flex flex-col min-w-[500px] relative h-full print:w-full print:min-w-0 print:block print:h-auto print:overflow-visible">
          <Card className="flex-1 bg-white dark:bg-slate-900 border-0 shadow-[0_8px_30px_rgb(0,0,0,0.03)] rounded-[32px] overflow-y-auto overflow-x-hidden hide-scrollbar flex flex-col mb-4 h-full relative print:shadow-none print:bg-white print:text-black print:overflow-visible print:rounded-none print:m-0 print:h-auto">
            
            {/* Document Toolbar */}
            <div className="sticky top-0 z-10 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border-b border-slate-100 dark:border-slate-800 px-6 py-3 flex items-center justify-between print:hidden">
              <div className="flex items-center gap-4 text-slate-400">
                <ChevronLeft className="w-5 h-5 cursor-not-allowed opacity-50" />
                <ChevronRight className="w-5 h-5 cursor-not-allowed opacity-50" />
              </div>
              
              <div className="flex items-center gap-3 text-sm font-medium text-slate-600 dark:text-slate-300">
                <ChevronLeft 
                  onClick={() => setCurrentPage(1)} 
                  className={`w-4 h-4 transition-colors ${currentPage === 1 ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer hover:text-slate-900 dark:hover:text-white'}`} 
                />
                <span>{currentPage} of 2</span>
                <ChevronRight 
                  onClick={() => setCurrentPage(2)} 
                  className={`w-4 h-4 transition-colors ${currentPage === 2 ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer hover:text-slate-900 dark:hover:text-white'}`} 
                />
                <RotateCcw className="w-4 h-4 cursor-pointer hover:text-[#2563EB] transition-colors" onClick={() => setCurrentPage(1)} title="Reset View" />
              </div>
              
              <div className="flex items-center gap-4 text-slate-500">
                <Printer className="w-4 h-4 cursor-pointer hover:text-[#2563EB] transition-colors" onClick={() => window.print()} title="Print to PDF" />
                <Save className="w-4 h-4 cursor-pointer hover:text-[#2563EB] transition-colors" onClick={() => saveToFile(currentJD)} title="Save to File" />
                <X className="w-5 h-5 cursor-pointer hover:text-red-500 transition-colors" title="Close document viewer" />
              </div>
            </div>

            {/* Document Pages Container */}
            <div className="flex-1 bg-slate-50 dark:bg-slate-950/50 p-8 flex flex-col items-center gap-8 print:p-0 print:bg-white print:block">
              
              {/* PAGE 1 */}
              <div className={`w-full max-w-[800px] min-h-[1056px] bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 shadow-sm px-14 py-16 font-sans print:border-none print:shadow-none print:min-h-0 print:p-0 print:mb-8 print:block ${currentPage === 1 ? 'block' : 'hidden'}`}>
                <h1 className="text-[28px] leading-tight font-bold text-slate-800 dark:text-white mb-8 print:text-black">Wissen Technology is hiring for {currentJD.title}</h1>
                
                <div className="space-y-8">
                  <div className="space-y-3">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 print:text-black">About Wissen Technology</h3>
                    <p className="text-[15px] leading-relaxed text-slate-600 dark:text-slate-400 print:text-black">
                      At Wissen Technology, we deliver niche, custom-built products that solve complex business challenges across industries worldwide. Founded in 2015, our core philosophy is built around a strong product engineering mindset—ensuring every solution is architected and delivered right the first time. Today, Wissen Technology has a global footprint with 2000+ employees across offices in the US, UK, UAE, India, and Australia. Our commitment to excellence translates into delivering 2X impact compared to traditional service providers. How do we achieve this? Through a combination of deep domain knowledge, cutting-edge technology expertise, and a relentless focus on quality. We don’t just meet expectations—we exceed them by ensuring faster time-to-market, reduced rework, and greater alignment with client objectives. We have a proven track record of building mission-critical systems across industries, including financial services, healthcare, retail, manufacturing, and more. Wissen stands apart through its unique delivery models. Our outcome-based projects ensure predictable costs and timelines, while our agile pods provide clients the flexibility to adapt to their evolving business needs. Wissen leverages its thought leadership and technology prowess to drive superior business outcomes. Our success is powered by top-tier talent. Our mission is clear: to be the partner of choice for building world-class custom products that deliver exceptional impact—the first time, every time.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 print:text-black">Job Summary</h3>
                    <p className="text-[15px] leading-relaxed text-slate-600 dark:text-slate-400 print:text-black">
                      {currentJD.content.summary}
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-6">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2 print:text-black">Experience</h3>
                      <ul className="space-y-1 list-disc list-inside marker:text-slate-300 text-[15px] text-slate-600 dark:text-slate-400 print:text-black">
                        <li>{currentJD.content.experience}</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2 print:text-black">Location</h3>
                      <ul className="space-y-1 list-disc list-inside marker:text-slate-300 text-[15px] text-slate-600 dark:text-slate-400 print:text-black">
                        <li>{currentJD.content.location}</li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2 print:text-black">Mode of Work</h3>
                      <ul className="space-y-1 list-disc list-inside marker:text-slate-300 text-[15px] text-slate-600 dark:text-slate-400 print:text-black">
                        <li>{currentJD.content.mode}</li>
                      </ul>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 print:text-black">Key Responsibilities</h3>
                    <ul className="space-y-2 list-disc list-outside ml-4 marker:text-slate-300 text-[15px] text-slate-600 dark:text-slate-400 print:text-black">
                      {currentJD.content.responsibilities.map((req: string, i: number) => <li key={i}>{req}</li>)}
                    </ul>
                  </div>
                </div>
              </div>

              {/* PAGE 2 */}
              <div className={`w-full max-w-[800px] min-h-[1056px] bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 shadow-sm px-14 py-16 font-sans print:border-none print:shadow-none print:min-h-0 print:p-0 print:block ${currentPage === 2 ? 'block' : 'hidden'}`}>
                <div className="space-y-8">
                  <div className="space-y-3">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 print:text-black">Qualifications and Required Skills</h3>
                    <ul className="space-y-2 list-disc list-outside ml-4 marker:text-slate-300 text-[15px] text-slate-600 dark:text-slate-400 print:text-black">
                      {currentJD.content.qualifications.map((req: string, i: number) => <li key={i}>{req}</li>)}
                    </ul>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 print:text-black">Good to Have Skills</h3>
                    <ul className="space-y-2 list-disc list-outside ml-4 marker:text-slate-300 text-[15px] text-slate-600 dark:text-slate-400 print:text-black">
                      {currentJD.content.goodToHave.map((req: string, i: number) => <li key={i}>{req}</li>)}
                    </ul>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 print:text-black">Wissen Sites</h3>
                    <ul className="space-y-2 list-disc list-outside ml-4 marker:text-slate-300 text-[15px] text-slate-600 dark:text-slate-400 print:text-black">
                      <li>Website: www.wissen.com</li>
                      <li>LinkedIn: Wissen Technology</li>
                      <li>Wissen Leadership: Leadership Team</li>
                      <li>Wissen Live: Posts</li>
                      <li>Wissen Thought Leadership: Articles</li>
                    </ul>
                  </div>
                </div>
              </div>

            </div>
            
            {/* Custom Scrollbar visual hack for the screenshot look */}
            <div className="absolute right-1 top-20 bottom-4 w-1.5 bg-slate-200 dark:bg-slate-700 rounded-full opacity-50 print:hidden"></div>
          </Card>
        </div>

        {/* --- RIGHT COLUMN: Candidates Panel --- */}
        <div className="w-[340px] shrink-0 flex flex-col gap-4 pb-4 h-full pr-1 overflow-hidden print:hidden">
          
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 mt-2 shrink-0">Candidates</h2>
          
          <div className="flex gap-2 shrink-0">
            <Button 
              variant="outline" 
              onClick={() => handleExport('excel')}
              className="flex-1 bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-blue-600 rounded-xl h-10 transition-all"
            >
              {isExportingExcel ? "Exporting..." : "Export Excel"}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => handleExport('csv')}
              className="flex-1 bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-600 rounded-xl h-10 transition-all"
            >
              {isExportingCSV ? "Exporting..." : "Export CSV"}
            </Button>
          </div>

          <Button 
            onClick={handleFetch}
            disabled={isFetching}
            className="w-full bg-[#3B82F6] hover:bg-blue-600 text-white rounded-xl shadow-sm h-11 font-medium mt-1 shrink-0 transition-all"
          >
            {isFetching ? "Fetching Candidates..." : "Fetch Candidates from Sources"}
          </Button>

          <Card className="bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 shadow-[0_4px_20px_rgb(0,0,0,0.03)] rounded-[24px] flex flex-col flex-1 overflow-hidden mt-2">
            <div className="flex-1 overflow-y-auto hide-scrollbar">
              {candidates.map((candidate, idx) => (
                <div key={candidate.id} className={`p-4 flex items-center justify-between ${idx !== candidates.length - 1 ? 'border-b border-slate-50 dark:border-slate-800/50' : ''}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-600 dark:text-slate-300">
                      {candidate.avatar}
                    </div>
                    <div>
                      <h4 className="font-semibold text-[15px] text-slate-800 dark:text-slate-100 leading-tight">
                        {candidate.name}
                      </h4>
                      <div className="flex items-center text-xs text-slate-500 mt-1 gap-1">
                        {candidate.icon}
                        <span>{candidate.platform}</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <a href="#" className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg flex items-center justify-center text-slate-400 hover:text-[#2563EB] transition-colors">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Pagination */}
            <div className="p-4 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between shrink-0">
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-slate-400 bg-slate-50">
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 flex items-center justify-center bg-blue-50 text-blue-600 font-bold rounded-lg text-sm">1</span>
                <span className="text-sm text-slate-500 font-medium">1-3 of 24</span>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-slate-600 border border-slate-100">
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-slate-600 border border-slate-100">
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        </div>

      </div>
    </AppShell>
  )
}
