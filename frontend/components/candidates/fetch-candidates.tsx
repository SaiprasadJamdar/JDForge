"use client"

import { useState } from "react"
import { Search, Linkedin, Database, Globe, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface Source {
  id: string
  name: string
  icon: React.ElementType
  color: string
  selected: boolean
}

const initialSources: Source[] = [
  {
    id: "linkedin",
    name: "LinkedIn",
    icon: Linkedin,
    color: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
    selected: true,
  },
  {
    id: "naukri",
    name: "Naukri",
    icon: Globe,
    color: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800",
    selected: true,
  },
  {
    id: "internal",
    name: "Internal DB",
    icon: Database,
    color: "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800",
    selected: false,
  },
]

interface FetchCandidatesProps {
  onFetch: () => void
  isLoading: boolean
}

export function FetchCandidates({ onFetch, isLoading }: FetchCandidatesProps) {
  const [sources, setSources] = useState(initialSources)

  const toggleSource = (id: string) => {
    setSources((prev) =>
      prev.map((s) => (s.id === id ? { ...s, selected: !s.selected } : s))
    )
  }

  const selectedCount = sources.filter((s) => s.selected).length

  return (
    <Card className="border-border bg-card shadow-sm">
      <CardContent className="p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Source Selection */}
          <div>
            <p className="text-sm font-medium text-foreground mb-2">Data Sources</p>
            <div className="flex flex-wrap gap-2">
              {sources.map((source) => {
                const Icon = source.icon
                return (
                  <button
                    key={source.id}
                    onClick={() => toggleSource(source.id)}
                    className={cn(
                      "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-all",
                      source.selected
                        ? source.color
                        : "border-border bg-muted/30 text-muted-foreground hover:bg-muted"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {source.name}
                    {source.selected && (
                      <Badge variant="secondary" className="ml-1 h-5 bg-background/50 px-1.5 text-[10px]">
                        Active
                      </Badge>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Fetch Button */}
          <Button
            onClick={onFetch}
            disabled={selectedCount === 0 || isLoading}
            size="lg"
            className="gap-2 shadow-md"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Fetching...
              </>
            ) : (
              <>
                <Search className="h-4 w-4" />
                Fetch Candidates
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
