"use client"

import { FileSpreadsheet, FileText, FileDown, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const exportOptions = [
  {
    id: "excel",
    label: "Export Excel",
    icon: FileSpreadsheet,
    description: "Download as .xlsx file",
    color: "text-green-600 dark:text-green-400",
  },
  {
    id: "csv",
    label: "Export CSV",
    icon: FileText,
    description: "Download as .csv file",
    color: "text-blue-600 dark:text-blue-400",
  },
  {
    id: "pdf",
    label: "Export PDF",
    icon: FileDown,
    description: "Download as .pdf report",
    color: "text-red-600 dark:text-red-400",
  },
]

export function ExportOptions() {
  const handleExport = (format: string) => {
    // Export logic would go here
    console.log(`Exporting as ${format}`)
  }

  return (
    <Card className="border-border bg-card shadow-sm">
      <CardContent className="p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">Export Results</p>
            <p className="text-xs text-muted-foreground">
              Download candidate data in your preferred format
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {exportOptions.map((option) => {
              const Icon = option.icon
              return (
                <Button
                  key={option.id}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => handleExport(option.id)}
                >
                  <Icon className={`h-4 w-4 ${option.color}`} />
                  {option.label}
                </Button>
              )
            })}

            {/* Quick Export Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="default" size="sm" className="gap-2">
                  <Download className="h-4 w-4" />
                  Quick Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {exportOptions.map((option) => {
                  const Icon = option.icon
                  return (
                    <DropdownMenuItem
                      key={option.id}
                      onClick={() => handleExport(option.id)}
                      className="gap-2"
                    >
                      <Icon className={`h-4 w-4 ${option.color}`} />
                      <div className="flex flex-col">
                        <span className="text-sm">{option.label}</span>
                        <span className="text-[10px] text-muted-foreground">
                          {option.description}
                        </span>
                      </div>
                    </DropdownMenuItem>
                  )
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
