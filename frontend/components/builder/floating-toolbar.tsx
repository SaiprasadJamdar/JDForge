"use client"

import { useState, useEffect } from "react"
import { Bold, Italic, Type } from "lucide-react"

interface FloatingToolbarProps {
  isVisible: boolean
  position: { top: number; left: number }
  onBold: () => void
  onItalic: () => void
  onUnderline: () => void
}

export function FloatingToolbar({
  isVisible,
  position,
  onBold,
  onItalic,
  onUnderline,
}: FloatingToolbarProps) {
  if (!isVisible) return null

  return (
    <div
      className="fixed z-50 flex items-center gap-1 p-2 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        pointerEvents: "auto",
      }}
    >
      <button
        onMouseDown={(e) => {
          e.preventDefault()
          onBold()
        }}
        className="p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
        title="Bold"
      >
        <Bold className="w-4 h-4 text-slate-700 dark:text-slate-300" />
      </button>
      <button
        onMouseDown={(e) => {
          e.preventDefault()
          onItalic()
        }}
        className="p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
        title="Italic"
      >
        <Italic className="w-4 h-4 text-slate-700 dark:text-slate-300" />
      </button>
      <button
        onMouseDown={(e) => {
          e.preventDefault()
          onUnderline()
        }}
        className="p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
        title="Underline (U)"
      >
        <Type className="w-4 h-4 text-slate-700 dark:text-slate-300" />
      </button>
    </div>
  )
}
