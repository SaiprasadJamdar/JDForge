"use client"

import { useState } from "react"
import { CheckCircle2, FileText, Sparkles, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

interface JDEditorPanelProps {
  title: string
  onMarkDone: () => void
}

const sampleJD = {
  summary: `We are seeking a talented Senior Java Developer to join our engineering team. The ideal candidate will have extensive experience in building scalable, high-performance applications using Java and modern frameworks. You will work closely with cross-functional teams to design, develop, and maintain enterprise-grade software solutions.`,
  responsibilities: [
    "Design and develop high-quality, scalable Java applications",
    "Write clean, maintainable, and well-documented code",
    "Collaborate with product managers and designers to understand requirements",
    "Participate in code reviews and mentor junior developers",
    "Optimize application performance and ensure system reliability",
    "Troubleshoot and debug complex technical issues",
  ],
  skills: [
    "Java 11+ with Spring Boot / Spring Framework",
    "RESTful API design and implementation",
    "Microservices architecture patterns",
    "SQL and NoSQL databases (PostgreSQL, MongoDB)",
    "Docker and Kubernetes",
    "CI/CD pipelines (Jenkins, GitLab CI)",
  ],
  qualifications: [
    "Bachelor's degree in Computer Science or related field",
    "5+ years of professional Java development experience",
    "Strong understanding of OOP principles and design patterns",
    "Experience with Agile/Scrum methodologies",
    "Excellent communication and teamwork skills",
  ],
}

export function JDEditorPanel({ title, onMarkDone }: JDEditorPanelProps) {
  const [activeView, setActiveView] = useState("final")
  const [editedContent, setEditedContent] = useState(sampleJD)

  return (
    <div className="flex h-full flex-col rounded-xl border border-border bg-card">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground">{title}</h2>
            <p className="text-xs text-muted-foreground">Edit and finalize job description</p>
          </div>
        </div>
        <Button onClick={onMarkDone} className="gap-2">
          <CheckCircle2 className="h-4 w-4" />
          Mark as Done
        </Button>
      </div>

      {/* View Toggle */}
      <div className="border-b border-border px-5 py-3">
        <Tabs value={activeView} onValueChange={setActiveView}>
          <TabsList className="h-9 bg-muted/50">
            <TabsTrigger value="raw" className="gap-1.5 text-xs">
              <FileText className="h-3.5 w-3.5" />
              Raw Transcript
            </TabsTrigger>
            <TabsTrigger value="clean" className="gap-1.5 text-xs">
              <Sparkles className="h-3.5 w-3.5" />
              Clean Transcript
            </TabsTrigger>
            <TabsTrigger value="final" className="gap-1.5 text-xs">
              <Eye className="h-3.5 w-3.5" />
              Final JD
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-5">
          {activeView === "raw" && (
            <div className="space-y-4">
              <Badge variant="outline" className="text-xs">Raw Transcript</Badge>
              <div className="rounded-lg border border-border bg-muted/30 p-4 font-mono text-sm text-muted-foreground leading-relaxed">
                {"Um, so we're looking for a Java developer, senior level... They should know Spring Boot really well, and uh... microservices. Yes, definitely microservices. We need someone who can, you know, design scalable systems. Five years experience minimum. Should be good at SQL databases, PostgreSQL preferably, and also some experience with Docker and Kubernetes would be great..."}
              </div>
            </div>
          )}

          {activeView === "clean" && (
            <div className="space-y-4">
              <Badge variant="outline" className="text-xs">Cleaned Transcript</Badge>
              <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm text-foreground leading-relaxed">
                <p className="mb-3">Looking for a Senior Java Developer with the following requirements:</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>Strong Spring Boot expertise</li>
                  <li>Microservices architecture experience</li>
                  <li>Ability to design scalable systems</li>
                  <li>Minimum 5 years of experience</li>
                  <li>PostgreSQL database knowledge</li>
                  <li>Docker and Kubernetes experience preferred</li>
                </ul>
              </div>
            </div>
          )}

          {activeView === "final" && (
            <div className="space-y-6">
              {/* Job Summary */}
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground">Job Summary</h3>
                  <Badge className="bg-primary/10 text-primary text-[10px]">Editable</Badge>
                </div>
                <Textarea
                  value={editedContent.summary}
                  onChange={(e) => setEditedContent({ ...editedContent, summary: e.target.value })}
                  className="min-h-[100px] resize-none border-border bg-background text-sm leading-relaxed focus:ring-2 focus:ring-primary/20"
                />
              </section>

              {/* Responsibilities */}
              <section className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground">Key Responsibilities</h3>
                <div className="space-y-2">
                  {editedContent.responsibilities.map((item, index) => (
                    <div
                      key={index}
                      className="group flex items-start gap-3 rounded-lg border border-border bg-background p-3 transition-all hover:border-primary/30"
                    >
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-medium text-primary">
                        {index + 1}
                      </span>
                      <p className="flex-1 text-sm text-foreground">{item}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* Skills */}
              <section className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground">Required Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {editedContent.skills.map((skill, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="bg-surface text-foreground border border-border px-3 py-1.5 text-xs font-medium"
                    >
                      {skill}
                    </Badge>
                  ))}
                </div>
              </section>

              {/* Qualifications */}
              <section className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground">Qualifications</h3>
                <div className="rounded-lg border border-border bg-background p-4">
                  <ul className="space-y-2">
                    {editedContent.qualifications.map((item, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-foreground">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </section>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
