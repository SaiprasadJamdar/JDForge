"use client"

import { useState } from "react"
import { ExternalLink, ArrowUpDown, ChevronUp, ChevronDown, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

interface Candidate {
  id: string
  name: string
  experience: string
  skills: string[]
  profileUrl: string
  matchPercent: number
  source: "LinkedIn" | "Naukri" | "Internal"
}

const candidates: Candidate[] = [
  {
    id: "1",
    name: "Rahul Sharma",
    experience: "8 years",
    skills: ["Java", "Spring Boot", "AWS", "Microservices"],
    profileUrl: "#",
    matchPercent: 94,
    source: "LinkedIn",
  },
  {
    id: "2",
    name: "Priya Patel",
    experience: "6 years",
    skills: ["Java", "Spring Boot", "Docker", "Kubernetes"],
    profileUrl: "#",
    matchPercent: 89,
    source: "LinkedIn",
  },
  {
    id: "3",
    name: "Amit Kumar",
    experience: "10 years",
    skills: ["Java", "Architecture", "AWS", "System Design"],
    profileUrl: "#",
    matchPercent: 87,
    source: "Naukri",
  },
  {
    id: "4",
    name: "Sarah Johnson",
    experience: "5 years",
    skills: ["Java", "Spring Boot", "React", "PostgreSQL"],
    profileUrl: "#",
    matchPercent: 82,
    source: "Internal",
  },
  {
    id: "5",
    name: "Vikram Singh",
    experience: "7 years",
    skills: ["Java", "Microservices", "GCP", "CI/CD"],
    profileUrl: "#",
    matchPercent: 79,
    source: "LinkedIn",
  },
  {
    id: "6",
    name: "Neha Gupta",
    experience: "4 years",
    skills: ["Java", "Spring", "MySQL", "REST APIs"],
    profileUrl: "#",
    matchPercent: 75,
    source: "Naukri",
  },
]

type SortKey = "name" | "experience" | "matchPercent"
type SortOrder = "asc" | "desc"

export function CandidateTable() {
  const [sortKey, setSortKey] = useState<SortKey>("matchPercent")
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc")

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortKey(key)
      setSortOrder("desc")
    }
  }

  const sortedCandidates = [...candidates].sort((a, b) => {
    const aVal = a[sortKey]
    const bVal = b[sortKey]
    
    if (sortKey === "experience") {
      const aYears = parseInt(aVal as string)
      const bYears = parseInt(bVal as string)
      return sortOrder === "asc" ? aYears - bYears : bYears - aYears
    }
    
    if (typeof aVal === "number" && typeof bVal === "number") {
      return sortOrder === "asc" ? aVal - bVal : bVal - aVal
    }
    
    return sortOrder === "asc"
      ? String(aVal).localeCompare(String(bVal))
      : String(bVal).localeCompare(String(aVal))
  })

  const getMatchColor = (percent: number) => {
    if (percent >= 90) return "text-green-600 dark:text-green-400"
    if (percent >= 80) return "text-primary"
    if (percent >= 70) return "text-amber-600 dark:text-amber-400"
    return "text-muted-foreground"
  }

  const getMatchBg = (percent: number) => {
    if (percent >= 90) return "bg-green-100 dark:bg-green-900/30"
    if (percent >= 80) return "bg-primary/10"
    if (percent >= 70) return "bg-amber-100 dark:bg-amber-900/30"
    return "bg-muted"
  }

  const getSourceColor = (source: string) => {
    switch (source) {
      case "LinkedIn":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
      case "Naukri":
        return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
      case "Internal":
        return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
      default:
        return "bg-muted text-muted-foreground"
    }
  }

  const SortButton = ({ columnKey, children }: { columnKey: SortKey; children: React.ReactNode }) => (
    <button
      onClick={() => handleSort(columnKey)}
      className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
    >
      {children}
      {sortKey === columnKey ? (
        sortOrder === "asc" ? (
          <ChevronUp className="h-3.5 w-3.5" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5" />
        )
      ) : (
        <ArrowUpDown className="h-3.5 w-3.5 opacity-50" />
      )}
    </button>
  )

  return (
    <Card className="border-border bg-card shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">
            Candidates
            <Badge variant="secondary" className="ml-2 text-xs">
              {candidates.length} found
            </Badge>
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-y border-border bg-muted/30">
                <th className="px-5 py-3 text-left">
                  <SortButton columnKey="name">Name</SortButton>
                </th>
                <th className="px-5 py-3 text-left">
                  <SortButton columnKey="experience">Experience</SortButton>
                </th>
                <th className="px-5 py-3 text-left">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Skills
                  </span>
                </th>
                <th className="px-5 py-3 text-left">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Source
                  </span>
                </th>
                <th className="px-5 py-3 text-left">
                  <SortButton columnKey="matchPercent">Match %</SortButton>
                </th>
                <th className="px-5 py-3 text-right">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Profile
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedCandidates.map((candidate, index) => (
                <tr
                  key={candidate.id}
                  className={cn(
                    "border-b border-border transition-colors hover:bg-muted/30",
                    index === sortedCandidates.length - 1 && "border-b-0"
                  )}
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9 border border-border">
                        <AvatarFallback className="bg-muted text-xs font-medium text-foreground">
                          {candidate.name.split(" ").map((n) => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium text-foreground">
                        {candidate.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-sm text-foreground">{candidate.experience}</span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-1">
                      {candidate.skills.slice(0, 3).map((skill) => (
                        <Badge
                          key={skill}
                          variant="secondary"
                          className="text-[10px] bg-muted/70 text-muted-foreground"
                        >
                          {skill}
                        </Badge>
                      ))}
                      {candidate.skills.length > 3 && (
                        <Badge variant="secondary" className="text-[10px] bg-muted/70 text-muted-foreground">
                          +{candidate.skills.length - 3}
                        </Badge>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <Badge className={cn("text-[10px]", getSourceColor(candidate.source))}>
                      {candidate.source}
                    </Badge>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-20">
                        <Progress
                          value={candidate.matchPercent}
                          className={cn("h-1.5", getMatchBg(candidate.matchPercent))}
                        />
                      </div>
                      <span className={cn("text-sm font-semibold tabular-nums", getMatchColor(candidate.matchPercent))}>
                        {candidate.matchPercent}%
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-primary"
                      asChild
                    >
                      <a href={candidate.profileUrl} target="_blank" rel="noopener noreferrer">
                        View
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
