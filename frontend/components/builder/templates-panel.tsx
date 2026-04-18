"use client"

import { useState } from "react"
import { LayoutTemplate, Code2, Briefcase, Users, Filter, Palette } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

interface Template {
  id: string
  name: string
  category: "tech" | "non-tech" | "senior"
  icon: React.ElementType
  color: string
}

const templates: Template[] = [
  { id: "1", name: "Software Engineer", category: "tech", icon: Code2, color: "text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30" },
  { id: "2", name: "Product Manager", category: "non-tech", icon: Briefcase, color: "text-amber-600 bg-amber-100 dark:text-amber-400 dark:bg-amber-900/30" },
  { id: "3", name: "Engineering Manager", category: "senior", icon: Users, color: "text-purple-600 bg-purple-100 dark:text-purple-400 dark:bg-purple-900/30" },
  { id: "4", name: "DevOps Engineer", category: "tech", icon: Code2, color: "text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30" },
  { id: "5", name: "Data Analyst", category: "tech", icon: Code2, color: "text-indigo-600 bg-indigo-100 dark:text-indigo-400 dark:bg-indigo-900/30" },
  { id: "6", name: "HR Specialist", category: "non-tech", icon: Users, color: "text-pink-600 bg-pink-100 dark:text-pink-400 dark:bg-pink-900/30" },
  { id: "7", name: "VP Engineering", category: "senior", icon: Briefcase, color: "text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30" },
  { id: "8", name: "Frontend Developer", category: "tech", icon: Code2, color: "text-cyan-600 bg-cyan-100 dark:text-cyan-400 dark:bg-cyan-900/30" },
]

const colorOptions = [
  { name: "Default", class: "bg-card" },
  { name: "Blue Tint", class: "bg-blue-50 dark:bg-blue-950/20" },
  { name: "Warm", class: "bg-amber-50 dark:bg-amber-950/20" },
  { name: "Green", class: "bg-green-50 dark:bg-green-950/20" },
]

export function TemplatesPanel() {
  const [filter, setFilter] = useState("all")
  const [selectedColor, setSelectedColor] = useState(0)

  const filteredTemplates = templates.filter(
    (t) => filter === "all" || t.category === filter
  )

  return (
    <div className="flex h-full flex-col rounded-xl border border-border bg-card">
      {/* Header */}
      <div className="border-b border-border p-4">
        <div className="flex items-center gap-2">
          <LayoutTemplate className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Templates</h2>
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Choose a template to apply
        </p>

        {/* Filter */}
        <div className="mt-3">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="h-9 text-xs">
              <Filter className="mr-2 h-3.5 w-3.5" />
              <SelectValue placeholder="Filter templates" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Templates</SelectItem>
              <SelectItem value="tech">Tech Roles</SelectItem>
              <SelectItem value="non-tech">Non-Tech Roles</SelectItem>
              <SelectItem value="senior">Senior Roles</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Templates Grid */}
      <ScrollArea className="flex-1">
        <div className="grid grid-cols-2 gap-2 p-3">
          {filteredTemplates.map((template, index) => {
            const Icon = template.icon
            return (
              <motion.button
                key={template.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.15, delay: index * 0.03 }}
                className="group flex flex-col items-center gap-2 rounded-lg border border-border bg-background p-3 text-center transition-all hover:border-primary/30 hover:shadow-sm"
              >
                <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg transition-transform group-hover:scale-110", template.color.split(" ").slice(1).join(" "))}>
                  <Icon className={cn("h-5 w-5", template.color.split(" ")[0])} />
                </div>
                <span className="text-xs font-medium text-foreground line-clamp-2">
                  {template.name}
                </span>
              </motion.button>
            )
          })}
        </div>
      </ScrollArea>

      {/* Document Theme Options */}
      <div className="border-t border-border p-4">
        <div className="flex items-center gap-2 mb-3">
          <Palette className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs font-medium text-foreground">Document Theme</span>
        </div>
        <div className="flex gap-2">
          {colorOptions.map((color, index) => (
            <button
              key={color.name}
              onClick={() => setSelectedColor(index)}
              className={cn(
                "h-8 w-8 rounded-lg border-2 transition-all",
                color.class,
                selectedColor === index
                  ? "border-primary ring-2 ring-primary/20"
                  : "border-border hover:border-muted-foreground"
              )}
              title={color.name}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
