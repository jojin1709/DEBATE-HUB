"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  TrendingUp,
  Trophy,
  Sparkles,
  ShieldCheck,
  Hash,
  ArrowRight,
  Flame,
  Star,
  Loader2,
} from "lucide-react"
import { getTrendingDebates, getTrendingTopics, getTopContributors } from "@/lib/actions/debates"

const moderationStats = [
  { label: "Active moderations", value: "124", color: "text-primary" },
  { label: "Removed today", value: "18", color: "text-muted-foreground" },
  { label: "AI accuracy", value: "98.4%", color: "text-agree" },
]

function formatNumber(n: number) {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "k"
  return n.toString()
}

export function RightSidebar() {
  const [trendingDebates, setTrendingDebates] = useState<any[]>([])
  const [trendingTopics, setTrendingTopics] = useState<any[]>([])
  const [topContributors, setTopContributors] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadSidebarData = async () => {
      try {
        setLoading(true)
        const [debatesRes, topicsRes, contributorsRes] = await Promise.all([
          getTrendingDebates(4),
          getTrendingTopics(),
          getTopContributors(5),
        ])
        setTrendingDebates(debatesRes?.data || [])
        setTrendingTopics(topicsRes?.data || [])
        setTopContributors(contributorsRes?.data || [])
      } catch (error) {
        console.error("[v0] Sidebar data load error:", error)
      } finally {
        setLoading(false)
      }
    }
    loadSidebarData()
  }, [])

  return (
    <aside className="flex flex-col w-72 gap-4 sticky top-6 py-6 pr-4 overflow-y-auto max-h-screen scrollbar-hide">
      {/* Trending Debates */}
      <section className="bg-card rounded-2xl border border-border p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            Trending
          </h3>
          <Link href="/" className="text-xs text-primary font-medium hover:underline">See all</Link>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center py-6 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            <span className="text-xs">Loading...</span>
          </div>
        ) : trendingDebates.length === 0 ? (
          <p className="text-xs text-muted-foreground py-2 text-center">No active debates</p>
        ) : (
          <div className="flex flex-col gap-3">
            {trendingDebates.map((debate, i) => {
              const categoryName = debate.category?.name ?? "Topic"
              const totalVotes = debate.agree_count + debate.disagree_count
              return (
                <Link
                  key={debate.id}
                  href={`/debates/${debate.id}`}
                  className="flex gap-3 cursor-pointer group"
                >
                  <span className="text-lg font-bold text-border group-hover:text-primary transition-colors w-5 flex-shrink-0 leading-none pt-0.5">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-[10px] font-semibold text-muted-foreground">{categoryName}</span>
                      {debate.is_live && (
                        <Flame className="w-3 h-3 text-orange-500 animate-pulse" />
                      )}
                    </div>
                    <p className="text-xs text-foreground font-medium leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                      {debate.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[11px] text-muted-foreground">{formatNumber(totalVotes)} votes</span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </section>

      {/* Top Contributors */}
      <section className="bg-card rounded-2xl border border-border p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-500" />
            Top Contributors
          </h3>
          <Link href="/" className="text-xs text-primary font-medium hover:underline">Full board</Link>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-6 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            <span className="text-xs">Loading...</span>
          </div>
        ) : topContributors.length === 0 ? (
          <p className="text-xs text-muted-foreground py-2 text-center">No contributors yet</p>
        ) : (
          <div className="flex flex-col gap-2.5">
            {topContributors.map((user, i) => {
              const rank = i + 1
              const initials = user.display_name?.split(" ").map((n: string) => n[0]).join("").toUpperCase() || "U"
              const badgeText = rank === 1 ? "Champion" : rank <= 3 ? "Expert" : "Pro"
              const colorClass = rank === 1 ? "bg-amber-500" : rank === 2 ? "bg-slate-400" : rank === 3 ? "bg-orange-400" : "bg-sky-500"
              
              return (
                <div key={user.id} className="flex items-center gap-3 group cursor-pointer">
                  <span
                    className={cn(
                      "text-xs font-bold w-5 text-center flex-shrink-0",
                      rank === 1 ? "text-amber-500" :
                      rank === 2 ? "text-slate-400" :
                      rank === 3 ? "text-orange-400" :
                      "text-muted-foreground"
                    )}
                  >
                    {rank === 1 ? <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500 mx-auto" /> : rank}
                  </span>
                  <Avatar className="w-7 h-7 flex-shrink-0">
                    <AvatarFallback className={cn("text-[10px] font-bold text-white", colorClass)}>
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                      {user.display_name || user.username}
                    </p>
                    <p className="text-[11px] text-muted-foreground">{formatNumber(user.points)} pts</p>
                  </div>
                  <Badge
                    variant="secondary"
                    className={cn(
                      "text-[10px] px-1.5 py-0 h-4 rounded-full border-0 font-medium flex-shrink-0",
                      badgeText === "Champion" ? "bg-amber-100 text-amber-700" :
                      badgeText === "Expert" ? "bg-blue-100 text-blue-700" :
                      "bg-teal-100 text-teal-700"
                    )}
                  >
                    {badgeText}
                  </Badge>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* AI Moderation Status */}
      <section className="bg-card rounded-2xl border border-border p-4 flex flex-col gap-3">
        <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-agree" />
          AI Moderation
        </h3>
        <div className="flex flex-col gap-2">
          {moderationStats.map((stat) => (
            <div key={stat.label} className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{stat.label}</span>
              <span className={cn("text-xs font-semibold", stat.color)}>{stat.value}</span>
            </div>
          ))}
        </div>
        <div className="bg-agree/10 rounded-xl p-2.5 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-agree animate-pulse flex-shrink-0" />
          <span className="text-[11px] text-agree font-medium">All systems operational</span>
        </div>
      </section>

      {/* Trending Topics */}
      <section className="bg-card rounded-2xl border border-border p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm text-foreground flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            Trending Topics
          </h3>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center py-6 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            <span className="text-xs">Loading...</span>
          </div>
        ) : trendingTopics.length === 0 ? (
          <p className="text-xs text-muted-foreground py-2 text-center">No topics trending</p>
        ) : (
          <>
            <div className="flex flex-wrap gap-1.5">
              {trendingTopics.map((topic) => (
                <button
                  key={topic.id}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-secondary text-secondary-foreground hover:bg-primary/10 hover:text-primary border border-transparent hover:border-primary/20 transition-all font-medium"
                >
                  <Hash className="w-3 h-3" />
                  {topic.tag}
                </button>
              ))}
            </div>
            <div className="pt-1 border-t border-border">
              {trendingTopics.slice(0, 3).map((topic) => (
                <div key={topic.id} className="flex justify-between items-center py-1">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Hash className="w-3 h-3" />
                    {topic.tag}
                  </span>
                  <span className="text-[11px] text-muted-foreground">{topic.debate_count} debates</span>
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      {/* CTA */}
      <div className="bg-primary/5 border border-primary/15 rounded-2xl p-4 flex flex-col gap-3">
        <p className="text-sm font-semibold text-foreground">Ready to debate?</p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Start an anonymous debate on any topic. Our AI keeps the conversation civil.
        </p>
        <Link href="/debates/new" className="w-full">
          <Button size="sm" className="gap-2 rounded-xl w-full font-semibold">
            Start a Debate
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </Link>
      </div>
    </aside>
  )
}
