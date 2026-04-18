"use client"
import { useState, useEffect } from "react"
import { AppShell } from "@/components/app-shell"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { FloatingToolbar } from "@/components/builder/floating-toolbar"
import { 
  CheckCircle2, Circle, ChevronUp, MoreHorizontal, ChevronDown, ChevronRight, Bold, Italic, Underline, 
  Send, Code2, Database, Layout, Layers, Terminal, Server, Boxes, Plus, Mic, Headphones, ArrowUp, Pencil, CheckCircle, ArrowRight
} from "lucide-react"
import { useRouter } from "next/navigation"
import { initialJDs } from "@/lib/data"
import { useJDs } from "@/lib/useJDs"

export default function BuilderPage() {
  const [chatInput, setChatInput] = useState("")
  const isSummarySelected = chatInput.toLowerCase().includes("/summary")

  const [activeTab, setActiveTab] = useState("Final JD")
  const [activeJDId, setActiveJDId] = useState(1)
  const [activeTemplateId, setActiveTemplateId] = useState(1)
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [techRolesOpen, setTechRolesOpen] = useState(true)

  // Toolbar state
  const [toolbarVisible, setToolbarVisible] = useState(false)
  const [toolbarPosition, setToolbarPosition] = useState({ top: 0, left: 0 })

  const router = useRouter()
  const { jds, updateJD, markAsFinalized, isLoaded } = useJDs()
  const [selectedJDId, setSelectedJDId] = useState<string>("java_architect_x1")

  const currentJD = jds.find(j => j.id === selectedJDId) || initialJDs[0];

  const handleUpdate = (field: string, value: any) => {
    updateJD({
      ...currentJD,
      content: { ...currentJD.content, [field]: value }
    });
  }

  const handleListBlur = (e: React.FocusEvent<HTMLElement>, field: string) => {
    const items = Array.from(e.currentTarget.querySelectorAll('li')).map(li => li.textContent || '');
    handleUpdate(field, items);
  };

  const toggleCollapse = (section: string) => {
    setCollapsed(prev => ({ ...prev, [section]: !prev[section] }))
  }

  const handleMarkAsDoneAndNext = () => {
    markAsFinalized(currentJD.id)
    const nextJd = jds.find(jd => jd.status === "draft" && jd.id !== currentJD.id)
    if (nextJd) setSelectedJDId(nextJd.id)
  }

  const handleMarkAsDoneAndSource = () => {
    markAsFinalized(currentJD.id)
    router.push('/sourcing')
  }

  // Text selection and formatting handlers
  const handleTextSelection = () => {
    const selection = window.getSelection()
    if (selection && selection.toString().length > 0) {
      const range = selection.getRangeAt(0)
      const rect = range.getBoundingClientRect()
      setToolbarPosition({
        top: rect.top + window.scrollY - 50,
        left: rect.left + rect.width / 2 - 60,
      })
      setToolbarVisible(true)
    } else {
      setToolbarVisible(false)
    }
  }

  const applyFormat = (tag: "b" | "i" | "u") => {
    const selection = window.getSelection()
    if (!selection || !selection.rangeCount || selection.toString().length === 0) {
      setToolbarVisible(false)
      return
    }

    const range = selection.getRangeAt(0)
    const span = document.createElement(tag)

    try {
      range.surroundContents(span)
    } catch (e) {
      const fragment = range.extractContents()
      const span = document.createElement(tag)
      span.appendChild(fragment)
      range.insertNode(span)
    }

    selection.removeAllRanges()
    setToolbarVisible(false)
  }

  const templates = [
    { id: 1, title: "Java Developer", desc: "Experienced Java Developer for scalable enterprise apps", icon: <Code2 className="w-5 h-5 text-white" />, color: "bg-blue-500", tags: ["Java", "Spring Boot", "AWS"] },
    { id: 2, title: "Java Architect", desc: "Lead Java Architect for enterprise-level design", icon: <Boxes className="w-5 h-5 text-white" />, color: "bg-teal-500", tags: ["Java", "Spring Boot", "AWS"] },
    { id: 3, title: "Senior Leader", desc: "Enterprise Leadership and Cloud Architecture", icon: <Layers className="w-5 h-5 text-white" />, color: "bg-cyan-500", tags: ["Senior", "Leadership", "AWS"] },
    { id: 4, title: "DevOps Engineer", desc: "Vision-driven PM to lead cross-functional teams", icon: <Server className="w-5 h-5 text-white" />, color: "bg-blue-600", tags: ["AWS", "Docker", "AWS"] },
  ]

  return (
    <AppShell>
      <div className="flex-1 w-full p-4 lg:p-6 bg-[#F8FAFC] dark:bg-slate-950 flex gap-6 overflow-hidden h-[calc(100vh-64px)]">
        
        {/* --- LEFT COLUMN: Widgets --- */}
        <div className="w-[260px] shrink-0 flex flex-col gap-6 pb-4 h-full pr-1 overflow-hidden">
          
          {/* Identified JDs Widget */}
          <div className="bg-white dark:bg-slate-900 border border-transparent shadow-[0_4px_20px_rgb(0,0,0,0.03)] rounded-2xl flex flex-col flex-1 overflow-hidden min-h-0">
            <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors shrink-0" onClick={() => toggleCollapse('jds')}>
              <h3 className="font-semibold text-slate-800 dark:text-slate-200">Identified JDs</h3>
              {collapsed['jds'] ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
            </div>
            {!collapsed['jds'] && (
              <div className="px-3 pb-3 space-y-1 flex-1 overflow-y-auto hide-scrollbar">
                {isLoaded && jds.map(jd => {
                  const isActive = jd.id === selectedJDId;
                  const isDone = jd.status === "finalized";
                  return (
                    <div 
                      key={jd.id} 
                      onClick={() => setSelectedJDId(jd.id)}
                      className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-colors ${isActive ? 'bg-[#EAF3FF] dark:bg-[#2563EB]/10' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-7 h-7 rounded-lg ${jd.color} flex items-center justify-center shadow-sm`}>
                          {jd.iconType === "code" && <Code2 className="w-4 h-4 text-white" />}
                          {jd.iconType === "layout" && <Layout className="w-4 h-4 text-white" />}
                          {jd.iconType === "database" && <Database className="w-4 h-4 text-white" />}
                        </div>
                        <span className={`text-sm font-semibold ${isActive ? 'text-slate-900 dark:text-slate-100' : 'text-slate-600 dark:text-slate-400'}`}>
                          {jd.title}
                        </span>
                      </div>
                      {isDone ? (
                        <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center shrink-0">
                          <CheckCircle2 className="w-3 h-3 text-white" />
                        </div>
                      ) : (
                        <Circle className="w-4 h-4 text-slate-300 dark:text-slate-600 shrink-0" />
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Text Formatting Widget */}
          <div className="bg-white dark:bg-slate-900 border border-transparent shadow-[0_4px_20px_rgb(0,0,0,0.03)] rounded-2xl overflow-hidden">
            <div className="p-4 flex items-center justify-between border-b border-slate-50 dark:border-slate-800">
              <h3 className="font-semibold text-slate-800 dark:text-slate-200">Text Formatting</h3>
            </div>
            <div className="p-3">
              <p className="text-xs text-slate-600 dark:text-slate-400">
                ✨ Select text in the editor below and use the formatting buttons to apply <strong>Bold</strong>, <em>Italic</em>, or <u>Underline</u> formatting to just that text.
              </p>
            </div>
          </div>
        </div>

        {/* --- MIDDLE COLUMN: Job Description Editor --- */}
        <div className="flex-1 flex flex-col min-w-[500px] relative h-full overflow-y-auto hide-scrollbar pb-4 pr-1">
          <Card className="bg-white dark:bg-slate-900 border-0 shadow-[0_8px_30px_rgb(0,0,0,0.03)] rounded-[32px] flex flex-col min-h-max h-auto overflow-visible">
            
            {/* Header & Tabs */}
            <div className="px-8 pt-8 pb-4">
              <div className="flex justify-between items-start mb-6 gap-4">
                <h1 className="text-3xl font-bold text-slate-800 dark:text-white leading-tight">Wissen Technology is hiring for {currentJD.title}</h1>
                <div className="flex gap-2 shrink-0">
                  <Button onClick={handleMarkAsDoneAndNext} variant="outline" size="icon" className="text-blue-600 border-blue-200 hover:bg-blue-50 h-10 w-10 rounded-xl transition-all" title="Mark Done & Next">
                    <CheckCircle className="w-5 h-5" />
                  </Button>
                  <Button onClick={handleMarkAsDoneAndSource} size="icon" className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm h-10 w-10 rounded-xl transition-all" title="Mark Done & Source">
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                </div>
              </div>
              <div className="flex bg-slate-50 dark:bg-slate-800/50 p-1 rounded-2xl w-fit">
                {["Clean Transcript", "Final JD"].map(tab => (
                  <button 
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-6 py-2 rounded-xl text-sm font-medium transition-all ${activeTab === tab ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Document Content */}
            <div className="flex-1 px-8 pb-32">
              <div className="max-w-3xl mx-auto space-y-8 pb-10" onMouseUp={handleTextSelection}>
                
                {activeTab === "Clean Transcript" ? (
                  <div className="text-[15px] text-slate-700 dark:text-slate-300 leading-relaxed space-y-4 bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl">
                    <p><strong>[Hiring Manager]</strong>: We need a senior Java Architect with at least 12 years of experience to lead our enterprise applications team.</p>
                    <p><strong>[Recruiter]</strong>: Got it. What specific tech stack should they be proficient in?</p>
                    <p><strong>[Hiring Manager]</strong>: Core Java (Java 8+), Spring Boot, and Microservices are mandatory. They must also have strong knowledge of building and securing RESTful APIs, and experience with databases like Hibernate/JPA, SQL, or NoSQL. Messaging queues like Kafka or RabbitMQ would be a big plus.</p>
                    <p><strong>[Recruiter]</strong>: How about cloud or deployment tools?</p>
                    <p><strong>[Hiring Manager]</strong>: Yes, exposure to Docker and Kubernetes is needed. They should also have hands-on experience with AWS, Azure, or GCP. Good-to-have skills would include CI/CD, Jenkins, and general DevOps tools, along with knowledge of Domain-Driven Design (DDD).</p>
                    <p><strong>[Recruiter]</strong>: What about location and work mode?</p>
                    <p><strong>[Hiring Manager]</strong>: It's a hybrid role based in Pune or Mumbai. Because it's an architect role, they need excellent communication skills for stakeholder management and must be able to mentor junior developers.</p>
                  </div>
                ) : (
                  <>
                {/* Section: About Wissen Technology */}
                <div className="group">
                  <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleCollapse('about')}>
                    <h3 className="flex items-center text-lg font-bold text-slate-800 dark:text-slate-200">
                      {collapsed['about'] ? <ChevronRight className="w-5 h-5 mr-2 text-[#2563EB]" /> : <ChevronDown className="w-5 h-5 mr-2 text-[#2563EB]" />}
                      About Wissen Technology
                    </h3>
                    <div className="flex items-center gap-2">
                      <Pencil onClick={(e) => { e.stopPropagation(); document.getElementById('edit-about')?.focus(); }} className="w-4 h-4 text-slate-400 hover:text-blue-500 transition-colors opacity-0 group-hover:opacity-100" title="Edit text directly" />
                      <MoreHorizontal className="w-5 h-5 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                  {!collapsed['about'] && (
                    <div 
                      id="edit-about"
                      className="pl-7 mt-3 text-[15px] leading-relaxed text-slate-600 dark:text-slate-400 outline-none hover:bg-slate-50 dark:hover:bg-slate-800/50 p-2 -ml-2 rounded-xl transition-all focus:bg-white focus:ring-2 focus:ring-[#EAF3FF] dark:focus:ring-[#2563EB]/20" 
                      contentEditable 
                      suppressContentEditableWarning
                    >
                      <p>
                        At Wissen Technology, we deliver niche, custom-built products that solve complex business
                        challenges across industries worldwide. Founded in 2015, our core philosophy is built around a
                        strong product engineering mindset—ensuring every solution is architected and delivered right the
                        first time. Today, Wissen Technology has a global footprint with 2000+ employees across offices in
                        the US, UK, UAE, India, and Australia. Our commitment to excellence translates into delivering 2X
                        impact compared to traditional service providers. How do we achieve this? Through a combination of
                        deep domain knowledge, cutting-edge technology expertise, and a relentless focus on quality. We
                        don’t just meet expectations—we exceed them by ensuring faster time-to-market, reduced rework,
                        and greater alignment with client objectives. We have a proven track record of building mission-critical systems across industries, including financial services, healthcare, retail, manufacturing, and
                        more. Wissen stands apart through its unique delivery models. Our outcome-based projects ensure
                        predictable costs and timelines, while our agile pods provide clients the flexibility to adapt to their
                        evolving business needs. Wissen leverages its thought leadership and technology prowess to drive
                        superior business outcomes. Our success is powered by top-tier talent. Our mission is clear: to be the
                        partner of choice for building world-class custom products that deliver exceptional impact—the first
                        time, every time.
                      </p>
                    </div>
                  )}
                </div>

                {/* Section: Job Summary */}
                <div className="group">
                  <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleCollapse('summary')}>
                    <h3 className="flex items-center text-lg font-bold text-slate-800 dark:text-slate-200">
                      {collapsed['summary'] ? <ChevronRight className="w-5 h-5 mr-2 text-[#2563EB]" /> : <ChevronDown className="w-5 h-5 mr-2 text-[#2563EB]" />}
                      Job Summary
                    </h3>
                    <div className="flex items-center gap-2">
                      <Pencil onClick={(e) => { e.stopPropagation(); document.getElementById('edit-summary')?.focus(); }} className="w-4 h-4 text-slate-400 hover:text-blue-500 transition-colors opacity-0 group-hover:opacity-100" title="Edit text directly" />
                      <MoreHorizontal className="w-5 h-5 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                  {!collapsed['summary'] && (
                    <div 
                      id="edit-summary" 
                      className="pl-7 mt-3 outline-none hover:bg-slate-50 dark:hover:bg-slate-800/50 p-2 -ml-2 rounded-xl transition-all focus:bg-white focus:ring-2 focus:ring-[#EAF3FF] dark:focus:ring-[#2563EB]/20" 
                      contentEditable 
                      suppressContentEditableWarning
                      onBlur={(e) => handleUpdate('summary', e.currentTarget.textContent)}
                    >
                      <p className={`text-slate-600 dark:text-slate-400 text-[15px] leading-relaxed transition-all ${isSummarySelected ? 'bg-[#EAF3FF] dark:bg-[#2563EB]/20 ring-2 ring-[#2563EB] rounded-md p-2' : ''}`}>
                        {currentJD.content.summary}
                      </p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-6 group pl-7">
                  {/* Section: Experience */}
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2">Experience</h3>
                    <ul onBlur={(e) => handleUpdate('experience', e.currentTarget.textContent)} className="space-y-1 list-disc list-inside marker:text-slate-300 text-[15px] text-slate-600 dark:text-slate-400 outline-none hover:bg-slate-50 dark:hover:bg-slate-800/50 p-2 -ml-2 rounded-xl transition-all focus:bg-white focus:ring-2 focus:ring-[#EAF3FF] dark:focus:ring-[#2563EB]/20" contentEditable suppressContentEditableWarning>
                      <li>{currentJD.content.experience}</li>
                    </ul>
                  </div>

                  {/* Section: Location */}
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2">Location</h3>
                    <ul onBlur={(e) => handleUpdate('location', e.currentTarget.textContent)} className="space-y-1 list-disc list-inside marker:text-slate-300 text-[15px] text-slate-600 dark:text-slate-400 outline-none hover:bg-slate-50 dark:hover:bg-slate-800/50 p-2 -ml-2 rounded-xl transition-all focus:bg-white focus:ring-2 focus:ring-[#EAF3FF] dark:focus:ring-[#2563EB]/20" contentEditable suppressContentEditableWarning>
                      <li>{currentJD.content.location}</li>
                    </ul>
                  </div>

                  {/* Section: Mode of Work */}
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2">Mode of Work</h3>
                    <ul onBlur={(e) => handleUpdate('mode', e.currentTarget.textContent)} className="space-y-1 list-disc list-inside marker:text-slate-300 text-[15px] text-slate-600 dark:text-slate-400 outline-none hover:bg-slate-50 dark:hover:bg-slate-800/50 p-2 -ml-2 rounded-xl transition-all focus:bg-white focus:ring-2 focus:ring-[#EAF3FF] dark:focus:ring-[#2563EB]/20" contentEditable suppressContentEditableWarning>
                      <li>{currentJD.content.mode}</li>
                    </ul>
                  </div>
                </div>

                {/* Section: Key Responsibilities */}
                <div className="group">
                  <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleCollapse('responsibilities')}>
                    <h3 className="flex items-center text-lg font-bold text-slate-800 dark:text-slate-200">
                      {collapsed['responsibilities'] ? <ChevronRight className="w-5 h-5 mr-2 text-[#2563EB]" /> : <ChevronDown className="w-5 h-5 mr-2 text-[#2563EB]" />}
                      Key Responsibilities
                    </h3>
                    <div className="flex items-center gap-2">
                      <Pencil onClick={(e) => { e.stopPropagation(); document.getElementById('edit-responsibilities')?.focus(); }} className="w-4 h-4 text-slate-400 hover:text-blue-500 transition-colors opacity-0 group-hover:opacity-100" title="Edit text directly" />
                      <MoreHorizontal className="w-5 h-5 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                  {!collapsed['responsibilities'] && (
                    <ul 
                      id="edit-responsibilities" 
                      className="pl-7 mt-3 space-y-3 list-disc list-outside ml-4 marker:text-slate-300 text-[15px] text-slate-600 dark:text-slate-400 outline-none hover:bg-slate-50 dark:hover:bg-slate-800/50 p-2 -ml-2 rounded-xl transition-all focus:bg-white focus:ring-2 focus:ring-[#EAF3FF] dark:focus:ring-[#2563EB]/20" 
                      contentEditable 
                      suppressContentEditableWarning
                      onBlur={(e) => handleListBlur(e, 'responsibilities')}
                    >
                      {currentJD.content.responsibilities.map((req: string, i: number) => <li key={i}>{req}</li>)}
                    </ul>
                  )}
                </div>

                {/* Section: Qualifications and Required Skills */}
                <div className="group">
                  <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleCollapse('qualifications')}>
                    <h3 className="flex items-center text-lg font-bold text-slate-800 dark:text-slate-200">
                      {collapsed['qualifications'] ? <ChevronRight className="w-5 h-5 mr-2 text-[#2563EB]" /> : <ChevronDown className="w-5 h-5 mr-2 text-[#2563EB]" />}
                      Qualifications and Required Skills
                    </h3>
                    <div className="flex items-center gap-2">
                      <Pencil onClick={(e) => { e.stopPropagation(); document.getElementById('edit-qualifications')?.focus(); }} className="w-4 h-4 text-slate-400 hover:text-blue-500 transition-colors opacity-0 group-hover:opacity-100" title="Edit text directly" />
                      <MoreHorizontal className="w-5 h-5 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                  {!collapsed['qualifications'] && (
                    <ul 
                      id="edit-qualifications" 
                      className="pl-7 mt-3 space-y-3 list-disc list-outside ml-4 marker:text-slate-300 text-[15px] text-slate-600 dark:text-slate-400 outline-none hover:bg-slate-50 dark:hover:bg-slate-800/50 p-2 -ml-2 rounded-xl transition-all focus:bg-white focus:ring-2 focus:ring-[#EAF3FF] dark:focus:ring-[#2563EB]/20" 
                      contentEditable 
                      suppressContentEditableWarning
                      onBlur={(e) => handleListBlur(e, 'qualifications')}
                    >
                      {currentJD.content.qualifications.map((req: string, i: number) => <li key={i}>{req}</li>)}
                    </ul>
                  )}
                </div>

                {/* Section: Good to Have Skills */}
                <div className="group">
                  <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleCollapse('good-skills')}>
                    <h3 className="flex items-center text-lg font-bold text-slate-800 dark:text-slate-200">
                      {collapsed['good-skills'] ? <ChevronRight className="w-5 h-5 mr-2 text-[#2563EB]" /> : <ChevronDown className="w-5 h-5 mr-2 text-[#2563EB]" />}
                      Good to Have Skills
                    </h3>
                    <MoreHorizontal className="w-5 h-5 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  {!collapsed['good-skills'] && (
                    <ul 
                      className="pl-7 mt-3 space-y-3 list-disc list-outside ml-4 marker:text-slate-300 text-[15px] text-slate-600 dark:text-slate-400 outline-none hover:bg-slate-50 dark:hover:bg-slate-800/50 p-2 -ml-2 rounded-xl transition-all focus:bg-white focus:ring-2 focus:ring-[#EAF3FF] dark:focus:ring-[#2563EB]/20"
                      contentEditable 
                      suppressContentEditableWarning
                      onBlur={(e) => handleListBlur(e, 'goodToHave')}
                    >
                      {currentJD.content.goodToHave.map((req: string, i: number) => <li key={i}>{req}</li>)}
                    </ul>
                  )}
                </div>

                {/* Section: Soft Skills */}
                <div className="group">
                  <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleCollapse('soft-skills')}>
                    <h3 className="flex items-center text-lg font-bold text-slate-800 dark:text-slate-200">
                      {collapsed['soft-skills'] ? <ChevronRight className="w-5 h-5 mr-2 text-[#2563EB]" /> : <ChevronDown className="w-5 h-5 mr-2 text-[#2563EB]" />}
                      Soft Skills
                    </h3>
                    <MoreHorizontal className="w-5 h-5 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  {!collapsed['soft-skills'] && (
                    <div className="pl-7 mt-3 p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-xl">
                      <div className="text-[15px] font-semibold text-amber-700 dark:text-amber-500 flex items-center">
                        <span className="mr-2 text-lg">⚠️</span> Missing Information
                      </div>
                      <p className="text-[13px] text-amber-600/80 dark:text-amber-500/80 mt-1 italic font-medium ml-7">
                        [WARNING: This information was not found in the input]
                      </p>
                    </div>
                  )}
                </div>

                {/* Section: Wissen Sites */}
                <div className="group">
                  <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleCollapse('sites')}>
                    <h3 className="flex items-center text-lg font-bold text-slate-800 dark:text-slate-200">
                      {collapsed['sites'] ? <ChevronRight className="w-5 h-5 mr-2 text-[#2563EB]" /> : <ChevronDown className="w-5 h-5 mr-2 text-[#2563EB]" />}
                      Wissen Sites
                    </h3>
                    <MoreHorizontal className="w-5 h-5 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  {!collapsed['sites'] && (
                    <ul className="pl-7 mt-3 space-y-3 list-disc list-outside ml-4 marker:text-slate-300 text-[15px] text-slate-600 dark:text-slate-400">
                      <li>Website: <a href="http://www.wissen.com" className="text-[#2563EB] hover:underline" target="_blank" rel="noreferrer">www.wissen.com</a></li>
                      <li>LinkedIn: <a href="https://www.linkedin.com/company/wissen-technology" className="text-[#2563EB] hover:underline" target="_blank" rel="noreferrer">Wissen Technology</a></li>
                      <li>Wissen Leadership: <a href="https://www.wissen.com/company/leadership-team/" className="text-[#2563EB] hover:underline" target="_blank" rel="noreferrer">Leadership Team</a></li>
                      <li>Wissen Live: <a href="https://www.linkedin.com/company/wissen-technology/posts/feedView=All" className="text-[#2563EB] hover:underline" target="_blank" rel="noreferrer">Posts</a></li>
                      <li>Wissen Thought Leadership: <a href="https://www.wissen.com/articles/" className="text-[#2563EB] hover:underline" target="_blank" rel="noreferrer">Articles</a></li>
                    </ul>
                  )}
                </div>
                  </>
                )}
              </div>
            </div>
          </Card>


        </div>

        {/* --- RIGHT COLUMN: Templates --- */}
        <div className="w-[300px] shrink-0 flex flex-col gap-4 pb-4 h-full pr-1 overflow-hidden">
          <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 shrink-0">Templates</h2>
          
          {/* Dropdown */}
          <div 
            onClick={() => setTechRolesOpen(!techRolesOpen)}
            className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-3 flex justify-between items-center cursor-pointer hover:shadow-sm transition-shadow shrink-0"
          >
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Tech Roles</span>
            {techRolesOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
          </div>

          {/* Template Cards */}
          {techRolesOpen && (
          <div className="space-y-4 flex-1 overflow-y-auto hide-scrollbar pb-4">
            {templates.map(tpl => {
              const isActive = tpl.id === activeTemplateId;
              return (
                <div 
                  key={tpl.id} 
                  onClick={() => setActiveTemplateId(tpl.id)}
                  className={`p-4 rounded-3xl border transition-all cursor-pointer ${isActive ? 'bg-[#EAF3FF] dark:bg-[#2563EB]/10 border-[#2563EB]/30 shadow-[0_4px_20px_rgb(0,0,0,0.05)]' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:shadow-sm'}`}
                >
                  <div className="flex gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-xl ${tpl.color} flex items-center justify-center shrink-0 shadow-sm`}>
                      {tpl.icon}
                    </div>
                    <div>
                      <h4 className={`font-bold text-[15px] leading-tight ${isActive ? 'text-blue-900 dark:text-blue-300' : 'text-slate-800 dark:text-slate-100'}`}>{tpl.title}</h4>
                      <p className={`text-[11px] mt-1 leading-snug ${isActive ? 'text-blue-700/70 dark:text-blue-400/70' : 'text-slate-500 dark:text-slate-400'}`}>{tpl.desc}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {tpl.tags.map((tag, idx) => (
                      <span key={idx} className={`px-2.5 py-0.5 text-[10px] font-semibold rounded-full ${isActive ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                        {tag}
                      </span>
                    ))}
                  </div>
                  <Button 
                    variant={isActive ? "default" : "outline"} 
                    className={`w-full rounded-full text-xs font-semibold h-9 transition-colors ${isActive ? 'bg-[#2563EB] hover:bg-blue-700 text-white shadow-md' : 'border-[#2563EB]/20 text-[#2563EB] hover:bg-slate-50 dark:hover:bg-slate-800 bg-transparent'}`}
                  >
                    {isActive ? "Template Applied" : "Use Template"}
                  </Button>
                </div>
              )
            })}
          </div>
          )}
        </div>

      </div>

      {/* Floating Toolbar */}
      <FloatingToolbar
        isVisible={toolbarVisible}
        position={toolbarPosition}
        onBold={() => applyFormat("b")}
        onItalic={() => applyFormat("i")}
        onUnderline={() => applyFormat("u")}
      />

      {/* FLOATING ChatGPT Style Chat Input */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-[700px] px-4 z-50">
        <div className="bg-[#2563EB]/95 dark:bg-[#2563EB]/95 backdrop-blur-md border border-transparent rounded-full shadow-[0_8px_30px_rgb(37,99,235,0.3)] px-6 py-3 h-16 flex items-center transition-all hover:shadow-[0_12px_40px_rgb(37,99,235,0.4)] focus-within:shadow-[0_12px_40px_rgb(37,99,235,0.4)]">
          <button className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors shrink-0">
            <Plus className="w-5 h-5" />
          </button>
          <input 
            type="text" 
            placeholder={isListening ? "Listening..." : isSpeaking ? "Voice mode active..." : "Ask JDForge anything..."} 
            className="flex-1 bg-transparent border-none outline-none px-4 text-[16px] text-white placeholder:text-white/70 font-medium"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && chatInput.trim()) {
                setChatInput('') // Simulate send
              }
            }}
          />
          <div className="flex items-center shrink-0">
            {chatInput.length > 0 ? (
              <button onClick={() => setChatInput('')} className="p-2 bg-white text-[#2563EB] rounded-full hover:bg-slate-100 transition-colors ml-2 shadow-sm">
                <ArrowUp className="w-5 h-5" />
              </button>
            ) : (
              <>
                <button 
                  onClick={() => setIsListening(!isListening)}
                  className={`p-2 rounded-full transition-colors ml-1 ${isListening ? 'bg-red-500 text-white animate-pulse' : 'text-white/80 hover:text-white hover:bg-white/10'}`}
                >
                  <Mic className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => setIsSpeaking(!isSpeaking)}
                  className={`p-2 rounded-full transition-colors ml-1 ${isSpeaking ? 'bg-cyan-400 text-white animate-pulse' : 'text-white/80 hover:text-white hover:bg-white/10'}`}
                >
                  <Headphones className="w-5 h-5" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  )
}
