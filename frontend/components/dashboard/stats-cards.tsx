"use client"

import { FileText, Users, Clock, TrendingUp } from "lucide-react"
import { motion } from "framer-motion"

const stats = [
  {
    label: "Total JDs",
    value: "24",
    change: "+12%",
    trend: "up",
    icon: FileText,
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    label: "Candidates Sourced",
    value: "156",
    change: "+8%",
    trend: "up",
    icon: Users,
    color: "text-green-600 dark:text-green-400",
    bg: "bg-green-100 dark:bg-green-900/30",
  },
  {
    label: "Avg. Processing Time",
    value: "2.4m",
    change: "-18%",
    trend: "down",
    icon: Clock,
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-100 dark:bg-amber-900/30",
  },
  {
    label: "Match Rate",
    value: "87%",
    change: "+5%",
    trend: "up",
    icon: TrendingUp,
    color: "text-indigo-600 dark:text-indigo-400",
    bg: "bg-indigo-100 dark:bg-indigo-900/30",
  },
]

export function StatsCards() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon
        return (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="group rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:shadow-md hover:border-primary/20"
          >
            <div className="flex items-center justify-between">
              <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${stat.bg}`}>
                <Icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <span
                className={`text-xs font-medium ${
                  stat.trend === "up"
                    ? "text-green-600 dark:text-green-400"
                    : "text-amber-600 dark:text-amber-400"
                }`}
              >
                {stat.change}
              </span>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-bold tracking-tight text-foreground">
                {stat.value}
              </p>
              <p className="mt-0.5 text-sm text-muted-foreground">{stat.label}</p>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
