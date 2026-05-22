'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
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
} from 'lucide-react'
import { voteOnDebate } from '@/lib/actions/votes'
import { createComment } from '@/lib/actions/comments'
import { type Debate } from '@/lib/actions/debates'

interface UserVote {
  debate_id: string
  vote_type: 'agree' | 'disagree'
}

interface DebateCardDbProps {
  debate: Debate
  userVote?: UserVote | null
  userId?: string
}

const categoryColors: Record<string, string> = {
  Politics: 'bg-blue-100 text-blue-900',
  Technology: 'bg-purple-100 text-purple-900',
  Science: 'bg-green-100 text-green-900',
  Society: 'bg-orange-100 text-orange-900',
  Environment: 'bg-emerald-100 text-emerald-900',
  Economics: 'bg-yellow-100 text-yellow-900',
  Health: 'bg-red-100 text-red-900',
  Education: 'bg-indigo-100 text-indigo-900',
}

function formatNumber(n: number) {
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'k'
  return n.toString()
}

function timeAgo(date: string) {
  const now = new Date()
  const then = new Date(date)
  const diff = Math.floor((now.getTime() - then.getTime()) / 1000)

  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
  return Math.floor(diff / 604800) + 'w ago'
}

export function DebateCardDb({
  debate,
  userVote,
  userId,
}: DebateCardDbProps) {
  const [voted, setVoted] = useState<'agree' | 'disagree' | null>(
    userVote?.vote_type ?? null
  )
  const [agreeCount, setAgreeCount] = useState(debate.agree_count)
  const [disagreeCount, setDisagreeCount] = useState(debate.disagree_count)
  const [showSummary, setShowSummary] = useState(false)
  const [isPending, startTransition] = useTransition()

  const total = agreeCount + disagreeCount || 1
  const agreeW = Math.round((agreeCount / total) * 100)
  const disagreeW = Math.round((disagreeCount / total) * 100)

  const handleVote = async (voteType: 'agree' | 'disagree') => {
    if (!userId) {
      window.location.href = '/auth/login'
      return
    }

    const oldVoted = voted
    let newVoted: 'agree' | 'disagree' | null = voteType
    if (oldVoted === voteType) {
      newVoted = null
    }

    setVoted(newVoted)
    
    // Optimistic count adjustment
    if (voteType === 'agree') {
      if (oldVoted === 'agree') {
        setAgreeCount(prev => Math.max(0, prev - 1))
      } else if (oldVoted === 'disagree') {
        setAgreeCount(prev => prev + 1)
        setDisagreeCount(prev => Math.max(0, prev - 1))
      } else {
        setAgreeCount(prev => prev + 1)
      }
    } else {
      if (oldVoted === 'disagree') {
        setDisagreeCount(prev => Math.max(0, prev - 1))
      } else if (oldVoted === 'agree') {
        setDisagreeCount(prev => prev + 1)
        setAgreeCount(prev => Math.max(0, prev - 1))
      } else {
        setDisagreeCount(prev => prev + 1)
      }
    }

    startTransition(async () => {
      try {
        const result = await voteOnDebate(debate.id, voteType)
        if (!result.success) {
          // Rollback if failure
          setVoted(oldVoted)
          setAgreeCount(debate.agree_count)
          setDisagreeCount(debate.disagree_count)
        }
      } catch (error) {
        console.error('[v0] Vote error:', error)
        setVoted(oldVoted)
        setAgreeCount(debate.agree_count)
        setDisagreeCount(debate.disagree_count)
      }
    })
  }

  const categoryName = debate.category?.name ?? 'Topic'

  return (
    <article className="bg-card rounded-2xl border border-border/80 hover-glow-card p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge
            variant="secondary"
            className={cn(
              'text-[10px] font-bold uppercase tracking-wider rounded-lg px-2 py-0.5 border-0',
              categoryColors[categoryName] ?? 'bg-secondary text-secondary-foreground'
            )}
          >
            {categoryName}
          </Badge>
          {debate.is_live && (
            <span className="flex items-center gap-1.5 text-xs font-bold text-live pulse-subtle">
              <span className="w-1.5 h-1.5 rounded-full bg-live" />
              LIVE
            </span>
          )}
        </div>
        <span className="text-[11px] font-medium text-muted-foreground flex-shrink-0">
          {timeAgo(debate.$createdAt)}
        </span>
      </div>

      {/* Title */}
      <Link href={`/debates/${debate.id}`} className="block group">
        <h3 className="text-base font-bold text-foreground leading-snug text-balance line-clamp-3 cursor-pointer group-hover:text-primary transition-colors duration-150">
          {debate.title}
        </h3>
        {debate.media_url && (
          <div className="mt-3 w-full h-32 rounded-xl overflow-hidden bg-muted border border-border/60">
            {debate.media_type === 'video' ? (
              <video src={debate.media_url} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
            ) : debate.media_type === 'audio' ? (
              <div className="w-full h-full flex items-center justify-center bg-secondary/50">
                <span className="text-xs text-muted-foreground font-semibold flex items-center gap-2">
                  🎙️ Audio Attachment
                </span>
              </div>
            ) : (
              <img src={debate.media_url} alt="Debate thumbnail" className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
            )}
          </div>
        )}
      </Link>

      {/* Voting Section */}
      <div className="flex flex-col gap-3">
        {/* Vote buttons */}
        <div className="flex gap-2.5">
          <button
            onClick={() => handleVote('agree')}
            disabled={isPending}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-semibold border transition-all duration-200 disabled:opacity-50 agree-glow cursor-pointer',
              voted === 'agree'
                ? 'bg-agree/15 border-agree text-agree font-bold'
                : 'border-border text-muted-foreground hover:bg-agree/10 hover:border-agree/40 hover:text-agree'
            )}
          >
            <ThumbsUp className="w-4 h-4" />
            Agree
          </button>
          <button
            onClick={() => handleVote('disagree')}
            disabled={isPending}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-semibold border transition-all duration-200 disabled:opacity-50 disagree-glow cursor-pointer',
              voted === 'disagree'
                ? 'bg-disagree/15 border-disagree text-disagree font-bold'
                : 'border-border text-muted-foreground hover:bg-disagree/10 hover:border-disagree/40 hover:text-disagree'
            )}
          >
            <ThumbsDown className="w-4 h-4" />
            Disagree
          </button>
        </div>

        {/* Progress bar */}
        <div className="space-y-1.5">
          <div className="flex overflow-hidden rounded-full h-2.5 gap-0.5 bg-muted">
            <div
              className="bg-agree transition-all duration-500 rounded-l-full"
              style={{ width: `${agreeW}%` }}
            />
            <div
              className="bg-disagree transition-all duration-500 rounded-r-full"
              style={{ width: `${disagreeW}%` }}
            />
          </div>
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-agree">{agreeW}% Agree ({agreeCount})</span>
            <span className="text-disagree">
              {disagreeW}% Disagree ({disagreeCount})
            </span>
          </div>
        </div>
      </div>

      {/* AI Summary (expandable) */}
      {debate.ai_summary && (
        <div className="rounded-xl bg-primary/5 border border-primary/10 p-3.5 transition-all duration-200">
          <button
            onClick={() => setShowSummary(!showSummary)}
            className="flex items-center gap-2 w-full text-left"
          >
            <Sparkles className="w-3.5 h-3.5 text-primary flex-shrink-0" />
            <span className="text-xs font-bold text-primary flex-1 tracking-wide uppercase">AI Summary</span>
            {showSummary ? (
              <ChevronUp className="w-3.5 h-3.5 text-primary" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-primary" />
            )}
          </button>
          {showSummary && (
            <p className="mt-2 text-xs text-muted-foreground leading-relaxed transition-all duration-200">
              {debate.ai_summary}
            </p>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-border/40 pt-3">
        <div className="flex items-center gap-2">
          {debate.author && (
            <Avatar className="w-6 h-6 border border-border">
              <AvatarFallback className="text-[9px] font-bold bg-primary/10 text-primary">
                {debate.author.display_name?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          )}
          <span className="text-xs font-medium text-foreground max-w-24 truncate">
            {debate.author?.display_name || 'Anonymous'}
          </span>
          <div className="flex items-center gap-2.5 text-[11px] font-medium text-muted-foreground ml-2">
            <span className="flex items-center gap-1">
              <MessageCircle className="w-3.5 h-3.5" />
              {formatNumber(debate.comment_count)}
            </span>
            <span className="flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" />
              {formatNumber(debate.view_count)}
            </span>
          </div>
        </div>
        <Link href={`/debates/${debate.id}`}>
          <Button
            size="sm"
            variant="outline"
            className="gap-1 text-xs rounded-xl h-8 font-bold border-primary/20 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors cursor-pointer"
          >
            Join
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </Link>
      </div>
    </article>
  )
}
