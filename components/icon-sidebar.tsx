"use client"

import Link from "next/link"
import { useClientNavigation } from "@/hooks/use-client-navigation"
import {
  Home,
  TrendingUp,
  MessageSquare,
  Bell,
  Sparkles,
  Trophy,
  User,
  Settings,
  Plus,
} from "lucide-react"

const icons = [
  { Icon: Home, label: "Home", href: "/?tab=home" },
  { Icon: TrendingUp, label: "Trending", href: "/?tab=trending" },
  { Icon: MessageSquare, label: "My Debates", href: "/?tab=my-debates" },
  { Icon: Bell, label: "Notifications", href: "/?tab=notifications" },
  { Icon: Sparkles, label: "AI Insights", href: "/?tab=ai-insights" },
  { Icon: Trophy, label: "Leaderboard", href: "/?tab=leaderboard" },
  { Icon: User, label: "Profile", href: "/?tab=profile" },
  { Icon: Settings, label: "Settings", href: "/?tab=settings" },
]

export function IconSidebar() {
  const { activeTab, navigate } = useClientNavigation()

  return (
    <aside className="flex flex-col items-center h-full bg-card border-r border-border py-5 gap-1 sticky top-0">
      {/* Logo icon */}
      <Link href="/" className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center mb-4 flex-shrink-0">
        <MessageSquare className="w-4 h-4 text-primary-foreground" />
      </Link>

      {/* Create button */}
      <Link href="/debates/new" title="Create Debate">
        <button
          className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3 hover:bg-primary hover:text-primary-foreground transition-colors flex-shrink-0"
        >
          <Plus className="w-5 h-5" />
        </button>
      </Link>

      {/* Nav icons */}
      {icons.map(({ Icon, label, href }) => {
        const tabKey = href.split("tab=")[1] || "home"
        const isActive = activeTab === tabKey
        return (
          <Link
            key={label}
            href={href}
            title={label}
            onClick={(e) => {
              if (window.location.pathname === "/") {
                e.preventDefault()
                navigate(tabKey)
              }
            }}
            className={cn(
              "w-9 h-9 rounded-xl flex items-center justify-center transition-colors flex-shrink-0",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            )}
          >
            <Icon className="w-5 h-5" />
          </Link>
        )
      })}
    </aside>
  )
}

// Helper utility inline or from imports
import { cn } from "@/lib/utils"

