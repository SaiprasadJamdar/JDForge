"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AppShell } from "@/components/app-shell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, Mic, MicOff, Search, FileText, FileAudio, File, Loader2, Pencil, Trash2 } from "lucide-react"
import { fetchApi } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

export default function Home() {
  const router = useRouter()
  const { user } = useAuth()
  
  // File Upload State
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [pastedText, setPastedText] = useState("")
  const [templateText, setTemplateText] = useState("")
  const [showTemplateInput, setShowTemplateInput] = useState(false)

  // STT State
  const [isRecording, setIsRecording] = useState(false)
  const recognitionRef = useRef<any>(null)

  // API State
  const [isProcessing, setIsProcessing] = useState(false)
  const [isFetchingJDs, setIsFetchingJDs] = useState(true)

  // JD Table State
  const [jds, setJds] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")

  // Fetch Existing JDs
  useEffect(() => {
    async function loadJDs() {
      try {
        // fetchApi already returns parsed JSON or throws on error
        const data = await fetchApi("/jds")
        setJds(data)
      } catch (err) {
        console.error("Failed to fetch JDs:", err)
      } finally {
        setIsFetchingJDs(false)
      }
    }
    if (user) {
      loadJDs()
    }
  }, [user])

  const handleDeleteJD = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (!window.confirm("Are you sure you want to delete this JD forever?")) return
    
    setJds(prev => prev.filter(jd => jd.id !== id))
    try {
      await fetchApi(`/jds/${id}`, { method: "DELETE" })
    } catch (err) {
      console.error(err)
    }
  }

  const handleRenameJD = async (e: React.MouseEvent, id: string, currentTitle: string) => {
    e.stopPropagation()
    const newTitle = window.prompt("Enter new Job Description title:", currentTitle)
    if (!newTitle || newTitle.trim() === "" || newTitle === currentTitle) return

    setJds(prev => prev.map(jd => jd.id === id ? { ...jd, title: newTitle.trim() } : jd))
    try {
       await fetchApi(`/jds/${id}`, {
          method: "PATCH",
          body: JSON.stringify({ title: newTitle.trim() })
       })
    } catch (err) {
      console.error(err)
    }
  }

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition()
        recognition.continuous = true
        recognition.interimResults = true
        recognition.lang = "en-US"

        recognition.onresult = (event: any) => {
          let finalTranscript = ""
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript + " "
            }
          }
          if (finalTranscript) {
            setPastedText((prev) => prev + finalTranscript)
          }
        }

        recognition.onerror = (e: any) => {
          console.error("Speech recognition error:", e)
          setIsRecording(false)
        }

        recognition.onend = () => {
          if (isRecording) {
            // Automatically restart if it was stopped unexpectedly while we wanted it running
            recognition.start()
          }
        }

        recognitionRef.current = recognition
      }
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [])

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop()
      setIsRecording(false)
    } else {
      recognitionRef.current?.start()
      setIsRecording(true)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0])
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setSelectedFile(e.dataTransfer.files[0])
    }
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  // --- Processing Pipeline ---
  const handleProcessText = async () => {
    if (!pastedText.trim()) return
    setIsProcessing(true)
    try {
      // 1. Ingest transcript
      const transcript = await fetchApi("/transcripts", {
        method: "POST",
        body: JSON.stringify({
          raw_text: pastedText,
          source_type: "text_paste",
          source_filename: "pasted_text.txt",
          language_hint: "en"
        })
      })

      // 2. Generate JDs using cleanly processed backend record
      const result = await fetchApi("/jds/generate", {
        method: "POST",
        body: JSON.stringify({
          transcript_id: transcript.id,
          template: templateText.trim() || null
        })
      })
      
      if (result.jds && result.jds.length > 0) {
        setJds((prev: any[]) => [...result.jds, ...prev])
        router.push(`/builder`)
      }
    } catch (err) {
      console.error(err)
      alert("An error occurred during processing.")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleProcessFile = async () => {
    if (!selectedFile) return
    setIsProcessing(true)
    try {
      const formData = new FormData()
      formData.append("file", selectedFile)
      if (templateText.trim()) {
        formData.append("template", templateText.trim())
      }

      // Single smart endpoint: video/audio → FFmpeg → Whisper → LLaMA clean → multi-JD split → persist
      const jds = await fetchApi("/transcripts/upload-and-generate", {
        method: "POST",
        body: formData,
      })

      if (jds && jds.length > 0) {
        // Append new JDs to the table
        setJds((prev: any[]) => [...jds, ...prev])
        router.push(`/builder`)
      }
    } catch (err) {
      console.error(err)
      alert("Failed to process file. Please check that FFmpeg is installed and the backend is running.")
    } finally {
      setIsProcessing(false)
    }
  }

  // Filtered Display Data
  const filteredJDs = jds.filter(jd => 
    jd.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <AppShell>
      <div className="flex-1 w-full bg-slate-50 dark:bg-slate-950 flex flex-col lg:flex-row overflow-hidden h-full min-h-0 relative">
        <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-blue-50/50 to-transparent dark:from-blue-900/10 pointer-events-none" />
        {/* --- LEFT COLUMN: CREATE NEW JD (Fixed) --- */}
        <section className="w-full lg:w-[480px] shrink-0 p-6 lg:p-8 flex flex-col gap-6 lg:border-r border-slate-200/50 dark:border-slate-800 relative z-10">
          <div>
            <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 tracking-tight">Create New JD</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 font-medium leading-relaxed">Paste hiring requirements or upload recordings to synthesize structured JDs instantly.</p>
          </div>

          <Card className="border border-slate-200/60 shadow-xl shadow-blue-900/5 dark:shadow-none dark:border-slate-800 rounded-[32px] overflow-hidden bg-white/80 backdrop-blur-xl dark:bg-slate-900/80 flex flex-col min-h-0 flex-1">
            <CardContent className="p-0 flex flex-col h-full min-h-0">
              <Tabs defaultValue="paste" className="w-full h-full flex flex-col min-h-0">
                <div className="bg-slate-50/50 dark:bg-slate-800/50 p-3 border-b border-slate-100/50 dark:border-slate-800 shrink-0">
                  <TabsList className="bg-transparent w-full grid grid-cols-2 gap-2 h-12">
                    <TabsTrigger value="paste" className="rounded-2xl data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-blue-600 data-[state=active]:shadow-[0_2px_10px_rgba(0,0,0,0.06)] font-semibold transition-all">
                      <FileText className="w-4 h-4 mr-2" /> Paste Text
                    </TabsTrigger>
                    <TabsTrigger value="upload" className="rounded-2xl data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-blue-600 data-[state=active]:shadow-[0_2px_10px_rgba(0,0,0,0.06)] font-semibold transition-all">
                      <Upload className="w-4 h-4 mr-2" /> Upload File
                    </TabsTrigger>
                  </TabsList>
                </div>

                <div className="flex-1 overflow-y-scroll custom-scrollbar">
                  {/* TEXT TAB */}
                  <TabsContent value="paste" className="mt-0 p-6 h-full flex flex-col gap-4">
                    <div className="relative flex-1">
                      <textarea 
                        value={pastedText}
                        onChange={(e) => setPastedText(e.target.value)}
                        placeholder="Paste your meeting notes, job requirements, or unstructured text here..."
                        className="w-full h-full p-5 pb-16 bg-[#F8FAFC] dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl resize-none outline-none focus:ring-2 focus:ring-[#EAF3FF] focus:border-[#2563EB] transition-all"
                      ></textarea>
                      
                      {/* Integrated Browser STT Mic */}
                      <div className="absolute bottom-4 left-4 flex gap-2">
                        <Button 
                          onClick={toggleRecording}
                          variant="ghost" 
                          size="icon" 
                          className={`rounded-full shadow-sm hover:scale-105 transition-all text-white ${isRecording ? 'bg-red-500 hover:bg-red-600 animate-pulse' : 'bg-[#2563EB] hover:bg-blue-700'}`}
                        >
                          {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                        </Button>
                        <div className="flex flex-col justify-center">
                           <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{isRecording ? "Listening..." : "Dictate"}</span>
                        </div>
                      </div>
                    </div>

                    {/* Optional Template Input */}
                    <div className="flex flex-col gap-2">
                       <button onClick={() => setShowTemplateInput(!showTemplateInput)} className="text-left flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-blue-600 uppercase tracking-widest transition-colors w-fit">
                          {showTemplateInput ? "− Hide Template" : "➕ Add Reference JD Template (Optional)"}
                       </button>
                       {showTemplateInput && (
                          <textarea
                             value={templateText}
                             onChange={(e) => setTemplateText(e.target.value)}
                             placeholder="Paste your existing JD format, specific tone guidelines, or a reference structure..."
                             className="w-full h-32 p-4 text-sm bg-white dark:bg-slate-950 border border-dashed border-blue-200 dark:border-blue-900/40 rounded-xl resize-none outline-none focus:ring-2 focus:ring-blue-100 transition-all shadow-sm"
                          />
                       )}
                    </div>
                    
                    <Button 
                      onClick={handleProcessText}
                      disabled={isProcessing || !pastedText.trim()}
                      className="w-full rounded-2xl py-6 bg-[#2563EB] hover:bg-blue-700 text-white font-bold shadow-md transition-all uppercase tracking-widest text-[11px]"
                    >
                      {isProcessing ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</>
                      ) : "Process Text"}
                    </Button>
                  </TabsContent>

                  {/* FILE TAB */}
                  <TabsContent value="upload" className="mt-0 p-6 h-full flex flex-col gap-6">
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={handleDragOver}
                      onDragEnter={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={`flex-1 min-h-[300px] border-2 border-dashed rounded-3xl p-8 text-center transition-all cursor-pointer group flex flex-col items-center justify-center ${isDragging ? 'border-[#2563EB] bg-blue-50/50 dark:bg-[#2563EB]/10' : 'border-slate-200 hover:border-[#2563EB] dark:border-slate-700 bg-slate-50 dark:bg-slate-800/20'}`}
                    >
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileChange} 
                        className="hidden" 
                        accept="audio/*,video/*"
                      />
                      <div className="w-20 h-20 bg-white dark:bg-slate-900 rounded-3xl shadow-sm flex items-center justify-center mb-6 group-hover:scale-105 transition-transform">
                        <Upload className="w-10 h-10 text-[#2563EB]" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">Drag & drop files</h3>
                      <p className="text-slate-500 dark:text-slate-400 mt-1 text-[11px]">Audio (.mp3) or Video (.mp4, .mov)</p>
                    </div>

                    {selectedFile && (
                      <div className="flex items-center justify-between bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-3 rounded-2xl shadow-sm animate-in fade-in slide-in-from-bottom-2">
                        <div className="flex items-center min-w-0">
                           <FileAudio className="w-4 h-4 text-[#2563EB] mr-3 shrink-0" />
                           <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">{selectedFile.name}</span>
                        </div>
                        <button 
                          onClick={handleRemoveFile}
                          className="w-6 h-6 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors shrink-0"
                        >
                          &times;
                        </button>
                      </div>
                    )}
                    
                    {/* Optional Template Input */}
                    <div className="flex flex-col gap-2 shrink-0">
                       <button onClick={() => setShowTemplateInput(!showTemplateInput)} className="text-left flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-blue-600 uppercase tracking-widest transition-colors w-fit">
                          {showTemplateInput ? "− Hide Template" : "➕ Add Reference JD Template (Optional)"}
                       </button>
                       {showTemplateInput && (
                          <div 
                             className="relative w-full h-32"
                             onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                             onDrop={async (e) => {
                                e.preventDefault(); e.stopPropagation();
                                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                                   const file = e.dataTransfer.files[0];
                                   if (file.name.endsWith('.txt')) {
                                      const reader = new FileReader();
                                      reader.onload = (ev) => setTemplateText(ev.target?.result as string);
                                      reader.readAsText(file);
                                   } else if (file.name.endsWith('.docx')) {
                                      const reader = new FileReader();
                                      reader.onload = async (ev) => {
                                         const mammoth = await import("mammoth");
                                         const result = await mammoth.extractRawText({ arrayBuffer: ev.target?.result as ArrayBuffer });
                                         setTemplateText(result.value);
                                      };
                                      reader.readAsArrayBuffer(file);
                                   } else {
                                      toast.error("Unsupported template format. Please use .txt or .docx");
                                   }
                                }
                             }}
                          >
                             <textarea
                                value={templateText}
                                onChange={(e) => setTemplateText(e.target.value)}
                                placeholder="Paste your existing JD format, specific tone guidelines, or drag and drop a .docx/.txt file here..."
                                className="absolute inset-0 w-full h-full p-4 text-sm bg-white dark:bg-slate-950 border border-dashed border-blue-200 dark:border-blue-900/40 rounded-xl resize-none outline-none focus:ring-2 focus:ring-blue-100 transition-all shadow-sm"
                             />
                          </div>
                       )}
                    </div>

                    <Button 
                      onClick={handleProcessFile}
                      disabled={isProcessing || !selectedFile}
                      className="w-full rounded-2xl py-6 bg-[#2563EB] hover:bg-blue-700 text-white font-bold shadow-md transition-all uppercase tracking-widest text-[11px]"
                    >
                      {isProcessing ? (
                         <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing...</>
                      ) : "Process File"}
                    </Button>
                  </TabsContent>
                </div>
              </Tabs>
            </CardContent>
          </Card>
        </section>

        {/* --- RIGHT COLUMN: EXISTING JDS (Scrollable) --- */}
        <section className="flex-1 p-6 lg:p-8 flex flex-col gap-6 overflow-hidden min-h-0">
          <div className="flex items-center justify-between shrink-0">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Your Existing JDs</h2>
              <p className="text-xs text-slate-400 mt-0.5 uppercase font-semibold tracking-wider">{filteredJDs.length} Total Records</p>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search JD titles..." 
                className="pl-9 w-64 bg-white dark:bg-slate-900 rounded-xl border-slate-100 dark:border-slate-800"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-scroll pr-2 custom-scrollbar">
            <Card className="border border-slate-200/50 shadow-[0_8px_30px_rgb(0,0,0,0.03)] dark:shadow-none dark:border-slate-800 bg-white/70 backdrop-blur-xl dark:bg-slate-900/50 rounded-[32px] overflow-hidden min-h-full">
              <Table>
                <TableHeader className="bg-slate-50/50 dark:bg-slate-800/30">
                  <TableRow className="border-slate-100 dark:border-slate-800">
                    <TableHead className="font-bold uppercase tracking-widest text-[10px] text-slate-400">Role Title</TableHead>
                    <TableHead className="font-bold uppercase tracking-widest text-[10px] text-slate-400">Status</TableHead>
                    <TableHead className="font-bold uppercase tracking-widest text-[10px] text-slate-400">Created</TableHead>
                    <TableHead className="text-right font-bold uppercase tracking-widest text-[10px] text-slate-400">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isFetchingJDs ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-100 mx-auto" />
                        <p className="text-xs text-slate-400 mt-2 font-medium">Fetching your workspace...</p>
                      </TableCell>
                    </TableRow>
                  ) : filteredJDs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-20 text-slate-400">
                        <FileText className="w-12 h-12 text-slate-100 mx-auto mb-3" />
                        <p className="text-sm font-medium">No matching JDs found</p>
                        <p className="text-xs">Try a different search or create one on the left.</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredJDs.map((jd) => (
                      <TableRow 
                        key={jd.id} 
                        className="group cursor-pointer hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors border-slate-50 dark:border-slate-800" 
                        onClick={() => {
                          router.push(`/builder?jd_id=${jd.id}`)
                        }}
                      >
                        <TableCell className="py-4">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center group-hover:bg-white dark:group-hover:bg-slate-700 transition-colors shadow-sm">
                              <FileText className="w-5 h-5 text-blue-500" />
                            </div>
                            <span className="font-bold text-slate-700 dark:text-slate-200 text-sm">{jd.title}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={jd.status === 'draft' ? 'secondary' : 'default'} className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider ${jd.status === 'draft' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                            {jd.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-slate-400 text-[11px] font-medium font-mono">
                          {new Date(jd.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1 opacity-100 transition-all">
                            <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-600 hover:text-blue-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700 rounded-xl" title="Rename" onClick={(e) => handleRenameJD(e, jd.id, jd.title)}>
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-600 hover:text-red-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700 rounded-xl" title="Delete" onClick={(e) => handleDeleteJD(e, jd.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Card>
          </div>
        </section>

      </div>
    </AppShell>
  )
}
