"use client"

import { useState } from "react"
import { Code2, Sparkles, Copy, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const sampleQuery = `("Java Developer" OR "Backend Engineer") AND (Spring Boot) AND (AWS OR "Google Cloud")`

export function BooleanSearch() {
  const [query, setQuery] = useState(sampleQuery)
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(query)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleReset = () => {
    setQuery(sampleQuery)
  }

  // Simple syntax highlighting
  const highlightQuery = (text: string) => {
    return text
      .replace(/(AND|OR|NOT)/g, '<span class="text-primary font-semibold">$1</span>')
      .replace(/\("([^"]+)"\)/g, '<span class="text-amber-600 dark:text-amber-400">("$1")</span>')
      .replace(/"([^"]+)"/g, '<span class="text-green-600 dark:text-green-400">"$1"</span>')
  }

  return (
    <Card className="border-border bg-card shadow-sm">
      <CardContent className="p-0">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border bg-muted/30 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Code2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">Boolean Search Query</h2>
              <p className="text-xs text-muted-foreground">
                AI-generated search query for sourcing candidates
              </p>
            </div>
          </div>
          <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/10">
            <Sparkles className="mr-1 h-3 w-3" />
            Auto-Generated
          </Badge>
        </div>

        {/* Query Editor */}
        <div className="p-5">
          <div className="relative">
            <div
              className="min-h-[80px] rounded-lg border border-border bg-muted/30 p-4 font-mono text-sm leading-relaxed focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20"
            >
              <div
                contentEditable
                suppressContentEditableWarning
                onBlur={(e) => setQuery(e.currentTarget.textContent || "")}
                className="outline-none text-foreground"
                dangerouslySetInnerHTML={{ __html: highlightQuery(query) }}
              />
            </div>
            
            {/* Actions */}
            <div className="absolute right-2 top-2 flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                onClick={handleCopy}
              >
                <Copy className={cn("h-3.5 w-3.5", copied && "text-green-600")} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                onClick={handleReset}
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Legend */}
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-primary" />
              <span>Operators</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-green-600" />
              <span>Keywords</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-600" />
              <span>Exact Match</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
