"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export type Comment = {
  id: string
  debate_id: string
  author_id: string
  parent_id: string | null
  content: string
  stance: "agree" | "disagree" | "neutral" | null
  upvotes: number
  downvotes: number
  is_ai_generated: boolean
  created_at: string
  updated_at: string
  author?: { username: string; display_name: string; avatar_url: string | null; level?: number; points?: number }
  user_vote?: "up" | "down" | null
  replies?: Comment[]
}

export async function getCommentsByDebateId(debateId: string): Promise<{ data: Comment[]; error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: comments, error } = await supabase
    .from("comments")
    .select(`
      *,
      author:profiles!comments_author_id_fkey(username, display_name, avatar_url, level)
    `)
    .eq("debate_id", debateId)
    .is("parent_id", null)
    .order("upvotes", { ascending: false })

  if (error) {
    return { data: [], error: error.message }
  }

  // Get replies for each comment
  const commentIds = comments.map((c: any) => c.id)
  const { data: replies } = await supabase
    .from("comments")
    .select(`
      *,
      author:profiles!comments_author_id_fkey(username, display_name, avatar_url, level)
    `)
    .in("parent_id", commentIds)
    .order("created_at", { ascending: true })

  // Attach replies to parent comments
  const repliesMap = new Map<string, Comment[]>()
  replies?.forEach((reply: any) => {
    const parentReplies = repliesMap.get(reply.parent_id!) || []
    parentReplies.push(reply as Comment)
    repliesMap.set(reply.parent_id!, parentReplies)
  })

  comments.forEach((comment: any) => {
    comment.replies = repliesMap.get(comment.id) || []
  })

  // Get user votes if authenticated
  if (user && comments.length > 0) {
    const allCommentIds = [...commentIds, ...(replies?.map((r: any) => r.id) || [])]
    const { data: votes } = await supabase
      .from("comment_votes")
      .select("comment_id, vote_type")
      .eq("user_id", user.id)
      .in("comment_id", allCommentIds)

    const votesMap = new Map(votes?.map((v: any) => [v.comment_id, v.vote_type]))

    comments.forEach((comment: any) => {
      comment.user_vote = votesMap.get(comment.id) as "up" | "down" | null
      comment.replies?.forEach((reply: any) => {
        reply.user_vote = votesMap.get(reply.id) as "up" | "down" | null
      })
    })
  }

  return { data: comments as Comment[], error: null }
}

export async function createComment(formData: {
  debate_id: string
  content: string
  stance?: "agree" | "disagree" | "neutral"
  parent_id?: string
}): Promise<{ data: Comment | null; error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { data: null, error: "You must be logged in to comment" }
  }

  const { data, error } = await supabase
    .from("comments")
    .insert({
      debate_id: formData.debate_id,
      author_id: user.id,
      content: formData.content,
      stance: formData.stance || null,
      parent_id: formData.parent_id || null,
    })
    .select(`
      *,
      author:profiles!comments_author_id_fkey(username, display_name, avatar_url)
    `)
    .single()

  if (error) {
    return { data: null, error: error.message }
  }

  // Update comment count on debate
  await supabase.rpc("increment_comment_count", { debate_id: formData.debate_id })

  revalidatePath("/")
  return { data: data as Comment, error: null }
}

export async function voteOnComment(
  commentId: string,
  voteType: "up" | "down"
): Promise<{ success: boolean; error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "You must be logged in to vote" }
  }

  // Check if user already voted
  const { data: existingVote } = await supabase
    .from("comment_votes")
    .select("id, vote_type")
    .eq("user_id", user.id)
    .eq("comment_id", commentId)
    .single()

  const { data: comment } = await supabase
    .from("comments")
    .select("upvotes, downvotes")
    .eq("id", commentId)
    .single()

  if (!comment) {
    return { success: false, error: "Comment not found" }
  }

  if (existingVote) {
    if (existingVote.vote_type === voteType) {
      // Remove vote
      await supabase.from("comment_votes").delete().eq("id", existingVote.id)
      await supabase
        .from("comments")
        .update({
          [voteType === "up" ? "upvotes" : "downvotes"]:
            comment[voteType === "up" ? "upvotes" : "downvotes"] - 1,
        })
        .eq("id", commentId)
    } else {
      // Change vote
      await supabase.from("comment_votes").update({ vote_type: voteType }).eq("id", existingVote.id)
      await supabase
        .from("comments")
        .update({
          upvotes: voteType === "up" ? comment.upvotes + 1 : comment.upvotes - 1,
          downvotes: voteType === "down" ? comment.downvotes + 1 : comment.downvotes - 1,
        })
        .eq("id", commentId)
    }
  } else {
    // New vote
    await supabase.from("comment_votes").insert({
      user_id: user.id,
      comment_id: commentId,
      vote_type: voteType,
    })
    await supabase
      .from("comments")
      .update({
        [voteType === "up" ? "upvotes" : "downvotes"]:
          comment[voteType === "up" ? "upvotes" : "downvotes"] + 1,
      })
      .eq("id", commentId)
  }

  revalidatePath("/")
  return { success: true, error: null }
}
