"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  ThumbsUp,
  ThumbsDown,
  MessageCircle,
  Users,
  Eye,
  Sparkles,
  ChevronDown,
  ChevronUp,
  ArrowRight,
} from "lucide-react"
import { type Debate, categoryColors } from "@/lib/mock-data"

function formatNumber(n: number) {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "k"
  return n.toString()
}

interface DebateCardProps {
  debate: Debate
}

export function DebateCard({ debate }: DebateCardProps) {
  const [voted, setVoted] = useState<"agree" | "disagree" | null>(null)
  const [showSummary, setShowSummary] = useState(false)

  const agreeW = debate.agreePercent
  const disagreeW = debate.disagreePercent

  return (
    <article className="bg-card rounded-2xl border border-border shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge
            variant="secondary"
            className={cn(
              "text-xs font-semibold rounded-full px-2.5 py-0.5 border-0",
              categoryColors[debate.category] ?? "bg-secondary text-secondary-foreground"
            )}
          >
            {debate.category.charAt(0).toUpperCase() + debate.category.slice(1)}
          </Badge>
          {debate.isLive && (
            <span className="flex items-center gap-1.5 text-xs font-semibold text-live">
              <span className="w-1.5 h-1.5 rounded-full bg-live animate-pulse" />
              LIVE
            </span>
          )}
        </div>
        <span className="text-xs text-muted-foreground flex-shrink-0">{debate.timeAgo}</span>
      </div>

      {/* Title */}
      <h3 className="text-[15px] font-semibold text-foreground leading-snug text-balance line-clamp-3 cursor-pointer hover:text-primary transition-colors">
        {debate.title}
      </h3>

      {/* Voting Section */}
      <div className="flex flex-col gap-2">
        {/* Vote buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => setVoted(voted === "agree" ? null : "agree")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-sm font-medium border transition-all duration-150",
              voted === "agree"
                ? "bg-agree/15 border-agree text-agree"
                : "border-border text-muted-foreground hover:bg-agree/10 hover:border-agree/50 hover:text-agree"
            )}
          >
            <ThumbsUp className="w-4 h-4" />
            Agree
          </button>
          <button
            onClick={() => setVoted(voted === "disagree" ? null : "disagree")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-sm font-medium border transition-all duration-150",
              voted === "disagree"
                ? "bg-disagree/15 border-disagree text-disagree"
                : "border-border text-muted-foreground hover:bg-disagree/10 hover:border-disagree/50 hover:text-disagree"
            )}
          >
            <ThumbsDown className="w-4 h-4" />
            Disagree
          </button>
        </div>

        {/* Progress bar */}
        <div className="space-y-1">
          <div className="flex overflow-hidden rounded-full h-2 gap-0.5">
            <div
              className="bg-agree rounded-l-full transition-all duration-500"
              style={{ width: `${agreeW}%` }}
            />
            <div
              className="bg-disagree rounded-r-full transition-all duration-500"
              style={{ width: `${disagreeW}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] font-medium">
            <span className="text-agree">{agreeW}% Agree</span>
            <span className="text-disagree">{disagreeW}% Disagree</span>
          </div>
        </div>
      </div>

      {/* AI Summary (expandable) */}
      {debate.aiSummary && (
        <div className="rounded-xl bg-primary/5 border border-primary/15 p-3">
          <button
            onClick={() => setShowSummary(!showSummary)}
            className="flex items-center gap-2 w-full text-left"
          >
            <Sparkles className="w-3.5 h-3.5 text-primary flex-shrink-0" />
            <span className="text-xs font-semibold text-primary flex-1">AI Summary</span>
            {showSummary ? (
              <ChevronUp className="w-3.5 h-3.5 text-primary" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-primary" />
            )}
          </button>
          {showSummary && (
            <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
              {debate.aiSummary}
            </p>
          )}
        </div>
      )}

      {/* Top Comment Preview */}
      <div className="bg-secondary/60 rounded-xl p-3 flex flex-col gap-1.5">
        <div className="flex items-center gap-1.5">
          <MessageCircle className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
            Top comment
          </span>
          <span className="ml-auto text-[11px] text-muted-foreground">{debate.topComment.time}</span>
        </div>
        <p className="text-xs text-foreground leading-relaxed line-clamp-2">
          <span className="font-semibold text-primary">{debate.topComment.author}: </span>
          {debate.topComment.text}
        </p>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-3">
          {/* Participant Avatars */}
          <div className="flex -space-x-2">
            {debate.participantAvatars.slice(0, 4).map((p, i) => (
              <Avatar
                key={i}
                className="w-6 h-6 border-2 border-card ring-0"
              >
                <AvatarFallback
                  className={cn(
                    "text-[9px] font-bold text-white",
                    p.color
                  )}
                >
                  {p.initials}
                </AvatarFallback>
              </Avatar>
            ))}
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              {formatNumber(debate.participants)}
            </span>
            <span className="flex items-center gap-1">
              <MessageCircle className="w-3.5 h-3.5" />
              {formatNumber(debate.commentCount)}
            </span>
            <span className="flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" />
              {formatNumber(debate.views)}
            </span>
          </div>
        </div>
        <Button size="sm" variant="outline" className="gap-1.5 text-xs rounded-lg h-8 font-semibold hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors">
          Join
          <ArrowRight className="w-3.5 h-3.5" />
        </Button>
      </div>
    </article>
  )
}
