"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AppShell } from "@/components/app-shell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Upload, Mic, MicOff, Search, FileText, FileAudio, File, Loader2, Pencil, Trash2, Sparkles, X } from "lucide-react"
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
import { toast } from "sonner"

export default function DashboardPage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  
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
  const [clarificationQuestions, setClarificationQuestions] = useState<string[]>([])
  const [isCheckingGaps, setIsCheckingGaps] = useState(false)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [gapAnswers, setGapAnswers] = useState<Record<number, string>>({})
  const [isGapFlowActive, setIsGapFlowActive] = useState(false)
  const [localAnswer, setLocalAnswer] = useState("")

  // Authentication Redirect
  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login")
    }
  }, [user, isLoading, router])

  // Fetch Existing JDs
  useEffect(() => {
    async function loadJDs() {
      try {
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

  const handleCheckGaps = async () => {
    if (!pastedText.trim()) return
    setIsCheckingGaps(true)
    try {
      const res = await fetchApi("/jds/clarify", {
        method: "POST",
        body: JSON.stringify({ 
          text: pastedText,
          template: templateText.trim() || null
        })
      })
      if (res.questions && res.questions.length > 0) {
        setClarificationQuestions(res.questions)
        setCurrentQuestionIndex(0)
        setGapAnswers({})
        setIsGapFlowActive(true)
        toast.info("Identified 6 critical gaps to improve your JD.")
      } else {
        toast.success("Your input seems comprehensive!")
      }
    } catch (err) {
      console.error(err)
      toast.error("Failed to analyze text for gaps.")
    } finally {
      setIsCheckingGaps(false)
    }
  }

  const handleFinishGapFlow = () => {
    let extraNotes = "\n\n--- ADDITIONAL CLARIFICATIONS ---\n"
    let added = false
    Object.entries(gapAnswers).forEach(([idx, answer]) => {
      const q = clarificationQuestions[parseInt(idx)]
      if (answer && answer.trim()) {
        extraNotes += `Q: ${q}\nA: ${answer}\n\n`
        added = true
      }
    })

    if (added) {
      setPastedText(prev => prev + extraNotes)
      toast.success("JD text updated with your clarifications!")
    }
    setIsGapFlowActive(false)
    setClarificationQuestions([])
  }

  const handleNextQuestion = (answer?: string) => {
    if (answer !== undefined) {
      setGapAnswers(prev => ({ ...prev, [currentQuestionIndex]: answer }))
    }
    
    if (currentQuestionIndex < clarificationQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
    } else {
      handleFinishGapFlow()
    }
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleProcessText = async () => {
    if (!pastedText.trim()) return
    setIsProcessing(true)
    try {
      const transcript = await fetchApi("/transcripts", {
        method: "POST",
        body: JSON.stringify({
          raw_text: pastedText,
          source_type: "text_paste",
          source_filename: "pasted_text.txt",
          language_hint: "en"
        })
      })

      const result = await fetchApi("/jds/generate", {
        method: "POST",
        body: JSON.stringify({
          transcript_id: transcript.id,
          template: templateText.trim() || null
        })
      })
      
      if (result.jds && result.jds.length > 0) {
        setJds((prev: any[]) => [...result.jds, ...prev])
        router.push(`/builder?jd_id=${result.jds[0].id}`)
      }
    } catch (err) {
      console.error(err)
      toast.error("An error occurred during processing.")
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

      const jds = await fetchApi("/transcripts/upload-and-generate", {
        method: "POST",
        body: formData,
      })

      if (jds && jds.length > 0) {
        setJds((prev: any[]) => [...jds, ...prev])
        router.push(`/builder?jd_id=${jds[0].id}`)
      }
    } catch (err) {
      console.error(err)
      toast.error("Failed to process file. Please check that FFmpeg is installed.")
    } finally {
      setIsProcessing(false)
    }
  }

  const filteredJDs = jds.filter(jd => 
    jd.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (isLoading) return null;

  return (
    <AppShell>
      <div className="flex-1 w-full bg-slate-50 flex flex-col lg:flex-row overflow-hidden h-full min-h-0 relative">
        <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-blue-50/50 to-transparent pointer-events-none" />
        
        <section className="w-full lg:w-[480px] shrink-0 p-6 lg:p-8 flex flex-col gap-6 lg:border-r border-slate-200/50 relative z-10">
          <div>
            <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-indigo-600 tracking-tight">Create New JD</h1>
            <p className="text-sm text-slate-500 mt-2 font-medium leading-relaxed">Paste hiring requirements or upload recordings to synthesize structured JDs instantly.</p>
          </div>

          <Card className="border border-slate-200/60 shadow-xl shadow-blue-900/5 rounded-[32px] overflow-hidden bg-white/80 backdrop-blur-xl flex flex-col min-h-0 flex-1">
            <CardContent className="p-0 flex flex-col h-full min-h-0">
              <Tabs defaultValue="paste" className="w-full h-full flex flex-col min-h-0">
                <div className="bg-slate-50/50 p-3 border-b border-slate-100/50 shrink-0">
                  <TabsList className="bg-transparent w-full grid grid-cols-2 gap-2 h-12">
                    <TabsTrigger value="paste" className="rounded-2xl data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-[0_2px_10px_rgba(0,0,0,0.06)] font-semibold transition-all">
                      <FileText className="w-4 h-4 mr-2" /> Paste Text
                    </TabsTrigger>
                    <TabsTrigger value="upload" className="rounded-2xl data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-[0_2px_10px_rgba(0,0,0,0.06)] font-semibold transition-all">
                      <Upload className="w-4 h-4 mr-2" /> Upload File
                    </TabsTrigger>
                  </TabsList>
                </div>

                <div className="flex-1 overflow-y-scroll custom-scrollbar">
                  <TabsContent value="paste" className="mt-0 p-6 h-full flex flex-col gap-4">
                    <div className="relative flex-1">
                      <textarea 
                        value={pastedText}
                        onChange={(e) => setPastedText(e.target.value)}
                        placeholder="Paste your meeting notes, job requirements, or unstructured text here..."
                        className="w-full h-full p-5 pb-16 bg-[#F8FAFC] border border-slate-200 rounded-2xl resize-none outline-none focus:ring-2 focus:ring-[#EAF3FF] focus:border-[#2563EB] transition-all"
                      ></textarea>
                      
                      <div className="absolute top-4 right-4 flex gap-2">
                        <Button 
                          onClick={handleCheckGaps}
                          disabled={isCheckingGaps || !pastedText.trim() || isGapFlowActive}
                          variant="outline" 
                          size="sm" 
                          className="rounded-full bg-white text-blue-600 border-blue-100 hover:border-blue-200 shadow-sm transition-all text-[10px] font-bold uppercase tracking-wider h-8"
                        >
                          {isCheckingGaps ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Sparkles className="w-3.5 h-3.5 text-blue-500 mr-1.5" />}
                          Identify Gaps
                        </Button>
                      </div>

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

                    {isGapFlowActive && clarificationQuestions.length > 0 && (
                      <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-2xl p-6 shadow-sm animate-in fade-in zoom-in-95 duration-300">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#FDE68A] text-[#92400E] text-[10px] font-black">
                              {currentQuestionIndex + 1}
                            </span>
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#92400E]">
                              Refining Details ({currentQuestionIndex + 1}/6)
                            </h4>
                          </div>
                          <button 
                            onClick={handleFinishGapFlow}
                            className="text-[#D97706] hover:text-[#92400E] transition-colors p-1"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        <p className="text-sm font-bold text-[#78350F] mb-4 leading-tight">
                          {clarificationQuestions[currentQuestionIndex]}
                        </p>

                        <div className="flex flex-col gap-3">
                          <textarea 
                            value={localAnswer}
                            onChange={(e) => setLocalAnswer(e.target.value)}
                            placeholder="Enter your answer or skip..."
                            className="w-full bg-white border border-[#FDE68A] rounded-xl p-3 text-sm text-[#78350F] outline-none focus:ring-2 focus:ring-[#FEF3C7] transition-all min-h-[60px] placeholder:text-[#FBBF24]/50"
                          />
                          
                          <div className="flex items-center justify-between gap-3">
                            <button 
                              onClick={() => { handleNextQuestion(); setLocalAnswer(""); }}
                              className="px-4 py-2 text-[10px] font-black uppercase tracking-wider text-[#92400E] hover:bg-[#FEF3C7] rounded-lg transition-all"
                            >
                              Skip Question
                            </button>
                            
                            <div className="flex gap-2">
                              {currentQuestionIndex > 0 && (
                                <button 
                                  onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
                                  className="px-4 py-2 text-[10px] font-black uppercase tracking-wider text-[#92400E] hover:bg-[#FEF3C7] rounded-lg transition-all"
                                >
                                  Back
                                </button>
                              )}
                              <Button 
                                onClick={() => { handleNextQuestion(localAnswer); setLocalAnswer(""); }}
                                className="bg-[#D97706] hover:bg-[#92400E] text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm"
                              >
                                {currentQuestionIndex === clarificationQuestions.length - 1 ? "Finish & Update" : "Next Details"}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex flex-col gap-2">
                       <button onClick={() => setShowTemplateInput(!showTemplateInput)} className="text-left flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-blue-600 uppercase tracking-widest transition-colors w-fit">
                          {showTemplateInput ? "− Hide Template" : "➕ Add Reference JD Template (Optional)"}
                       </button>
                       {showTemplateInput && (
                          <textarea
                             value={templateText}
                             onChange={(e) => setTemplateText(e.target.value)}
                             placeholder="Paste your existing JD format, specific tone guidelines, or a reference structure..."
                             className="w-full h-32 p-4 text-sm bg-white border border-dashed border-blue-200 rounded-xl resize-none outline-none focus:ring-2 focus:ring-blue-100 transition-all shadow-sm"
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

                  <TabsContent value="upload" className="mt-0 p-6 h-full flex flex-col gap-6">
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={handleDragOver}
                      onDragEnter={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={`flex-1 min-h-[300px] border-2 border-dashed rounded-3xl p-8 text-center transition-all cursor-pointer group flex flex-col items-center justify-center ${isDragging ? 'border-[#2563EB] bg-blue-50/50' : 'border-slate-200 hover:border-[#2563EB] bg-slate-50'}`}
                    >
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileChange} 
                        className="hidden" 
                        accept="audio/*,video/*,.pdf,.docx"
                      />
                      <div className="w-20 h-20 bg-white rounded-3xl shadow-sm flex items-center justify-center mb-6 group-hover:scale-105 transition-transform">
                        <Upload className="w-10 h-10 text-[#2563EB]" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-800">Drag & drop files</h3>
                      <p className="text-slate-500 mt-1 text-[11px]">Audio, Video, PDF, or Word (.docx)</p>
                    </div>

                    {selectedFile && (
                      <div className="flex items-center justify-between bg-white border border-slate-200 px-4 py-3 rounded-2xl shadow-sm animate-in fade-in slide-in-from-bottom-2">
                        <div className="flex items-center min-w-0">
                           <FileAudio className="w-4 h-4 text-[#2563EB] mr-3 shrink-0" />
                           <span className="text-xs font-semibold text-slate-700 truncate">{selectedFile.name}</span>
                        </div>
                        <button 
                          onClick={handleRemoveFile}
                          className="w-6 h-6 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors shrink-0"
                        >
                          &times;
                        </button>
                      </div>
                    )}
                    
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
                                className="absolute inset-0 w-full h-full p-4 text-sm bg-white border border-dashed border-blue-200 rounded-xl resize-none outline-none focus:ring-2 focus:ring-blue-100 transition-all shadow-sm"
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

        <section className="flex-1 p-6 lg:p-8 flex flex-col gap-6 overflow-hidden min-h-0">
          <div className="flex items-center justify-between shrink-0">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Your Existing JDs</h2>
              <p className="text-xs text-slate-400 mt-0.5 uppercase font-semibold tracking-wider">{filteredJDs.length} Total Records</p>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search JD titles..." 
                className="pl-9 w-64 bg-white rounded-xl border-slate-100"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-scroll pr-2 custom-scrollbar">
            <Card className="border border-slate-200/50 shadow-[0_8px_30px_rgb(0,0,0,0.03)] bg-white/70 backdrop-blur-xl rounded-[32px] overflow-hidden min-h-full">
              <Table>
                <TableHeader className="bg-slate-50/50">
                  <TableRow className="border-slate-100">
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
                        className="group cursor-pointer hover:bg-blue-50/30 transition-colors border-slate-50" 
                        onClick={() => {
                          router.push(`/builder?jd_id=${jd.id}`)
                        }}
                      >
                        <TableCell className="py-4">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center group-hover:bg-white transition-colors shadow-sm">
                              <FileText className="w-5 h-5 text-blue-500" />
                            </div>
                            <span className="font-bold text-slate-700 text-sm">{jd.title}</span>
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
                            <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-xl" title="Rename" onClick={(e) => handleRenameJD(e, jd.id, jd.title)}>
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-600 hover:text-red-500 hover:bg-slate-100 rounded-xl" title="Delete" onClick={(e) => handleDeleteJD(e, jd.id)}>
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
