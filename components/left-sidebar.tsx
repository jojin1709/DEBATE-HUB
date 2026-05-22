"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
  MessageSquare,
  Home,
  TrendingUp,
  Bell,
  Sparkles,
  Trophy,
  User,
  Settings,
  Plus,
  LogOut,
} from "lucide-react"
import { useClientNavigation } from "@/hooks/use-client-navigation"
import { account } from "@/lib/appwrite/client"
import { useRouter } from "next/navigation"

interface LeftSidebarProps {
  user?: any
  profile?: any
}

const sidebarNavItems = [
  { icon: Home, label: "Home", tab: "home" },
  { icon: TrendingUp, label: "Trending", tab: "trending" },
  { icon: MessageSquare, label: "My Debates", tab: "my-debates" },
  { icon: Bell, label: "Notifications", tab: "notifications" },
  { icon: Sparkles, label: "AI Insights", tab: "ai-insights" },
  { icon: Trophy, label: "Leaderboard", tab: "leaderboard" },
  { icon: User, label: "Profile", tab: "profile" },
  { icon: Settings, label: "Settings", tab: "settings" },
]

export function LeftSidebar({ user: initialUser, profile: initialProfile }: LeftSidebarProps) {
  const { activeTab, navigate } = useClientNavigation()
  const router = useRouter()
  const [user, setUser] = useState(initialUser)
  const [profile, setProfile] = useState(initialProfile)

  useEffect(() => {
    if (!initialUser) {
      const fetchUser = async () => {
        try {
          const currentUser = await account.get()
          setUser(currentUser)
          setProfile(currentUser)
        } catch (e) {
          setUser(null)
        }
      }
      fetchUser()
    }
  }, [initialUser])

  const handleLogout = async () => {
    try {
      await account.deleteSession("current")
      router.push("/auth/login")
      router.refresh()
    } catch (e) {}
  }

  const displayName = profile?.name || user?.name || "Guest"
  const initials = displayName.charAt(0).toUpperCase() || "G"

  return (
    <div className="sticky top-0 w-64 h-screen border-r border-border bg-card/50 hidden lg:flex flex-col py-6">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-3 px-6 mb-8 hover:opacity-85 transition-opacity">
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-md shadow-primary/20">
          <MessageSquare className="w-5 h-5 text-primary-foreground" />
        </div>
        <span className="text-2xl font-bold tracking-tight text-foreground">
          Debate<span className="text-primary">Hub</span>
        </span>
      </Link>

      <div className="px-4 mb-6">
        <Link href="/debates/new" className="w-full block">
          <Button className="w-full gap-2 rounded-xl h-12 text-base font-semibold shadow-md cursor-pointer hover:shadow-lg transition-all duration-200">
            <Plus className="w-5 h-5" />
            Create Debate
          </Button>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-1 px-3 flex-1 overflow-y-auto">
        {sidebarNavItems.map(({ icon: Icon, label, tab }) => {
          const isActive = activeTab === tab
          let badge: string | null = null
          if (label === "My Debates" && user) badge = "3"
          if (label === "Notifications" && user) badge = "12"
          if (label === "AI Insights") badge = "New"

          return (
            <button
              key={label}
              onClick={() => navigate(tab)}
              className={cn(
                "flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold transition-all w-full text-left cursor-pointer duration-200",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span className="flex-1">{label}</span>
              {badge && (
                <Badge
                  className={cn(
                    "text-[10px] h-5 px-1.5 rounded-full font-bold border-0 flex items-center justify-center",
                    isActive
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : badge === "New"
                      ? "bg-accent text-accent-foreground"
                      : "bg-primary text-primary-foreground"
                  )}
                >
                  {badge}
                </Badge>
              )}
            </button>
          )
        })}
      </nav>

      {/* User Profile */}
      <div className="px-4 mt-auto pt-6 border-t border-border/50">
        {user ? (
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-secondary cursor-pointer transition-colors duration-200">
              <Avatar className="w-10 h-10 border border-border shadow-sm">
                <AvatarFallback className="bg-primary/10 text-primary font-bold">{initials}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground truncate">{displayName}</p>
                <p className="text-xs font-medium text-muted-foreground">Level {profile?.level || 1} • {profile?.points || 0} pts</p>
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full gap-2 rounded-xl text-muted-foreground hover:text-destructive hover:border-destructive/30 hover:bg-destructive/5 transition-colors cursor-pointer"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="bg-secondary/50 rounded-xl p-4 border border-border">
              <h4 className="text-sm font-bold text-foreground mb-1">Join the Debate</h4>
              <p className="text-xs text-muted-foreground mb-3">Sign in to vote, comment, and earn points.</p>
              <Link href="/auth/login" className="w-full block">
                <Button className="w-full rounded-lg font-semibold shadow-sm cursor-pointer" size="sm">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
