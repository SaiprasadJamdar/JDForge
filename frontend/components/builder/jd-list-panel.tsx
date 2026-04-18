"use client"

import { useState } from "react"
import { Check, FileText, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

interface JDItem {
  id: string
  title: string
  selected: boolean
  status: "ready" | "editing" | "done"
}

interface JDListPanelProps {
  items: JDItem[]
  onSelect: (id: string) => void
  onToggle: (id: string) => void
  selectedId: string | null
}

export function JDListPanel({ items, onSelect, onToggle, selectedId }: JDListPanelProps) {
  const [search, setSearch] = useState("")

  const filteredItems = items.filter((item) =>
    item.title.toLowerCase().includes(search.toLowerCase())
  )

  const getStatusStyle = (status: JDItem["status"]) => {
    switch (status) {
      case "done":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
      case "editing":
        return "bg-primary/10 text-primary"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  return (
    <div className="flex h-full flex-col rounded-xl border border-border bg-card">
      {/* Header */}
      <div className="border-b border-border p-4">
        <h2 className="text-sm font-semibold text-foreground">Identified JDs</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {items.filter((i) => i.selected).length} of {items.length} selected
        </p>
        <div className="relative mt-3">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search JDs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 pl-9 text-sm"
          />
        </div>
      </div>

      {/* List */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              onClick={() => onSelect(item.id)}
              className={cn(
                "group flex cursor-pointer items-center gap-3 rounded-lg p-3 transition-all",
                selectedId === item.id
                  ? "bg-primary/10 border border-primary/30"
                  : "hover:bg-muted/50 border border-transparent"
              )}
            >
              <Checkbox
                checked={item.selected}
                onCheckedChange={() => onToggle(item.id)}
                onClick={(e) => e.stopPropagation()}
                className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
              />
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted group-hover:bg-background">
                {item.status === "done" ? (
                  <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                ) : (
                  <FileText className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn(
                  "truncate text-sm font-medium",
                  selectedId === item.id ? "text-primary" : "text-foreground"
                )}>
                  {item.title}
                </p>
                <Badge className={cn("mt-1 text-[10px]", getStatusStyle(item.status))}>
                  {item.status === "done" ? "Completed" : item.status === "editing" ? "Editing" : "Ready"}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
