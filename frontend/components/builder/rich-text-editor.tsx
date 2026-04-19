"use client"

import { useState, useRef } from "react"
import { Bold, Italic, Type } from "lucide-react"

interface RichTextEditorProps {
  content: string
  onChange: (content: string) => void
  readOnly?: boolean
}

export function RichTextEditor({ content, onChange, readOnly = false }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const [selectedText, setSelectedText] = useState("")

  const handleTextSelection = () => {
    const selection = window.getSelection()
    if (selection && selection.toString()) {
      setSelectedText(selection.toString())
    }
  }

  const applyFormatting = (tag: "b" | "i" | "u") => {
    const selection = window.getSelection()
    if (!selection || !selection.rangeCount || selection.toString().length === 0) {
      alert("Please select text first")
      return
    }

    const range = selection.getRangeAt(0)
    const span = document.createElement(tag)
    
    try {
      range.surroundContents(span)
      onChange(editorRef.current?.innerHTML || "")
    } catch (e) {
      // Fallback for complex selections
      const fragment = range.extractContents()
      const span = document.createElement(tag)
      span.appendChild(fragment)
      range.insertNode(span)
      onChange(editorRef.current?.innerHTML || "")
    }

    selection.removeAllRanges()
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    if (readOnly) return
    e.preventDefault()
    const text = e.clipboardData?.getData("text/plain") || ""
    document.execCommand("insertText", false, text)
  }

  return (
    <div className="space-y-3">
      {/* Formatting Toolbar */}
      <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400 mr-2">Select text to format:</span>
        <button
          onClick={() => applyFormatting("b")}
          className="p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          title="Bold (B)"
        >
          <Bold className="w-4 h-4 text-slate-600 dark:text-slate-300" />
        </button>
        <button
          onClick={() => applyFormatting("i")}
          className="p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          title="Italic (I)"
        >
          <Italic className="w-4 h-4 text-slate-600 dark:text-slate-300" />
        </button>
        <button
          onClick={() => applyFormatting("u")}
          className="p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          title="Underline (U)"
        >
          <Type className="w-4 h-4 text-slate-600 dark:text-slate-300" />
        </button>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable={!readOnly}
        onMouseUp={handleTextSelection}
        onKeyUp={handleTextSelection}
        onInput={(e) => onChange((e.currentTarget as HTMLDivElement).innerHTML)}
        onPaste={handlePaste}
        suppressContentEditableWarning
        className="min-h-[200px] p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 dark:text-slate-300 leading-relaxed"
        style={{ whiteSpace: "pre-wrap", wordWrap: "break-word" }}
      >
        {content}
      </div>

      {/* Selected Text Indicator */}
      {selectedText && (
        <div className="text-xs text-slate-500 dark:text-slate-400">
          Selected: "{selectedText.substring(0, 50)}{selectedText.length > 50 ? "..." : ""}"
        </div>
      )}
    </div>
  )
}
