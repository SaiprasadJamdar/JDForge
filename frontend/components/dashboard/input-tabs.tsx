"use client"

import { useState } from "react"
import { FileText, Upload, Mic, Square } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

type TabType = "paste" | "upload" | "record"

export function InputTabs() {
  const [activeTab, setActiveTab] = useState<TabType>("paste")
  const [isRecording, setIsRecording] = useState(false)
  const [text, setText] = useState("")

  const tabs = [
    { id: "paste" as TabType, label: "Paste Text", icon: FileText },
    { id: "upload" as TabType, label: "Upload File", icon: Upload },
    { id: "record" as TabType, label: "Record Audio", icon: Mic },
  ]

  return (
    <Card className="border-border bg-card shadow-sm">
      <CardContent className="p-0">
        {/* Tabs */}
        <div className="flex border-b border-border">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "relative flex flex-1 items-center justify-center gap-2 px-4 py-3.5 text-sm font-medium transition-colors",
                activeTab === tab.id
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <tab.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                  transition={{ duration: 0.2 }}
                />
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-5">
          {activeTab === "paste" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Textarea
                placeholder="Paste your job description text, meeting notes, or requirements here..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="min-h-[140px] resize-none border-border bg-muted/30 text-sm placeholder:text-muted-foreground focus:bg-background focus:ring-2 focus:ring-primary/20"
              />
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {text.length} characters
                </span>
                <Button
                  size="sm"
                  disabled={!text.trim()}
                  className="gap-2"
                >
                  Process Text
                </Button>
              </div>
            </motion.div>
          )}

          {activeTab === "upload" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="flex min-h-[140px] flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/20 p-6"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
                <Upload className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="mt-3 text-sm font-medium text-foreground">
                Click to upload or drag & drop
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                PDF, DOCX, TXT up to 10MB
              </p>
              <input
                type="file"
                accept=".pdf,.docx,.txt"
                className="absolute inset-0 cursor-pointer opacity-0"
              />
            </motion.div>
          )}

          {activeTab === "record" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="flex min-h-[140px] flex-col items-center justify-center py-4"
            >
              <button
                onClick={() => setIsRecording(!isRecording)}
                className={cn(
                  "group relative flex h-20 w-20 items-center justify-center rounded-full transition-all duration-300",
                  isRecording
                    ? "bg-destructive shadow-lg shadow-destructive/30"
                    : "bg-primary shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40"
                )}
              >
                {isRecording ? (
                  <Square className="h-7 w-7 text-destructive-foreground" />
                ) : (
                  <Mic className="h-7 w-7 text-primary-foreground" />
                )}
                {isRecording && (
                  <span className="absolute inset-0 animate-ping rounded-full bg-destructive/50" />
                )}
              </button>
              <p className="mt-4 text-sm font-medium text-foreground">
                {isRecording ? "Recording... Click to stop" : "Click to start recording"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {isRecording ? "00:12" : "Record up to 30 minutes"}
              </p>
            </motion.div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
