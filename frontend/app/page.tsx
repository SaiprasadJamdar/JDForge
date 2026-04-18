"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { AppShell } from "@/components/app-shell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, Mic, Search, FileText, CheckCircle2, Clock, ChevronDown, Sparkles, Filter, Link as LinkIcon, FileAudio, File, Square } from "lucide-react"

// MOCK DATA
const allJDs = [
  { id: 1, title: "Senior Java Developer", status: "Processed", date: "2 hrs ago", type: "Full-time" },
  { id: 2, title: "Data Analyst", status: "Draft", date: "5 hrs ago", type: "Contract" },
  { id: 3, title: "Product Manager", status: "Processed", date: "1 day ago", type: "Full-time" },
  { id: 4, title: "UX Designer", status: "Processed", date: "2 days ago", type: "Part-time" },
  { id: 5, title: "DevOps Engineer", status: "Draft", date: "3 days ago", type: "Full-time" },
  { id: 6, title: "Frontend Lead", status: "Processed", date: "4 days ago", type: "Full-time" },
  { id: 7, title: "Backend Architect", status: "Processed", date: "1 week ago", type: "Contract" },
  { id: 8, title: "QA Specialist", status: "Draft", date: "2 weeks ago", type: "Part-time" },
]

export default function Home() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [files, setFiles] = useState([
    { name: 'manager_interview.mp3', type: 'audio' },
    { name: 'notes_v2.docx', type: 'doc' }
  ])
  const [isRecording, setIsRecording] = useState(false)
  const [filterType, setFilterType] = useState<"All" | "Processed" | "Draft">("All")
  const [isProcessing, setIsProcessing] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files).map(f => ({
        name: f.name,
        type: f.name.endsWith('.mp3') || f.name.endsWith('.wav') ? 'audio' : 'doc'
      }))
      setFiles(prev => [...prev, ...newFiles])
    }
  }

  const removeFile = (fileName: string) => {
    setFiles(prev => prev.filter(f => f.name !== fileName))
  }

  const existingJDs = allJDs.filter(jd => filterType === "All" || jd.status === filterType)

  const handleProcess = () => {
    setIsProcessing(true)
    setTimeout(() => {
      router.push('/builder')
    }, 800)
  }

  return (
    <AppShell>
      {/* 
        THEME RULE:
        70% White / Off-white (bg-white, bg-slate-50)
        20% Light Blue (#EAF3FF)
        10% Primary Blue (#2563EB)
      */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 font-sans text-slate-900 dark:text-slate-50 items-start">
        
        {/* --- SECTION 1: UPLOAD / CHAT INTERFACE --- */}
        <section className="w-full">
          <Card className="border-0 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-none dark:border dark:border-slate-800 rounded-3xl overflow-hidden bg-white dark:bg-slate-900/50">
            <CardContent className="p-0">
              <Tabs defaultValue="upload" className="w-full">
                <div className="bg-[#EAF3FF]/50 dark:bg-slate-800/50 p-2 border-b border-slate-100 dark:border-slate-800">
                  <TabsList className="bg-transparent space-x-2">
                    <TabsTrigger value="paste" className="rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-[#2563EB] data-[state=active]:shadow-sm">
                      <FileText className="w-4 h-4 mr-2" /> Paste Text
                    </TabsTrigger>
                    <TabsTrigger value="upload" className="rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-[#2563EB] data-[state=active]:shadow-sm">
                      <Upload className="w-4 h-4 mr-2" /> Upload File
                    </TabsTrigger>
                    <TabsTrigger value="record" className="rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-[#2563EB] data-[state=active]:shadow-sm">
                      <Mic className="w-4 h-4 mr-2" /> Record Audio
                    </TabsTrigger>
                  </TabsList>
                </div>

                <div className="p-8">
                  <TabsContent value="paste" className="mt-0">
                    <textarea 
                      placeholder="Paste your meeting notes, job requirements, or unstructured text here..."
                      className="w-full h-48 p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl resize-none outline-none focus:ring-2 focus:ring-[#EAF3FF] focus:border-[#2563EB] transition-all"
                    ></textarea>
                  </TabsContent>

                  <TabsContent value="upload" className="mt-0 space-y-6">
                    {/* Drag & Drop Area */}
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-[#EAF3FF] hover:border-[#2563EB] dark:border-slate-700 bg-[#EAF3FF]/20 dark:bg-slate-800/20 rounded-3xl p-12 text-center transition-all cursor-pointer group"
                    >
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileChange} 
                        className="hidden" 
                        multiple 
                      />
                      <div className="w-16 h-16 bg-white dark:bg-slate-900 rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-4 group-hover:scale-105 transition-transform">
                        <Upload className="w-8 h-8 text-[#2563EB]" />
                      </div>
                      <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Drag & drop files here</h3>
                      <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">or click to browse from your computer</p>
                      <div className="flex items-center justify-center gap-2 mt-6 flex-wrap">
                        {['.txt', '.pdf', '.docx', '.wav', '.mp3', '.mp4'].map(ext => (
                          <span key={ext} className="px-2 py-1 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs rounded-md border border-slate-200 dark:border-slate-700">
                            {ext}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Uploaded Chips */}
                    {files.length > 0 && (
                      <div className="flex gap-3 flex-wrap">
                        {files.map((file, idx) => (
                          <div key={idx} className="flex items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 pl-3 pr-1 py-1.5 rounded-full shadow-sm animate-in fade-in slide-in-from-bottom-2">
                            {file.type === 'audio' ? (
                              <FileAudio className="w-4 h-4 text-[#2563EB] mr-2" />
                            ) : (
                              <File className="w-4 h-4 text-[#2563EB] mr-2" />
                            )}
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-200 mr-3">{file.name}</span>
                            <button 
                              onClick={() => removeFile(file.name)}
                              className="w-6 h-6 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors"
                            >
                              &times;
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="record" className="mt-0">
                    <div className="flex flex-col items-center justify-center py-12 space-y-6">
                      <div className="relative">
                        {isRecording && <div className="absolute inset-0 bg-red-500/20 rounded-full animate-ping" />}
                        <button 
                          onClick={() => setIsRecording(!isRecording)}
                          className={`relative w-20 h-20 border-2 rounded-full flex items-center justify-center transition-all ${
                            isRecording 
                              ? 'bg-red-50 hover:bg-red-100 dark:bg-red-900/20 border-red-500' 
                              : 'bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          {isRecording ? <Square className="w-6 h-6 text-red-500 fill-red-500" /> : <Mic className="w-8 h-8 text-slate-700 dark:text-slate-300" />}
                        </button>
                      </div>
                      <p className="text-slate-500 dark:text-slate-400 font-medium">
                        {isRecording ? "Recording... Click to stop" : "Click to start recording"}
                      </p>
                    </div>
                  </TabsContent>

                  {/* Action Button */}
                  <div className="mt-8 flex justify-end">
                    <Button 
                      onClick={handleProcess}
                      disabled={isProcessing}
                      className="rounded-xl px-8 py-6 bg-[#2563EB] hover:bg-blue-700 text-white font-medium shadow-md w-full sm:w-auto text-base transition-all"
                    >
                      {isProcessing ? "Processing Input..." : "Process Input"}
                    </Button>
                  </div>
                </div>
              </Tabs>
            </CardContent>
          </Card>
        </section>

        {/* --- SECTION 2: EXISTING JDs --- */}
        <section className="w-full flex flex-col gap-6">
          <div className="flex items-center justify-between shrink-0">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Your Existing JDs</h2>
            <div className="flex gap-3">
              <Button 
                onClick={() => setFilterType(prev => prev === "All" ? "Processed" : prev === "Processed" ? "Draft" : "All")}
                variant="outline" 
                className="rounded-xl border-slate-200 dark:border-slate-800 text-slate-600 bg-white dark:bg-slate-900 hover:bg-slate-50 w-32 justify-between transition-colors"
              >
                <div className="flex items-center">
                  <Filter className="w-4 h-4 mr-2" /> 
                  <span>{filterType === "All" ? "Filter" : filterType}</span>
                </div>
                <ChevronDown className="w-3 h-3 ml-2 text-slate-400" />
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-3 max-h-[70vh] overflow-y-auto pr-2 hide-scrollbar">
            {existingJDs.length === 0 ? (
              <div className="text-center py-12 text-slate-500">No {filterType.toLowerCase()} JDs found.</div>
            ) : (
              existingJDs.map((jd) => (
                <Card 
                  key={jd.id} 
                  onClick={() => router.push('/sourcing')}
                  className="border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all rounded-2xl cursor-pointer group bg-white dark:bg-slate-900/80 hover:-translate-y-0.5"
                >
                  <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="p-2.5 bg-[#EAF3FF] dark:bg-[#2563EB]/20 rounded-xl shrink-0">
                        <FileText className="w-5 h-5 text-[#2563EB]" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-base text-slate-800 dark:text-slate-100 group-hover:text-[#2563EB] transition-colors">{jd.title}</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{jd.type} • {jd.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <button className="opacity-0 group-hover:opacity-100 text-[#2563EB] font-medium transition-opacity text-sm hidden sm:block w-12 text-right">
                        View →
                      </button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </section>

      </div>
    </AppShell>
  )
}
