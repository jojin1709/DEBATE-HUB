'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { useClientNavigation } from '@/hooks/use-client-navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Search, SlidersHorizontal, Sparkles, TrendingUp, Zap, Trophy, Bell, Settings, Star } from 'lucide-react'
import { DebateCardDb } from '@/components/debate-card-db'
import { DebateCardSkeleton } from '@/components/debate-card-skeleton'
import { getDebates, getCategories, type Debate } from '@/lib/actions/debates'
import { getNotifications, markAllNotificationsRead, getLeaderboard, getCurrentProfile } from '@/lib/actions/social'

function timeAgo(date: string) {
  const now = new Date()
  const then = new Date(date)
  const diff = Math.floor((now.getTime() - then.getTime()) / 1000)

  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
  return Math.floor(diff / 604800) + "w ago"
}

interface Category {
  id: string
  name: string
  slug: string
  color?: string
}

interface MainFeedDbProps {
  userId?: string
  userVotes?: Record<string, 'agree' | 'disagree'>
}

export function MainFeedDb({ userId, userVotes = {} }: MainFeedDbProps) {
  const [debates, setDebates] = useState<Debate[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)

  const { activeTab, activeCategory, setCategory } = useClientNavigation()

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const [debatesResult, categoriesResult] = await Promise.all([
          getDebates(),
          getCategories(),
        ])
        setDebates(debatesResult?.data || [])
        setCategories((categoriesResult?.data || []) as Category[])
      } catch (error) {
        console.error('[v0] Error loading debates:', error)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const filteredDebates = debates.filter((d) => {
    // Robust category matching using both ID and slug to support UUIDs and mock data slugs
    const activeCategoryObj = categories.find(
      (c) => c.id === activeCategory || c.slug === activeCategory
    )
    const activeSlug = activeCategoryObj ? activeCategoryObj.slug : activeCategory

    const matchesCategory =
      activeCategory === 'all' ||
      d.category_id === activeCategory ||
      d.category_id === activeSlug ||
      d.category?.slug === activeCategory ||
      (activeCategoryObj && d.category?.slug === activeCategoryObj.slug)

    const matchesSearch =
      searchQuery === '' ||
      d.title.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  // Process tab filtering/sorting
  let displayDebates = [...filteredDebates]
  if (activeTab === 'trending') {
    displayDebates.sort((a, b) => {
      const aVotes = a.agree_count + a.disagree_count
      const bVotes = b.agree_count + b.disagree_count
      return bVotes - aVotes || b.view_count - a.view_count
    })
  } else if (activeTab === 'my-debates') {
    const currentUserId = userId || 'mock-user-id'
    displayDebates = displayDebates.filter(
      (d) => d.author_id === currentUserId || d.author?.username === 'alex_debates'
    )
  } else if (activeTab === 'ai-insights') {
    displayDebates = displayDebates.filter((d) => d.ai_summary !== null)
  }

  const liveDebates = displayDebates.filter((d) => d.is_live)

  const handleCategoryClick = (catId: string) => {
    setCategory(catId)
  }

  return (
    <main className="flex-1 min-w-0 py-6 px-4 lg:px-6 flex flex-col gap-6 max-w-5xl w-full mx-auto">
      {/* Search Bar - only show when in main debate list views */}
      {['home', 'trending', 'my-debates', 'ai-insights'].includes(activeTab) && (
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search debates, topics, or arguments..."
              className="pl-10 h-11 rounded-xl bg-card border-border text-sm"
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            className="h-11 w-11 rounded-xl border-border flex-shrink-0"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="sr-only">Filters</span>
          </Button>
        </div>
      )}

      {/* Category Chips - only show when in main debate list views */}
      {['home', 'trending', 'my-debates', 'ai-insights'].includes(activeTab) && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
          <button
            onClick={() => handleCategoryClick('all')}
            className={cn(
              'flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-150 border',
              activeCategory === 'all'
                ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                : 'bg-card text-muted-foreground border-border hover:border-primary/40 hover:text-foreground'
            )}
          >
            All
          </button>
          {categories.map((cat) => {
            const isCatActive = activeCategory === cat.id || activeCategory === cat.slug
            return (
              <button
                key={cat.id}
                onClick={() => handleCategoryClick(cat.id)}
                className={cn(
                  'flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-150 border',
                  isCatActive
                    ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                    : 'bg-card text-muted-foreground border-border hover:border-primary/40 hover:text-foreground'
                )}
              >
                {cat.name}
              </button>
            )
          })}
        </div>
      )}

      {/* Tab Specific Content */}
      {activeTab === 'notifications' ? (
        <NotificationsView />
      ) : activeTab === 'leaderboard' ? (
        <LeaderboardView />
      ) : activeTab === 'profile' ? (
        <ProfileView userId={userId} userVotes={userVotes} debates={debates} />
      ) : activeTab === 'settings' ? (
        <SettingsView />
      ) : (
        /* Debates Feed Column */
        <>
          {/* Live Debates Banner */}
          {liveDebates.length > 0 && activeCategory === 'all' && searchQuery === '' && (
            <div className="bg-live/8 border border-live/20 rounded-2xl p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-live/15 flex items-center justify-center flex-shrink-0">
                <Zap className="w-4.5 h-4.5 text-live" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-live animate-pulse" />
                  {liveDebates.length} debates happening live right now
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Join and cast your vote in real-time
                </p>
              </div>
              <Button size="sm" className="flex-shrink-0 rounded-xl text-xs font-semibold">
                View Live
              </Button>
            </div>
          )}

          {/* AI Insights Banner */}
          {activeCategory === 'all' && searchQuery === '' && debates.length > 0 && activeTab === 'home' && (
            <div className="bg-primary/5 border border-primary/15 rounded-2xl p-4 flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-4.5 h-4.5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-primary">Daily AI Insight</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Currently, <span className="font-medium text-foreground">{debates.length} debates</span> are active on
                  DebateHub. Engage with your community and explore diverse perspectives on
                  trending topics.
                </p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 cursor-pointer hover:bg-primary/20 transition-colors">
                <TrendingUp className="w-4 h-4 text-primary" />
              </div>
            </div>
          )}

          {/* Feed Label */}
          <div className="flex items-center justify-between -mb-2">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              {activeCategory === 'all'
                ? activeTab === 'trending'
                  ? 'Trending Debates'
                  : activeTab === 'my-debates'
                  ? 'My Debates'
                  : activeTab === 'ai-insights'
                  ? 'AI Moderated Debates'
                  : 'All Debates'
                : `${
                    categories.find((c) => c.id === activeCategory || c.slug === activeCategory)?.name ||
                    'Debates'
                  }`}
              {displayDebates.length > 0 && (
                <span className="ml-2 text-xs font-normal normal-case">
                  ({displayDebates.length})
                </span>
              )}
            </h2>
            <button className="text-xs text-primary font-medium hover:underline">
              Sort: Latest
            </button>
          </div>

          {/* Debate Cards */}
          {loading ? (
            <div className="flex flex-col gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <DebateCardSkeleton key={i} />
              ))}
            </div>
          ) : displayDebates.length === 0 ? (
            <EmptyState query={searchQuery} />
          ) : (
            <div className="flex flex-col gap-4">
              {displayDebates.map((debate) => (
                <DebateCardDb
                  key={debate.id}
                  debate={debate}
                  userVote={
                    userVotes[debate.id]
                      ? {
                          debate_id: debate.id,
                          vote_type: userVotes[debate.id] as "agree" | "disagree",
                        }
                      : null
                  }
                  userId={userId}
                />
              ))}
            </div>
          )}
        </>
      )}
    </main>
  )
}

function EmptyState({ query }: { query: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
      <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center">
        <Search className="w-7 h-7 text-muted-foreground" />
      </div>
      <div>
        <p className="font-semibold text-foreground">No debates found</p>
        <p className="text-sm text-muted-foreground mt-1">
          {query
            ? `No debates match "${query}"`
            : 'There are no debates yet. Be the first to start one!'}
        </p>
      </div>
      <Link href="/debates/new">
        <Button variant="outline" size="sm" className="rounded-xl">
          Start a Debate
        </Button>
      </Link>
    </div>
  )
}

/* Sub-views rendered inside the main feed container */

function NotificationsView() {
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const loadNotifications = async () => {
    try {
      setLoading(true)
      const response = await getNotifications()
      setNotifications(response.data || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadNotifications()
  }, [])

  const markAllRead = async () => {
    try {
      await markAllNotificationsRead()
      setNotifications(notifications.map(n => ({ ...n, is_read: true })))
    } catch (e) {
      console.error(e)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <h2 className="text-xl font-bold tracking-tight text-foreground animate-pulse">Loading Notifications...</h2>
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 rounded-2xl bg-secondary animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Bell className="w-5 h-5 text-primary" />
          Notifications
        </h2>
        {notifications.length > 0 && (
          <Button variant="ghost" size="sm" onClick={markAllRead} className="text-xs text-primary font-semibold">
            Mark all as read
          </Button>
        )}
      </div>
      {notifications.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-8 text-center flex flex-col items-center justify-center gap-2">
          <Bell className="w-8 h-8 text-muted-foreground opacity-55" />
          <p className="font-semibold text-sm text-foreground">No new notifications</p>
          <p className="text-xs text-muted-foreground">You are all caught up!</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              className={cn(
                "p-4 rounded-2xl border transition-all flex items-start gap-3",
                notif.is_read ? "bg-card border-border/65" : "bg-primary/5 border-primary/20 shadow-sm"
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5",
                notif.is_read ? "bg-secondary text-muted-foreground" : "bg-primary/10 text-primary"
              )}>
                {notif.type === 'vote' ? <Zap className="w-4 h-4" /> : notif.type === 'reply' ? <Sparkles className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn("text-sm", notif.is_read ? "text-muted-foreground font-medium" : "text-foreground font-semibold")}>
                  {notif.content}
                </p>
                <span className="text-xs text-muted-foreground mt-1 block">{timeAgo(notif.created_at)}</span>
              </div>
              {!notif.is_read && <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2.5" />}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function LeaderboardView() {
  const [topUsers, setTopUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadLeaderboard = async () => {
      try {
        setLoading(true)
        const data = await getLeaderboard()
        setTopUsers(data)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    loadLeaderboard()
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <h2 className="text-xl font-bold tracking-tight text-foreground animate-pulse">Loading Leaderboard...</h2>
        <div className="bg-card border border-border rounded-2xl h-48 animate-pulse" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
        <Trophy className="w-5 h-5 text-primary" />
        Global Leaderboard
      </h2>
      <p className="text-xs text-muted-foreground -mt-2 leading-relaxed">
        Top contributors who earn points by starting engaging debates and writing highly upvoted, civil arguments.
      </p>
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm mt-1">
        <div className="flex border-b border-border bg-muted/30 px-4 py-2.5 text-xs font-bold text-muted-foreground uppercase tracking-wider">
          <div className="w-12">Rank</div>
          <div className="flex-1">Debater</div>
          <div className="w-24 text-right">Points</div>
          <div className="w-20 text-right">Level</div>
        </div>
        {topUsers.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted-foreground">No contributors yet.</div>
        ) : (
          <div className="divide-y divide-border/60">
            {topUsers.map((user, idx) => (
              <div key={user.id} className="flex items-center px-4 py-3.5 text-sm hover:bg-secondary/40 transition-colors">
                <div className="w-12 font-extrabold text-foreground flex items-center">
                  {idx === 0 ? <span className="text-base">🏆</span> : idx === 1 ? <span className="text-base">🥈</span> : idx === 2 ? <span className="text-base">🥉</span> : idx + 1}
                </div>
                <div className="flex-1 font-semibold text-foreground flex items-center gap-2">
                  {user.display_name || user.username}
                  <Badge className="text-[10px] px-1.5 py-0 rounded-full font-medium bg-primary/10 text-primary border-0">
                    {user.points > 1000 ? "Champion" : user.points > 500 ? "Expert" : "Pro"}
                  </Badge>
                </div>
                <div className="w-24 text-right font-medium text-foreground">{user.points.toLocaleString()}</div>
                <div className="w-20 text-right font-semibold text-primary">Lvl {user.level || 1}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function ProfileView({ userId, userVotes, debates }: { userId?: string; userVotes: any; debates: Debate[] }) {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadProfile = async () => {
      try {
        setLoading(true)
        const p = await getCurrentProfile()
        setProfile(p)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    loadProfile()
  }, [])

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-2xl p-5 h-48 animate-pulse" />
    )
  }

  const debatesCreated = debates.filter(d => d.author_id === profile?.id || d.author?.username === profile?.username)
  const totalVotesCast = Object.keys(userVotes).length

  return (
    <div className="flex flex-col gap-6">
      {/* Profile Card */}
      <div className="bg-card border border-border rounded-2xl p-5 flex flex-col gap-4 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-full pointer-events-none" />
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary text-xl font-bold border border-primary/20">
            {profile?.display_name?.charAt(0).toUpperCase() || profile?.username?.charAt(0).toUpperCase() || "D"}
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">{profile?.display_name || profile?.username || "Guest Debater"}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">@{profile?.username || "guest"}</p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          {profile?.bio || "No bio added yet. Edit your profile to share your perspectives!"}
        </p>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 border-t border-border pt-4 mt-1">
          <div className="text-center p-2 bg-muted/40 rounded-xl">
            <span className="block text-base font-bold text-foreground">{debatesCreated.length}</span>
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wide">Debates</span>
          </div>
          <div className="text-center p-2 bg-muted/40 rounded-xl">
            <span className="block text-base font-bold text-foreground">{totalVotesCast}</span>
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wide">Votes</span>
          </div>
          <div className="text-center p-2 bg-muted/40 rounded-xl">
            <span className="block text-base font-bold text-foreground">{profile?.points || 0}</span>
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wide">Points</span>
          </div>
        </div>
      </div>

      {/* Debates Authored */}
      <div className="flex flex-col gap-3">
        <h4 className="text-sm font-bold text-muted-foreground uppercase tracking-wide">My Debates</h4>
        {debatesCreated.length === 0 ? (
          <div className="text-center py-8 bg-card border border-border border-dashed rounded-2xl text-xs text-muted-foreground">
            You haven't created any debates yet.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {debatesCreated.map(debate => (
              <DebateCardDb key={debate.id} debate={debate} userVote={userVotes[debate.id] ? { debate_id: debate.id, vote_type: userVotes[debate.id] as "agree" | "disagree" } : null} userId={profile?.id} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function SettingsView() {
  const [darkMode, setDarkMode] = useState(false)
  const [anonMode, setAnonMode] = useState(true)
  const [aiFiltering, setAiFiltering] = useState(true)
  const [emailAlerts, setEmailAlerts] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isDark = document.documentElement.classList.contains('dark')
      setDarkMode(isDark)
      setAnonMode(localStorage.getItem('anonMode') !== 'false')
      setAiFiltering(localStorage.getItem('aiFiltering') !== 'false')
      setEmailAlerts(localStorage.getItem('emailAlerts') === 'true')
    }
  }, [])

  const handleDarkModeChange = (checked: boolean) => {
    setDarkMode(checked)
    if (checked) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  const handleSaveSetting = (key: string, val: boolean, setter: (v: boolean) => void) => {
    setter(val)
    localStorage.setItem(key, val.toString())
  }

  return (
    <div className="flex flex-col gap-5">
      <h2 className="text-xl font-bold tracking-tight text-foreground">Account Settings</h2>
      
      <div className="bg-card border border-border rounded-2xl p-5 flex flex-col gap-5 shadow-sm">
        {/* Dark Mode */}
        <div className="flex items-center justify-between pb-4 border-b border-border/60">
          <div>
            <p className="text-sm font-semibold text-foreground">Dark Interface Theme</p>
            <p className="text-xs text-muted-foreground mt-0.5">Toggle interface colors between light and dark</p>
          </div>
          <button
            onClick={() => handleDarkModeChange(!darkMode)}
            className={cn(
              "w-12 h-6.5 rounded-full p-1 transition-colors duration-200 focus:outline-none flex items-center",
              darkMode ? "bg-primary justify-end border border-primary/20" : "bg-muted border border-border justify-start"
            )}
          >
            <span className="w-4.5 h-4.5 rounded-full bg-card shadow-sm flex items-center justify-center text-[10px]">
              {darkMode ? "🌙" : "☀️"}
            </span>
          </button>
        </div>

        {/* Anonymous Posting */}
        <div className="flex items-center justify-between pb-4 border-b border-border/60">
          <div>
            <p className="text-sm font-semibold text-foreground">Default Anonymous Posting</p>
            <p className="text-xs text-muted-foreground mt-0.5">Hide your display name when posting new debates</p>
          </div>
          <button
            onClick={() => handleSaveSetting('anonMode', !anonMode, setAnonMode)}
            className={cn(
              "w-12 h-6.5 rounded-full p-1 transition-colors duration-200 focus:outline-none flex items-center",
              anonMode ? "bg-primary justify-end border border-primary/20" : "bg-muted border border-border justify-start"
            )}
          >
            <span className="w-4.5 h-4.5 rounded-full bg-card shadow-sm" />
          </button>
        </div>

        {/* AI Content Guard */}
        <div className="flex items-center justify-between pb-4 border-b border-border/60">
          <div>
            <p className="text-sm font-semibold text-foreground">AI Civil Moderation Guard</p>
            <p className="text-xs text-muted-foreground mt-0.5">Enable real-time AI warnings for uncivil writing</p>
          </div>
          <button
            onClick={() => handleSaveSetting('aiFiltering', !aiFiltering, setAiFiltering)}
            className={cn(
              "w-12 h-6.5 rounded-full p-1 transition-colors duration-200 focus:outline-none flex items-center",
              aiFiltering ? "bg-primary justify-end border border-primary/20" : "bg-muted border border-border justify-start"
            )}
          >
            <span className="w-4.5 h-4.5 rounded-full bg-card shadow-sm" />
          </button>
        </div>

        {/* Email Alerts */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-foreground">Email Notifications</p>
            <p className="text-xs text-muted-foreground mt-0.5">Receive digests of comments on your debates</p>
          </div>
          <button
            onClick={() => handleSaveSetting('emailAlerts', !emailAlerts, setEmailAlerts)}
            className={cn(
              "w-12 h-6.5 rounded-full p-1 transition-colors duration-200 focus:outline-none flex items-center",
              emailAlerts ? "bg-primary justify-end border border-primary/20" : "bg-muted border border-border justify-start"
            )}
          >
            <span className="w-4.5 h-4.5 rounded-full bg-card shadow-sm" />
          </button>
        </div>
      </div>
    </div>
  )
}

