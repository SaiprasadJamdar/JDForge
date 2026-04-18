"use client"

import { Check, Loader2, Clock, AudioWaveform, FileSearch, Sparkles, FileText } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type StepStatus = "completed" | "active" | "pending"

interface ProcessingStep {
  id: string
  label: string
  icon: React.ElementType
  status: StepStatus
}

const steps: ProcessingStep[] = [
  { id: "extraction", label: "Audio Extraction", icon: AudioWaveform, status: "completed" },
  { id: "transcription", label: "Transcription", icon: FileSearch, status: "completed" },
  { id: "cleaning", label: "Cleaning & Analysis", icon: Sparkles, status: "active" },
  { id: "generation", label: "JD Generation", icon: FileText, status: "pending" },
]

export function ProcessingStatus() {
  const completedSteps = steps.filter((s) => s.status === "completed").length
  const progress = (completedSteps / steps.length) * 100 + (steps.some((s) => s.status === "active") ? 12.5 : 0)

  return (
    <Card className="border-border bg-card shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">Processing Status</CardTitle>
          <Badge
            variant="secondary"
            className={cn(
              "text-xs",
              progress === 100
                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                : "bg-primary/10 text-primary"
            )}
          >
            {progress === 100 ? "Complete" : "In Progress"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Overall Progress</span>
            <span className="font-medium text-foreground">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Steps */}
        <div className="space-y-3">
          {steps.map((step, index) => {
            const StepIcon = step.icon
            return (
              <div
                key={step.id}
                className={cn(
                  "flex items-center gap-3 rounded-lg border p-3 transition-all",
                  step.status === "completed" && "border-green-200 bg-green-50/50 dark:border-green-900/50 dark:bg-green-950/20",
                  step.status === "active" && "border-primary/30 bg-primary/5",
                  step.status === "pending" && "border-border bg-muted/30"
                )}
              >
                <div
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                    step.status === "completed" && "bg-green-100 dark:bg-green-900/40",
                    step.status === "active" && "bg-primary/20",
                    step.status === "pending" && "bg-muted"
                  )}
                >
                  {step.status === "completed" ? (
                    <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                  ) : step.status === "active" ? (
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  ) : (
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1">
                  <p
                    className={cn(
                      "text-sm font-medium",
                      step.status === "completed" && "text-green-700 dark:text-green-400",
                      step.status === "active" && "text-foreground",
                      step.status === "pending" && "text-muted-foreground"
                    )}
                  >
                    {step.label}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <StepIcon className="h-3.5 w-3.5" />
                  <span>Step {index + 1}</span>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
