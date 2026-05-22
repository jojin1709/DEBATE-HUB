"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
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
  ChevronRight,
  LogOut,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useClientNavigation } from "@/hooks/use-client-navigation"

interface LeftSidebarProps {
  user?: { id: string; email?: string; user_metadata?: { display_name?: string } } | null
  profile?: { display_name?: string; points?: number; level?: number; avatar_url?: string | null } | null
}

const navItems = [
  { icon: Home, label: "Home", href: "/?tab=home", badge: null },
  { icon: TrendingUp, label: "Trending", href: "/?tab=trending", badge: null },
  { icon: MessageSquare, label: "My Debates", href: "/?tab=my-debates", badge: "3" },
  { icon: Bell, label: "Notifications", href: "/?tab=notifications", badge: "12" },
  { icon: Sparkles, label: "AI Insights", href: "/?tab=ai-insights", badge: "New" },
  { icon: Trophy, label: "Leaderboard", href: "/?tab=leaderboard", badge: null },
  { icon: User, label: "Profile", href: "/?tab=profile", badge: null },
  { icon: Settings, label: "Settings", href: "/?tab=settings", badge: null },
]

export function LeftSidebar({ user, profile }: LeftSidebarProps) {
  const { activeTab, navigate } = useClientNavigation()
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/auth/login")
  }

  const handleLoginClick = () => {
    router.push("/auth/login")
  }

  const displayName = profile?.display_name || user?.user_metadata?.display_name || "Guest"
  const initials = displayName.split(" ").map(n => n[0]).join("").toUpperCase() || "G"

  return (
    <aside className="flex flex-col h-full w-64 bg-card border-r border-border px-3 py-5 gap-2 sticky top-0">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2.5 px-3 mb-4 hover:opacity-80 transition-opacity">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
          <MessageSquare className="w-4 h-4 text-primary-foreground" />
        </div>
        <span className="text-xl font-bold text-foreground tracking-tight">
          Debate<span className="text-primary">Hub</span>
        </span>
      </Link>

      {/* Create Debate Button */}
      <Button
        className="mx-1 mb-3 gap-2 rounded-xl font-semibold shadow-sm"
        size="lg"
        onClick={() => user ? router.push("/debates/new") : handleLoginClick()}
      >
        <Plus className="w-4 h-4" />
        Create Debate
      </Button>

      {/* Navigation */}
      <nav className="flex flex-col gap-0.5 flex-1">
        {navItems.map(({ icon: Icon, label, href }) => {
          const tabKey = href.split("tab=")[1] || "home"
          const isActive = activeTab === tabKey
          // Get dynamic badges from user metadata or custom settings
          let badge: string | null = null
          if (label === "My Debates" && user) badge = "3"
          if (label === "Notifications" && user) badge = "12"
          if (label === "AI Insights") badge = "New"

          return (
            <Link
              key={label}
              href={href}
              onClick={(e) => {
                if (window.location.pathname === "/") {
                  e.preventDefault()
                  navigate(tabKey)
                }
              }}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group w-full text-left",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <Icon
                className={cn(
                  "w-5 h-5 flex-shrink-0",
                  isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"
                )}
              />
              <span className="flex-1">{label}</span>
              {badge && (
                <Badge
                  variant={isActive ? "secondary" : "default"}
                  className={cn(
                    "text-[10px] h-5 px-1.5 rounded-full font-semibold",
                    isActive
                      ? "bg-primary-foreground/20 text-primary-foreground border-0"
                      : badge === "New"
                      ? "bg-accent text-accent-foreground border-0"
                      : "bg-primary text-primary-foreground border-0"
                  )}
                >
                  {badge}
                </Badge>
              )}
              {!badge && !isActive && (
                <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-50 transition-opacity" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* User Profile */}
      <div className="mt-auto pt-4 border-t border-border">
        {user ? (
          <>
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-secondary transition-colors cursor-pointer group">
              <Avatar className="w-9 h-9 flex-shrink-0">
                <AvatarImage src={profile?.avatar_url || undefined} alt="User avatar" />
                <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{displayName}</p>
                <p className="text-xs text-muted-foreground">Level {profile?.level ?? 1} · {profile?.points ?? 0} pts</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full mt-3 gap-2 rounded-lg"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          </>
        ) : (
          <Button
            className="w-full rounded-xl font-semibold"
            onClick={handleLoginClick}
          >
            Sign In
          </Button>
        )}
      </div>
    </aside>
  )
}
