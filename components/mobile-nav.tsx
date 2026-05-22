"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
  Menu,
  MessageSquare,
  Home,
  TrendingUp,
  Bell,
  Sparkles,
  Trophy,
  User,
  Settings,
  Plus,
  ChevronRight,
  LogOut,
} from "lucide-react"
import { useClientNavigation } from "@/hooks/use-client-navigation"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

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

export function MobileNav() {
  const { activeTab, navigate } = useClientNavigation()
  const [open, setOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      setUser(currentUser)
      if (currentUser) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", currentUser.id)
          .single()
        setProfile(profileData)
      }
    }
    fetchUser()
  }, [supabase])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setOpen(false)
    router.push("/auth/login")
  }

  const displayName = profile?.display_name || user?.email?.split("@")[0] || "Guest"
  const initials = displayName.charAt(0).toUpperCase() || "G"

  return (
    <>
      {/* Top Header */}
      <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-card/85 backdrop-blur-md border-b border-border/80 flex items-center justify-between px-4 md:hidden">
        <Link href="/" className="flex items-center gap-2 hover:opacity-85 transition-opacity">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
            <MessageSquare className="w-3.5 h-3.5 text-primary-foreground" />
          </div>
          <span className="text-base font-bold tracking-tight text-foreground">
            Debate<span className="text-primary">Hub</span>
          </span>
        </Link>

        <div className="flex items-center gap-1.5">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button size="icon" variant="ghost" className="w-9 h-9 rounded-xl hover:bg-secondary">
                <Menu className="w-5 h-5" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0 bg-card border-r border-border">
              <div className="flex flex-col h-full py-5 px-3 gap-2">
                {/* Logo */}
                <Link href="/" onClick={() => setOpen(false)} className="flex items-center gap-2.5 px-3 mb-4 hover:opacity-85 transition-opacity">
                  <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                    <MessageSquare className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <span className="text-xl font-bold tracking-tight">
                    Debate<span className="text-primary">Hub</span>
                  </span>
                </Link>

                <Link href="/debates/new" onClick={() => setOpen(false)} className="w-full">
                  <Button className="w-full mx-0 mb-3 gap-2 rounded-xl font-semibold cursor-pointer" size="lg">
                    <Plus className="w-4 h-4" />
                    Create Debate
                  </Button>
                </Link>

                <nav className="flex flex-col gap-0.5 flex-1">
                  {sidebarNavItems.map(({ icon: Icon, label, tab }) => {
                    const isActive = activeTab === tab
                    let badge: string | null = null
                    if (label === "My Debates" && user) badge = "3"
                    if (label === "Notifications" && user) badge = "12"
                    if (label === "AI Insights") badge = "New"

                    return (
                      <button
                        key={label}
                        onClick={() => {
                          setOpen(false)
                          navigate(tab)
                        }}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 w-full text-left cursor-pointer",
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
                              "text-[10px] h-5 px-1.5 rounded-full font-semibold border-0",
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

                <div className="mt-auto pt-4 border-t border-border">
                  {user ? (
                    <>
                      <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-secondary cursor-pointer">
                        <Avatar className="w-9 h-9">
                          <AvatarImage src={profile?.avatar_url || undefined} />
                          <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">{displayName}</p>
                          <p className="text-xs text-muted-foreground">Level {profile?.level || 1} · {profile?.points || 0} pts</p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-3 gap-2 rounded-xl cursor-pointer"
                        onClick={handleLogout}
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </Button>
                    </>
                  ) : (
                    <Button
                      className="w-full rounded-xl font-semibold cursor-pointer"
                      onClick={() => {
                        setOpen(false)
                        router.push("/auth/login")
                      }}
                    >
                      Sign In
                    </Button>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* Bottom Sticky Mobile Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 h-16 bg-card/90 backdrop-blur-lg border-t border-border/80 flex items-center justify-around px-4 md:hidden pb-safe shadow-lg">
        {/* Home */}
        <button
          onClick={() => navigate("home")}
          className={cn(
            "flex flex-col items-center justify-center flex-1 h-full py-2 gap-1 cursor-pointer transition-colors",
            activeTab === "home" ? "text-primary" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] font-bold">Home</span>
        </button>

        {/* Trending */}
        <button
          onClick={() => navigate("trending")}
          className={cn(
            "flex flex-col items-center justify-center flex-1 h-full py-2 gap-1 cursor-pointer transition-colors",
            activeTab === "trending" ? "text-primary" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <TrendingUp className="w-5 h-5" />
          <span className="text-[10px] font-bold">Trending</span>
        </button>

        {/* Create (Floating prominent button) */}
        <div className="flex flex-col items-center justify-center flex-1 h-full relative">
          <Link href="/debates/new" className="-translate-y-3.5 shadow-md hover:shadow-lg transition-transform duration-200">
            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground hover:scale-105 transition-transform active:scale-95">
              <Plus className="w-6 h-6" />
            </div>
          </Link>
          <span className="text-[10px] font-bold text-muted-foreground absolute bottom-2">Create</span>
        </div>

        {/* Notifications */}
        <button
          onClick={() => navigate("notifications")}
          className={cn(
            "flex flex-col items-center justify-center flex-1 h-full py-2 gap-1 cursor-pointer transition-colors relative",
            activeTab === "notifications" ? "text-primary" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Bell className="w-5 h-5" />
          <span className="text-[10px] font-bold">Alerts</span>
          {user && (
            <span className="absolute top-2 right-6 w-2 h-2 rounded-full bg-primary" />
          )}
        </button>

        {/* Profile */}
        <button
          onClick={() => navigate("profile")}
          className={cn(
            "flex flex-col items-center justify-center flex-1 h-full py-2 gap-1 cursor-pointer transition-colors",
            activeTab === "profile" ? "text-primary" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <User className="w-5 h-5" />
          <span className="text-[10px] font-bold">Profile</span>
        </button>
      </nav>
    </>
  )
}
