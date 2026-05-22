"use client"

import { useState, useTransition } from "react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import {
  ThumbsUp,
  ThumbsDown,
  MessageCircle,
  Eye,
  Sparkles,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  Bookmark,
  Send,
  MessageSquare,
  CornerDownRight,
  ShieldCheck,
  Plus,
  TrendingUp,
  Loader2,
} from "lucide-react"
import { submitVote } from "@/lib/actions/votes"
import { createComment, voteOnComment, type Comment } from "@/lib/actions/comments"
import { toggleBookmark } from "@/lib/actions/bookmarks"
import { type Debate } from "@/lib/actions/debates"
import { moderateComment, generateDebateSummary, suggestRebuttals } from "@/lib/ai"
import Link from "next/link"

interface DebateDetailClientProps {
  debate: Debate
  initialComments: Comment[]
  userId?: string
}

const categoryColors: Record<string, string> = {
  Politics: "bg-blue-100 text-blue-900 border-blue-200",
  Technology: "bg-purple-100 text-purple-900 border-purple-200",
  Science: "bg-green-100 text-green-900 border-green-200",
  Society: "bg-orange-100 text-orange-900 border-orange-200",
  Environment: "bg-emerald-100 text-emerald-900 border-emerald-200",
  Economics: "bg-yellow-100 text-yellow-900 border-yellow-200",
  Health: "bg-red-100 text-red-900 border-red-200",
  Education: "bg-indigo-100 text-indigo-900 border-indigo-200",
}

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

export function DebateDetailClient({
  debate,
  initialComments,
  userId,
}: DebateDetailClientProps) {
  const [voted, setVoted] = useState<"agree" | "disagree" | null>(
    debate.user_vote as "agree" | "disagree" | null
  )
  const [agreeCount, setAgreeCount] = useState(debate.agree_count)
  const [disagreeCount, setDisagreeCount] = useState(debate.disagree_count)
  const [bookmarked, setBookmarked] = useState(!!debate.is_bookmarked)
  const [showAISummary, setShowAISummary] = useState(true)
  const [isPending, startTransition] = useTransition()
  
  // Comments state
  const [comments, setComments] = useState<Comment[]>(initialComments)
  const [commentFilter, setCommentFilter] = useState<"all" | "agree" | "disagree" | "neutral">("all")
  
  // New argument form
  const [newArgument, setNewArgument] = useState("")
  const [newStance, setNewStance] = useState<"agree" | "disagree" | "neutral">("neutral")
  const [commentError, setCommentError] = useState<string | null>(null)
  
  // Replying state maps parent comment ID -> reply text
  const [replyTextMap, setReplyTextMap] = useState<Record<string, string>>({})
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null)

  // AI summary states
  const [aiSummary, setAISummary] = useState(debate.ai_summary)
  const [aiKeyPoints, setAIKeyPoints] = useState<string[]>(debate.ai_key_points || [])
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false)

  // AI rebuttal suggestions states
  const [rebuttalSuggestions, setRebuttalSuggestions] = useState<string[]>([])
  const [isGeneratingRebuttals, setIsGeneratingRebuttals] = useState(false)
  const [replySuggestionsMap, setReplySuggestionsMap] = useState<Record<string, string[]>>({})
  const [isModerating, setIsModerating] = useState(false)

  // AI handlers
  const handleRegenerateSummary = async () => {
    setIsGeneratingSummary(true)
    try {
      const summaryResult = await generateDebateSummary(debate.title, debate.description || "", comments)
      setAISummary(summaryResult.summary)
      setAIKeyPoints(summaryResult.keyPoints)
    } catch (e) {
      console.error(e)
    } finally {
      setIsGeneratingSummary(false)
    }
  }

  const handleGetRebuttals = async () => {
    setIsGeneratingRebuttals(true)
    try {
      const suggestions = await suggestRebuttals(debate.title, newArgument, newStance)
      setRebuttalSuggestions(suggestions)
    } catch (e) {
      console.error(e)
    } finally {
      setIsGeneratingRebuttals(false)
    }
  }

  const handleGetReplySuggestions = async (commentId: string, opposingContent: string) => {
    try {
      const suggestions = await suggestRebuttals(debate.title, opposingContent, 'disagree')
      setReplySuggestionsMap(prev => ({ ...prev, [commentId]: suggestions }))
    } catch (e) {
      console.error(e)
    }
  }

  const total = agreeCount + disagreeCount || 1
  const agreePercent = Math.round((agreeCount / total) * 100)
  const disagreePercent = Math.round((disagreeCount / total) * 100)

  const handleVote = async (voteType: "agree" | "disagree") => {
    if (!userId) {
      window.location.href = "/auth/login"
      return
    }

    const oldVoted = voted
    let newVoted: "agree" | "disagree" | null = voteType
    if (oldVoted === voteType) {
      newVoted = null
    }

    setVoted(newVoted)
    
    // Optimistic count adjustment
    if (voteType === "agree") {
      if (oldVoted === "agree") {
        setAgreeCount(prev => prev - 1)
      } else if (oldVoted === "disagree") {
        setAgreeCount(prev => prev + 1)
        setDisagreeCount(prev => prev - 1)
      } else {
        setAgreeCount(prev => prev + 1)
      }
    } else {
      if (oldVoted === "disagree") {
        setDisagreeCount(prev => prev - 1)
      } else if (oldVoted === "agree") {
        setDisagreeCount(prev => prev + 1)
        setAgreeCount(prev => prev - 1)
      } else {
        setDisagreeCount(prev => prev + 1)
      }
    }

    startTransition(async () => {
      try {
        await submitVote(debate.id, voteType)
      } catch (error) {
        console.error("Voting error:", error)
        // Rollback counts in case of failure
        setVoted(oldVoted)
        setAgreeCount(debate.agree_count)
        setDisagreeCount(debate.disagree_count)
      }
    })
  }

  const handleBookmarkToggle = () => {
    if (!userId) {
      window.location.href = "/auth/login"
      return
    }

    setBookmarked(prev => !prev)
    startTransition(async () => {
      try {
        await toggleBookmark(debate.id)
      } catch (error) {
        console.error("Bookmark error:", error)
        setBookmarked(debate.is_bookmarked || false)
      }
    })
  }
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault()
    setCommentError(null)

    if (!newArgument.trim()) {
      setCommentError("Argument text cannot be empty")
      return
    }

    const isAiFilteringEnabled = typeof window !== 'undefined' ? localStorage.getItem('aiFiltering') !== 'false' : true
    if (isAiFilteringEnabled) {
      setIsModerating(true)
      try {
        const mod = await moderateComment(newArgument)
        if (mod.isToxic) {
          setCommentError(`AI Moderation: ${mod.reason}`)
          setIsModerating(false)
          return
        }
      } catch (err) {
        console.error("AI Moderation error:", err)
      } finally {
        setIsModerating(false)
      }
    }

    startTransition(async () => {
      try {
        const result = await createComment({
          debate_id: debate.id,
          content: newArgument.trim(),
          stance: newStance,
        })

        if (result.error) {
          setCommentError(result.error)
        } else if (result.data) {
          setComments(prev => [result.data as Comment, ...prev])
          setNewArgument("")
          setRebuttalSuggestions([])
        }
      } catch (err) {
        console.error("Add comment error:", err)
        setCommentError("Failed to submit argument. Try again.")
      }
    })
  }

  const handleAddReply = async (parentId: string) => {
    const text = replyTextMap[parentId] || ""
    if (!text.trim()) return

    const isAiFilteringEnabled = typeof window !== 'undefined' ? localStorage.getItem('aiFiltering') !== 'false' : true
    if (isAiFilteringEnabled) {
      setIsModerating(true)
      try {
        const mod = await moderateComment(text)
        if (mod.isToxic) {
          alert(`AI Moderation Warning: ${mod.reason}`)
          setIsModerating(false)
          return
        }
      } catch (err) {
        console.error("AI Moderation error:", err)
      } finally {
        setIsModerating(false)
      }
    }

    startTransition(async () => {
      try {
        const result = await createComment({
          debate_id: debate.id,
          content: text.trim(),
          parent_id: parentId,
        })

        if (result.error) {
          console.error("Reply error:", result.error)
        } else if (result.data) {
          setComments(prev => prev.map(c => {
            if (c.id === parentId) {
              return {
                ...c,
                replies: [...(c.replies || []), result.data as Comment]
              }
            }
            return c
          }))
          // Reset reply input
          setReplyTextMap(prev => ({ ...prev, [parentId]: "" }))
          setActiveReplyId(null)
          setReplySuggestionsMap(prev => {
            const copy = { ...prev }
            delete copy[parentId]
            return copy
          })
        }
      } catch (err) {
        console.error("Add reply error:", err)
      }
    })
  }
  const handleCommentVote = async (commentId: string, voteType: "up" | "down") => {
    if (!userId) {
      window.location.href = "/auth/login"
      return
    }

    setComments(prev => {
      const updateList = (list: Comment[]): Comment[] => {
        return list.map(c => {
          if (c.id === commentId) {
            let userVote = c.user_vote
            let upvotes = c.upvotes
            let downvotes = c.downvotes
            if (voteType === "up") {
              if (userVote === "up") {
                userVote = null
                upvotes = Math.max(0, upvotes - 1)
              } else if (userVote === "down") {
                userVote = "up"
                upvotes++
                downvotes = Math.max(0, downvotes - 1)
              } else {
                userVote = "up"
                upvotes++
              }
            } else {
              if (userVote === "down") {
                userVote = null
                downvotes = Math.max(0, downvotes - 1)
              } else if (userVote === "up") {
                userVote = "down"
                downvotes++
                upvotes = Math.max(0, upvotes - 1)
              } else {
                userVote = "down"
                downvotes++
              }
            }
            return { ...c, user_vote: userVote, upvotes, downvotes }
          }
          if (c.replies && c.replies.length > 0) {
            return { ...c, replies: updateList(c.replies) }
          }
          return c
        })
      }
      return updateList(prev)
    })

    try {
      await voteOnComment(commentId, voteType)
    } catch (err) {
      console.error("Vote on comment error:", err)
    }
  }

  const categoryName = debate.category?.name ?? "Topic"

  const filteredComments = comments.filter(c => {
    if (commentFilter === "all") return true
    return c.stance === commentFilter
  })

  return (
    <main className="flex-1 min-w-0 py-6 px-4 lg:px-6 flex flex-col gap-6 max-w-5xl w-full mx-auto">
      {/* Back Link */}
      <Link
        href="/"
        className="flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors w-fit"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Feed
      </Link>

      {/* Main Debate Card */}
      <article className="bg-card rounded-2xl border border-border shadow-sm p-6 flex flex-col gap-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge
              variant="secondary"
              className={cn(
                "text-xs font-semibold rounded-full px-2.5 py-0.5 border",
                categoryColors[categoryName] ?? "bg-secondary text-secondary-foreground"
              )}
            >
              {categoryName}
            </Badge>
            {debate.is_live && (
              <span className="flex items-center gap-1.5 text-xs font-semibold text-live">
                <span className="w-1.5 h-1.5 rounded-full bg-live animate-pulse" />
                LIVE
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground">{timeAgo(debate.created_at)}</span>
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8 rounded-lg"
              onClick={handleBookmarkToggle}
            >
              <Bookmark className={cn("w-4 h-4", bookmarked ? "fill-primary text-primary" : "text-muted-foreground")} />
            </Button>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-xl font-bold text-foreground leading-snug tracking-tight text-balance">
          {debate.title}
        </h1>

        {/* Description / Background */}
        {debate.description && (
          <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap pb-2 border-b border-border/60">
            {debate.description}
          </div>
        )}

        {/* Voting Panel */}
        <div className="flex flex-col gap-3 py-2">
          <div className="flex gap-3">
            <button
              onClick={() => handleVote("agree")}
              disabled={isPending}
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-1 py-3 px-4 rounded-xl text-sm font-semibold border transition-all duration-150 disabled:opacity-50 shadow-sm",
                voted === "agree"
                  ? "bg-agree/15 border-agree text-agree ring-1 ring-agree/30 scale-[1.01]"
                  : "border-border text-muted-foreground hover:bg-agree/10 hover:border-agree/50 hover:text-agree"
              )}
            >
              <ThumbsUp className="w-5 h-5 mb-0.5" />
              <span>Agree</span>
              <span className="text-xs opacity-80">{agreeCount}</span>
            </button>
            <button
              onClick={() => handleVote("disagree")}
              disabled={isPending}
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-1 py-3 px-4 rounded-xl text-sm font-semibold border transition-all duration-150 disabled:opacity-50 shadow-sm",
                voted === "disagree"
                  ? "bg-disagree/15 border-disagree text-disagree ring-1 ring-disagree/30 scale-[1.01]"
                  : "border-border text-muted-foreground hover:bg-disagree/10 hover:border-disagree/50 hover:text-disagree"
              )}
            >
              <ThumbsDown className="w-5 h-5 mb-0.5" />
              <span>Disagree</span>
              <span className="text-xs opacity-80">{disagreeCount}</span>
            </button>
          </div>

          {/* Progress bar */}
          <div className="space-y-1 mt-1">
            <div className="flex overflow-hidden rounded-full h-2.5 gap-0.5">
              <div
                className="bg-agree rounded-l-full transition-all duration-500"
                style={{ width: `${agreePercent}%` }}
              />
              <div
                className="bg-disagree rounded-r-full transition-all duration-500"
                style={{ width: `${disagreePercent}%` }}
              />
            </div>
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-agree">{agreePercent}% Agree</span>
              <span className="text-disagree">{disagreePercent}% Disagree</span>
            </div>
          </div>
        </div>

        {/* AI summary insights */}
        {(aiSummary || comments.length > 0) && (
          <div className="rounded-xl bg-primary/5 border border-primary/15 p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between w-full">
              <button
                type="button"
                onClick={() => setShowAISummary(!showAISummary)}
                className="flex items-center gap-2 text-left flex-1"
              >
                <Sparkles className="w-4 h-4 text-primary flex-shrink-0" />
                <span className="text-xs font-bold text-primary tracking-wide uppercase">AI Argument Summary</span>
                {showAISummary ? <ChevronUp className="w-4 h-4 text-primary" /> : <ChevronDown className="w-4 h-4 text-primary" />}
              </button>
              {comments.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={isGeneratingSummary}
                  onClick={handleRegenerateSummary}
                  className="h-7 text-[10px] font-bold text-primary uppercase tracking-wider hover:bg-primary/10 gap-1"
                >
                  {isGeneratingSummary ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                  {aiSummary ? "Regenerate" : "Generate Summary"}
                </Button>
              )}
            </div>
            {showAISummary && (
              <div className="flex flex-col gap-3 pt-1">
                {aiSummary ? (
                  <p className="text-xs text-muted-foreground leading-relaxed">{aiSummary}</p>
                ) : (
                  <p className="text-xs text-muted-foreground italic leading-relaxed">No summary generated yet. Click "Generate Summary" to synthesize arguments.</p>
                )}
                {aiKeyPoints && aiKeyPoints.length > 0 && (
                  <div className="flex flex-col gap-1.5 mt-1 border-t border-primary/10 pt-2.5">
                    <span className="text-[10px] font-bold text-primary uppercase tracking-wide">Key Points Analyzed</span>
                    <ul className="list-disc pl-4 text-xs text-muted-foreground flex flex-col gap-1">
                      {aiKeyPoints.map((point, index) => <li key={index}>{point}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-between border-t border-border/60 pt-4 mt-1">
          <div className="flex items-center gap-2.5">
            <Avatar className="w-8 h-8">
              <AvatarFallback className="text-xs font-bold bg-primary/15 text-primary">
                {debate.author?.display_name?.charAt(0).toUpperCase() || "D"}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-foreground">{debate.author?.display_name || "Anonymous"}</span>
              <span className="text-[10px] text-muted-foreground">Author</span>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <MessageCircle className="w-4 h-4" />
              {comments.length} Arguments
            </span>
            <span className="flex items-center gap-1.5">
              <Eye className="w-4 h-4" />
              {debate.view_count} Views
            </span>
          </div>
        </div>
      </article>

      {/* Add Argument Form */}
      <section className="bg-card rounded-2xl border border-border p-5 flex flex-col gap-4">
        <h3 className="font-bold text-sm text-foreground tracking-tight flex items-center gap-2">
          <MessageSquare className="w-4.5 h-4.5 text-primary" />
          Submit Your Argument
        </h3>

        {commentError && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium rounded-xl p-2.5">
            {commentError}
          </div>
        )}

        <form onSubmit={handleAddComment} className="flex flex-col gap-3.5">
          {/* Stance Selector */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Choose Stance</span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setNewStance("agree")}
                className={cn(
                  "py-2 rounded-xl text-xs font-semibold border transition-all duration-150 flex items-center justify-center gap-1.5",
                  newStance === "agree"
                    ? "bg-agree/15 border-agree text-agree ring-1 ring-agree/20"
                    : "bg-background border-border text-muted-foreground hover:bg-agree/5 hover:border-agree/30 hover:text-agree"
                )}
              >
                <ThumbsUp className="w-3.5 h-3.5" />
                Agree
              </button>
              <button
                type="button"
                onClick={() => setNewStance("disagree")}
                className={cn(
                  "py-2 rounded-xl text-xs font-semibold border transition-all duration-150 flex items-center justify-center gap-1.5",
                  newStance === "disagree"
                    ? "bg-disagree/15 border-disagree text-disagree ring-1 ring-disagree/20"
                    : "bg-background border-border text-muted-foreground hover:bg-disagree/5 hover:border-disagree/30 hover:text-disagree"
                )}
              >
                <ThumbsDown className="w-3.5 h-3.5" />
                Disagree
              </button>
              <button
                type="button"
                onClick={() => setNewStance("neutral")}
                className={cn(
                  "py-2 rounded-xl text-xs font-semibold border transition-all duration-150 flex items-center justify-center gap-1.5",
                  newStance === "neutral"
                    ? "bg-secondary text-foreground ring-1 ring-border"
                    : "bg-background border-border text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                Neutral
              </button>
            </div>
          </div>

          {/* Comment text */}
          <div className="flex flex-col gap-2">
            <Textarea
              value={newArgument}
              onChange={(e) => setNewArgument(e.target.value)}
              placeholder={
                newStance === "agree"
                  ? "Formulate why you support this statement..."
                  : newStance === "disagree"
                  ? "Formulate why you oppose this statement..."
                  : "Share a neutral question, fact, or perspective..."
              }
              className="min-h-24 rounded-xl bg-background border-border text-sm py-2.5"
            />
          </div>

          {/* AI Suggestion Bar */}
          <div className="flex flex-col gap-2 mt-1">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={handleGetRebuttals}
                disabled={isGeneratingRebuttals}
                className="flex items-center gap-1.5 text-xs text-primary font-bold uppercase tracking-wider hover:opacity-85 disabled:opacity-50"
              >
                {isGeneratingRebuttals ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                {rebuttalSuggestions.length > 0 ? "Refresh AI Suggestions" : "Suggest Points & Rebuttals"}
              </button>
              {rebuttalSuggestions.length > 0 && (
                <button
                  type="button"
                  onClick={() => setRebuttalSuggestions([])}
                  className="text-[10px] text-muted-foreground hover:text-foreground font-semibold"
                >
                  Clear Suggestions
                </button>
              )}
            </div>
            {rebuttalSuggestions.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-1">
                {rebuttalSuggestions.map((suggestion, idx) => (
                  <div
                    key={idx}
                    onClick={() => setNewArgument(prev => prev ? `${prev}\n\n${suggestion}` : suggestion)}
                    className="text-xs bg-primary/5 hover:bg-primary/10 border border-primary/10 rounded-xl p-3 cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99] text-muted-foreground hover:text-foreground leading-relaxed"
                  >
                    {suggestion}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-between items-center">
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <ShieldCheck className="w-3.5 h-3.5 text-agree" />
              AI checks for civil rules
            </div>
            <Button
              type="submit"
              size="sm"
              className="gap-1.5 rounded-lg px-4 font-semibold"
              disabled={isPending}
            >
              <Send className="w-3.5 h-3.5" />
              Submit Argument
            </Button>
          </div>
        </form>
      </section>

      {/* Arguments List Header */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            Arguments ({filteredComments.length})
          </h2>

          <div className="flex gap-1.5 overflow-x-auto">
            {(["all", "agree", "disagree", "neutral"] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setCommentFilter(filter)}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-xs font-semibold transition-all capitalize border",
                  commentFilter === filter
                    ? "bg-primary border-primary text-primary-foreground"
                    : "bg-card border-border text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* Arguments list */}
        {filteredComments.length === 0 ? (
          <div className="bg-card rounded-2xl border border-border p-8 text-center flex flex-col items-center justify-center gap-2">
            <MessageCircle className="w-8 h-8 text-muted-foreground opacity-55" />
            <p className="font-semibold text-sm text-foreground">No arguments yet</p>
            <p className="text-xs text-muted-foreground">
              {commentFilter === "all"
                ? "Be the first to share your stance and point of view!"
                : `No arguments found with stance "${commentFilter}"`}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {filteredComments.map((comment) => (
              <div key={comment.id} className="flex flex-col gap-3">
                {/* Main Comment Card */}
                <div
                  className={cn(
                    "bg-card rounded-2xl border p-4.5 flex flex-col gap-3 shadow-sm hover:shadow-md transition-shadow duration-150",
                    comment.stance === "agree"
                      ? "border-l-4 border-l-agree border-border"
                      : comment.stance === "disagree"
                      ? "border-l-4 border-l-disagree border-border"
                      : "border-border"
                  )}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar className="w-7 h-7">
                        <AvatarFallback className="text-[10px] font-bold bg-primary/10 text-primary">
                          {comment.author?.display_name?.charAt(0).toUpperCase() || "D"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-xs font-semibold text-foreground">
                          {comment.author?.display_name || "Anonymous"}
                        </span>
                        <span className="text-[9px] text-muted-foreground">
                          Level {comment.author?.level || 1}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {comment.stance && comment.stance !== "neutral" && (
                        <Badge
                          variant="secondary"
                          className={cn(
                            "text-[9px] font-bold rounded-full px-2 py-0.2 border-0 uppercase tracking-wide",
                            comment.stance === "agree"
                              ? "bg-agree/12 text-agree"
                              : "bg-disagree/12 text-disagree"
                          )}
                        >
                          {comment.stance}
                        </Badge>
                      )}
                      <span className="text-[10px] text-muted-foreground">{timeAgo(comment.created_at)}</span>
                    </div>
                  </div>

                  {/* Comment Body */}
                  <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                    {comment.content}
                  </p>

                  {/* Footer actions */}
                  <div className="flex items-center justify-between pt-1 border-t border-border/40 mt-1">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleCommentVote(comment.id, "up")}
                        className={cn(
                          "flex items-center gap-1 py-1 px-2.5 rounded-lg text-xs font-semibold border transition-all duration-100",
                          comment.user_vote === "up"
                            ? "bg-agree/12 border-agree text-agree"
                            : "border-border text-muted-foreground hover:bg-agree/10 hover:border-agree/50 hover:text-agree"
                        )}
                      >
                        <ThumbsUp className="w-3.5 h-3.5" />
                        {comment.upvotes}
                      </button>
                      <button
                        onClick={() => handleCommentVote(comment.id, "down")}
                        className={cn(
                          "flex items-center gap-1 py-1 px-2.5 rounded-lg text-xs font-semibold border transition-all duration-100",
                          comment.user_vote === "down"
                            ? "bg-disagree/12 border-disagree text-disagree"
                            : "border-border text-muted-foreground hover:bg-disagree/10 hover:border-disagree/50 hover:text-disagree"
                        )}
                      >
                        <ThumbsDown className="w-3.5 h-3.5" />
                        {comment.downvotes}
                      </button>
                    </div>

                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-xs text-primary font-semibold hover:bg-primary/5 hover:text-primary gap-1 h-8 rounded-lg"
                      onClick={() => setActiveReplyId(activeReplyId === comment.id ? null : comment.id)}
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      Reply
                    </Button>
                  </div>
                </div>

                {/* Reply Form (if open) */}
                {activeReplyId === comment.id && (
                  <div className="flex flex-col gap-2 pl-6 mt-1 border-l-2 border-primary/25 ml-4.5 pb-2">
                    <div className="flex gap-2">
                      <CornerDownRight className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-2.5" />
                      <div className="flex-1 flex gap-2">
                        <Input
                          value={replyTextMap[comment.id] || ""}
                          onChange={(e: any) =>
                            setReplyTextMap((prev) => ({ ...prev, [comment.id]: e.target.value }))
                          }
                          placeholder={`Reply to ${comment.author?.display_name}...`}
                          className="h-10 rounded-xl bg-card border-border text-xs"
                        />
                        <Button
                          size="sm"
                          className="rounded-lg h-10 px-4 flex-shrink-0 font-semibold"
                          onClick={() => handleAddReply(comment.id)}
                          disabled={isPending}
                        >
                          Send
                        </Button>
                      </div>
                    </div>
                    {/* Reply suggestions trigger/list */}
                    <div className="pl-6 flex flex-col gap-2">
                      {!replySuggestionsMap[comment.id] ? (
                        <button
                          type="button"
                          onClick={() => handleGetReplySuggestions(comment.id, comment.content)}
                          className="flex items-center gap-1.5 text-[10px] text-primary font-bold uppercase tracking-wider hover:opacity-85 w-fit"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          Suggest Rebuttals to this Argument
                        </button>
                      ) : (
                        <div className="flex flex-col gap-1.5 bg-primary/5 border border-primary/10 rounded-xl p-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-primary uppercase tracking-wide flex items-center gap-1">
                              <Sparkles className="w-3 h-3 text-primary animate-pulse" />
                              Suggested Rebuttals
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setReplySuggestionsMap(prev => {
                                  const copy = { ...prev }
                                  delete copy[comment.id]
                                  return copy
                                })
                              }}
                              className="text-[10px] text-muted-foreground hover:text-foreground font-semibold"
                            >
                              Hide Suggestions
                            </button>
                          </div>
                          <div className="flex flex-col gap-2 mt-1">
                            {replySuggestionsMap[comment.id].map((suggestion, idx) => (
                              <div
                                key={idx}
                                onClick={() => {
                                  setReplyTextMap(prev => ({
                                    ...prev,
                                    [comment.id]: prev[comment.id] ? `${prev[comment.id]} ${suggestion}` : suggestion
                                  }))
                                }}
                                className="text-xs bg-card hover:bg-primary/10 border border-border/80 hover:border-primary/20 rounded-lg p-2.5 cursor-pointer transition-all text-muted-foreground hover:text-foreground leading-relaxed"
                              >
                                {suggestion}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Nested Replies List */}
                {comment.replies && comment.replies.length > 0 && (
                  <div className="flex flex-col gap-3 pl-6 mt-1 border-l-2 border-border/50 ml-4.5">
                    {comment.replies.map((reply) => (
                      <div
                        key={reply.id}
                        className="bg-card/65 rounded-xl border border-border/80 p-3.5 flex flex-col gap-2 shadow-sm"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Avatar className="w-6 h-6">
                              <AvatarFallback className="text-[9px] font-bold bg-primary/10 text-primary">
                                {reply.author?.display_name?.charAt(0).toUpperCase() || "R"}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-xs font-semibold text-foreground">
                              {reply.author?.display_name || "Anonymous"}
                            </span>
                          </div>
                          <span className="text-[10px] text-muted-foreground">{timeAgo(reply.created_at)}</span>
                        </div>
                        <p className="text-xs text-foreground leading-relaxed">
                          {reply.content}
                        </p>
                        <div className="flex gap-1.5 pt-1 border-t border-border/20 mt-1">
                          <button
                            onClick={() => handleCommentVote(reply.id, "up")}
                            className={cn(
                              "flex items-center gap-1 py-0.5 px-2 rounded-lg text-[10px] font-semibold border transition-all duration-100",
                              reply.user_vote === "up"
                                ? "bg-agree/12 border-agree text-agree"
                                : "border-border text-muted-foreground hover:bg-agree/5 hover:border-agree/20 hover:text-agree"
                            )}
                          >
                            <ThumbsUp className="w-3 h-3" />
                            {reply.upvotes}
                          </button>
                          <button
                            onClick={() => handleCommentVote(reply.id, "down")}
                            className={cn(
                              "flex items-center gap-1 py-0.5 px-2 rounded-lg text-[10px] font-semibold border transition-all duration-100",
                              reply.user_vote === "down"
                                ? "bg-disagree/12 border-disagree text-disagree"
                                : "border-border text-muted-foreground hover:bg-disagree/5 hover:border-disagree/20 hover:text-disagree"
                            )}
                          >
                            <ThumbsDown className="w-3 h-3" />
                            {reply.downvotes}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
