"use client"

import { useState, useCallback } from "react"
import { Upload, FileText, FileAudio, FileVideo, X, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"

interface UploadedFile {
  name: string
  type: string
  size: number
}

export function UploadSection() {
  const [isDragging, setIsDragging] = useState(false)
  const [files, setFiles] = useState<UploadedFile[]>([])

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragging(true)
    } else if (e.type === "dragleave") {
      setIsDragging(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const droppedFiles = Array.from(e.dataTransfer.files).map((file) => ({
      name: file.name,
      type: file.type,
      size: file.size,
    }))
    setFiles((prev) => [...prev, ...droppedFiles])
  }, [])

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const getFileIcon = (type: string) => {
    if (type.includes("audio") || type.includes("wav") || type.includes("mp3")) {
      return FileAudio
    }
    if (type.includes("video") || type.includes("mp4")) {
      return FileVideo
    }
    return FileText
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  return (
    <Card className="overflow-hidden border-border bg-card shadow-sm">
      <CardContent className="p-0">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border bg-muted/30 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Upload className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">Upload & Process</h2>
              <p className="text-sm text-muted-foreground">
                Drop your files to generate job descriptions
              </p>
            </div>
          </div>
          <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/10">
            AI-Powered
          </Badge>
        </div>

        {/* Drop Zone */}
        <div className="p-6">
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={cn(
              "relative flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition-all duration-200",
              isDragging
                ? "border-primary bg-primary/5"
                : "border-border bg-muted/20 hover:border-primary/50 hover:bg-muted/40"
            )}
          >
            <input
              type="file"
              multiple
              accept=".txt,.pdf,.docx,.wav,.mp3,.mp4"
              className="absolute inset-0 cursor-pointer opacity-0"
              onChange={(e) => {
                const selectedFiles = Array.from(e.target.files || []).map((file) => ({
                  name: file.name,
                  type: file.type,
                  size: file.size,
                }))
                setFiles((prev) => [...prev, ...selectedFiles])
              }}
            />

            <motion.div
              animate={{ scale: isDragging ? 1.05 : 1 }}
              className="flex flex-col items-center gap-4"
            >
              <div
                className={cn(
                  "flex h-16 w-16 items-center justify-center rounded-2xl transition-colors",
                  isDragging ? "bg-primary/20" : "bg-muted"
                )}
              >
                <Upload
                  className={cn(
                    "h-8 w-8 transition-colors",
                    isDragging ? "text-primary" : "text-muted-foreground"
                  )}
                />
              </div>
              <div className="text-center">
                <p className="text-base font-medium text-foreground">
                  {isDragging ? "Drop files here" : "Drag & drop files here"}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  or click to browse
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                {[".txt", ".pdf", ".docx", ".wav", ".mp3", ".mp4"].map((ext) => (
                  <Badge
                    key={ext}
                    variant="outline"
                    className="border-border bg-background text-xs text-muted-foreground"
                  >
                    {ext}
                  </Badge>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Uploaded Files */}
          <AnimatePresence mode="popLayout">
            {files.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 space-y-2"
              >
                {files.map((file, index) => {
                  const FileIcon = getFileIcon(file.type)
                  return (
                    <motion.div
                      key={`${file.name}-${index}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-3"
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                        <FileIcon className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">
                          {file.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(file.size)}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => removeFile(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </motion.div>
                  )
                })}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Process Button */}
          <div className="mt-6">
            <Button
              className="w-full gap-2 bg-primary text-primary-foreground shadow-md hover:bg-primary/90"
              size="lg"
              disabled={files.length === 0}
            >
              <Sparkles className="h-4 w-4" />
              Upload & Process
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
