"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export type Debate = {
  id: string
  title: string
  description: string | null
  category_id: string | null
  author_id: string | null
  status: string
  is_live: boolean
  is_featured: boolean
  agree_count: number
  disagree_count: number
  comment_count: number
  view_count: number
  ai_summary: string | null
  ai_key_points: string[] | null
  ends_at: string | null
  created_at: string
  updated_at: string
  category?: { name: string; slug: string; color: string } | null
  author?: { username: string; display_name: string; avatar_url: string | null } | null
  user_vote?: string | null
  is_bookmarked?: boolean
  top_comment?: {
    id: string
    content: string
    stance: string
    upvotes: number
    author: { username: string; display_name: string; avatar_url: string | null }
  } | null
}

export async function getDebates(options?: {
  category?: string
  search?: string
  sort?: "trending" | "newest" | "most_voted"
  limit?: number
  offset?: number
}): Promise<{ data: Debate[]; error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let query = supabase
    .from("debates")
    .select(`
      *,
      category:categories(name, slug, color),
      author:profiles!debates_author_id_fkey(username, display_name, avatar_url)
    `)
    .eq("status", "active")

  if (options?.category && options.category !== "all") {
    query = query.eq("category.slug", options.category)
  }

  if (options?.search) {
    query = query.ilike("title", `%${options.search}%`)
  }

  switch (options?.sort) {
    case "trending":
      query = query.order("view_count", { ascending: false })
      break
    case "most_voted":
      query = query.order("agree_count", { ascending: false })
      break
    case "newest":
    default:
      query = query.order("created_at", { ascending: false })
  }

  if (options?.limit) {
    query = query.limit(options.limit)
  }

  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
  }

  const { data: debates, error } = await query

  if (error) {
    return { data: [], error: error.message }
  }

  // Get user votes and bookmarks if authenticated
  if (user && debates && debates.length > 0) {
    const debateIds = debates.map((d: any) => d.id)

    const [votesResult, bookmarksResult] = await Promise.all([
      supabase.from("votes").select("debate_id, vote_type").eq("user_id", user.id).in("debate_id", debateIds),
      supabase.from("bookmarks").select("debate_id").eq("user_id", user.id).in("debate_id", debateIds),
    ])

    const votesMap = new Map(votesResult.data?.map((v: any) => [v.debate_id, v.vote_type]))
    const bookmarksSet = new Set(bookmarksResult.data?.map((b: any) => b.debate_id))

    debates.forEach((debate: any) => {
      debate.user_vote = votesMap.get(debate.id) || null
      debate.is_bookmarked = bookmarksSet.has(debate.id)
    })
  }

  // Get top comment for each debate
  if (debates && debates.length > 0) {
    const debateIds = debates.map((d: any) => d.id)
    const { data: comments } = await supabase
      .from("comments")
      .select(`
        id,
        debate_id,
        content,
        stance,
        upvotes,
        author:profiles!comments_author_id_fkey(username, display_name, avatar_url)
      `)
      .in("debate_id", debateIds)
      .is("parent_id", null)
      .order("upvotes", { ascending: false })

    const topCommentsMap = new Map<string, any>()
    comments?.forEach((comment: any) => {
      if (!topCommentsMap.has(comment.debate_id)) {
        topCommentsMap.set(comment.debate_id, comment)
      }
    })

    debates.forEach((debate: any) => {
      const topComment = topCommentsMap.get(debate.id)
      debate.top_comment = topComment ? {
        id: topComment.id,
        content: topComment.content,
        stance: topComment.stance,
        upvotes: topComment.upvotes,
        author: topComment.author as { username: string; display_name: string; avatar_url: string | null }
      } : null
    })
  }

  return { data: debates as Debate[], error: null }
}

export async function getDebateById(id: string): Promise<{ data: Debate | null; error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: debate, error } = await supabase
    .from("debates")
    .select(`
      *,
      category:categories(name, slug, color),
      author:profiles!debates_author_id_fkey(username, display_name, avatar_url)
    `)
    .eq("id", id)
    .single()

  if (error) {
    return { data: null, error: error.message }
  }

  // Increment view count
  await supabase.from("debates").update({ view_count: debate.view_count + 1 }).eq("id", id)

  // Get user vote and bookmark status
  if (user) {
    const [voteResult, bookmarkResult] = await Promise.all([
      supabase.from("votes").select("vote_type").eq("user_id", user.id).eq("debate_id", id).single(),
      supabase.from("bookmarks").select("id").eq("user_id", user.id).eq("debate_id", id).single(),
    ])

    debate.user_vote = voteResult.data?.vote_type || null
    debate.is_bookmarked = !!bookmarkResult.data
  }

  return { data: debate as Debate, error: null }
}

export async function createDebate(formData: {
  title: string
  description?: string
  category_id?: string
  is_anonymous?: boolean
}): Promise<{ data: Debate | null; error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { data: null, error: "You must be logged in to create a debate" }
  }

  const { data, error } = await supabase
    .from("debates")
    .insert({
      title: formData.title,
      description: formData.description || null,
      category_id: formData.category_id || null,
      author_id: user.id,
      is_anonymous: formData.is_anonymous || false,
    })
    .select()
    .single()

  if (error) {
    return { data: null, error: error.message }
  }

  revalidatePath("/")
  return { data: data as Debate, error: null }
}

export async function voteOnDebate(
  debateId: string,
  voteType: "agree" | "disagree"
): Promise<{ success: boolean; error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: "You must be logged in to vote" }
  }

  // Check if user already voted
  const { data: existingVote } = await supabase
    .from("votes")
    .select("id, vote_type")
    .eq("user_id", user.id)
    .eq("debate_id", debateId)
    .single()

  const { data: debate } = await supabase
    .from("debates")
    .select("agree_count, disagree_count")
    .eq("id", debateId)
    .single()

  if (!debate) {
    return { success: false, error: "Debate not found" }
  }

  if (existingVote) {
    if (existingVote.vote_type === voteType) {
      // Remove vote
      await supabase.from("votes").delete().eq("id", existingVote.id)
      await supabase
        .from("debates")
        .update({
          [voteType === "agree" ? "agree_count" : "disagree_count"]:
            debate[voteType === "agree" ? "agree_count" : "disagree_count"] - 1,
        })
        .eq("id", debateId)
    } else {
      // Change vote
      await supabase.from("votes").update({ vote_type: voteType }).eq("id", existingVote.id)
      await supabase
        .from("debates")
        .update({
          agree_count: voteType === "agree" ? debate.agree_count + 1 : debate.agree_count - 1,
          disagree_count: voteType === "disagree" ? debate.disagree_count + 1 : debate.disagree_count - 1,
        })
        .eq("id", debateId)
    }
  } else {
    // New vote
    await supabase.from("votes").insert({
      user_id: user.id,
      debate_id: debateId,
      vote_type: voteType,
    })
    await supabase
      .from("debates")
      .update({
        [voteType === "agree" ? "agree_count" : "disagree_count"]:
          debate[voteType === "agree" ? "agree_count" : "disagree_count"] + 1,
      })
      .eq("id", debateId)
  }

  revalidatePath("/")
  return { success: true, error: null }
}

export async function toggleBookmark(debateId: string): Promise<{ success: boolean; bookmarked: boolean; error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, bookmarked: false, error: "You must be logged in to bookmark" }
  }

  const { data: existingBookmark } = await supabase
    .from("bookmarks")
    .select("id")
    .eq("user_id", user.id)
    .eq("debate_id", debateId)
    .single()

  if (existingBookmark) {
    await supabase.from("bookmarks").delete().eq("id", existingBookmark.id)
    return { success: true, bookmarked: false, error: null }
  } else {
    await supabase.from("bookmarks").insert({
      user_id: user.id,
      debate_id: debateId,
    })
    return { success: true, bookmarked: true, error: null }
  }
}

export async function getCategories(): Promise<{ data: { id: string; name: string; slug: string; color: string }[]; error: string | null }> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("categories")
    .select("id, name, slug, color")
    .order("name")

  if (error) {
    return { data: [], error: error.message }
  }

  return { data, error: null }
}

export async function getTrendingDebates(limit = 5): Promise<{ data: Debate[]; error: string | null }> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("debates")
    .select(`
      id,
      title,
      agree_count,
      disagree_count,
      is_live,
      category:categories(name, slug, color)
    `)
    .eq("status", "active")
    .order("view_count", { ascending: false })
    .limit(limit)

  if (error) {
    return { data: [], error: error.message }
  }

  return { data: data as Debate[], error: null }
}

export async function getTrendingTopics(): Promise<{ data: { id: string; tag: string; debate_count: number; is_hot: boolean }[]; error: string | null }> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("trending_topics")
    .select("id, tag, debate_count, is_hot")
    .order("debate_count", { ascending: false })
    .limit(8)

  if (error) {
    return { data: [], error: error.message }
  }

  return { data, error: null }
}

export async function getTopContributors(limit = 5): Promise<{ data: { id: string; username: string; display_name: string; avatar_url: string | null; points: number; level: number }[]; error: string | null }> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url, points, level")
    .order("points", { ascending: false })
    .limit(limit)

  if (error) {
    return { data: [], error: error.message }
  }

  return { data, error: null }
}

export async function getCurrentUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  return profile
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath("/")
}
