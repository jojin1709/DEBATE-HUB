"use server"

import { createAdminClient } from "@/lib/appwrite/server"
import { revalidatePath } from "next/cache"
import { Query } from "node-appwrite"

const DATABASE_ID = "debatehub_main"

export type Debate = {
  $id: string
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
  $createdAt: string
  $updatedAt: string
  category?: { name: string; slug: string; color: string } | null
  author?: { username: string; display_name: string; avatar_url: string | null } | null
  user_vote?: string | null
  is_bookmarked?: boolean
  id?: string // For compatibility
}

export async function getDebates(options?: {
  category?: string
  search?: string
  sort?: "trending" | "newest" | "most_voted"
  limit?: number
  offset?: number
}): Promise<{ data: any[]; error: string | null }> {
  try {
    const { databases, account } = await createAdminClient()
    let user = null
    try {
      user = await account.get()
    } catch (e) {
      // Not logged in
    }

    const queries = [Query.equal("status", "active")]

    if (options?.limit) {
      queries.push(Query.limit(options.limit))
    }
    
    if (options?.sort === "trending") queries.push(Query.orderDesc("view_count"))
    else if (options?.sort === "most_voted") queries.push(Query.orderDesc("agree_count"))
    else queries.push(Query.orderDesc("$createdAt"))

    if (options?.search) {
      // Appwrite doesn't have ILIKE, we use search
      queries.push(Query.search("title", options.search))
    }

    const response = await databases.listDocuments(DATABASE_ID, "debates", queries)
    const debates = response.documents.map(doc => ({...doc, id: doc.$id}))

    // Fetch categories and authors manually since Appwrite doesn't auto-join
    for (let debate of debates) {
      if (debate.category_id) {
        try {
          const catResponse = await databases.listDocuments(DATABASE_ID, "categories", [Query.equal("slug", debate.category_id)])
          if (catResponse.documents.length > 0) debate.category = catResponse.documents[0]
        } catch (e) {}
      }
      if (debate.author_id) {
        try {
          const authorResponse = await databases.listDocuments(DATABASE_ID, "profiles", [Query.equal("$id", debate.author_id)])
          if (authorResponse.documents.length > 0) debate.author = authorResponse.documents[0]
        } catch (e) {}
      }
    }

    return { data: debates, error: null }
  } catch (error: any) {
    return { data: [], error: error.message }
  }
}

export async function getDebateById(id: string): Promise<{ data: any | null; error: string | null }> {
  try {
    const { databases } = await createAdminClient()
    const debate = await databases.getDocument(DATABASE_ID, "debates", id)
    return { data: {...debate, id: debate.$id}, error: null }
  } catch (error: any) {
    return { data: null, error: error.message }
  }
}

export async function createDebate(formData: {
  title: string
  description?: string
  category_id?: string
  is_anonymous?: boolean
  media_url?: string
  media_type?: string
}): Promise<{ data: any | null; error: string | null }> {
  try {
    const { databases, account } = await createAdminClient()
    const user = await account.get()

    const debate = await databases.createDocument(DATABASE_ID, "debates", "unique()", {
      title: formData.title,
      description: formData.description || null,
      category_id: formData.category_id || null,
      author_id: user.$id,
      is_anonymous: formData.is_anonymous || false,
      status: "active",
      agree_count: 0,
      disagree_count: 0,
      view_count: 0,
      media_url: formData.media_url || null,
      media_type: formData.media_type || null
    })

    revalidatePath("/")
    return { data: {...debate, id: debate.$id}, error: null }
  } catch (error: any) {
    return { data: null, error: error.message }
  }
}

export async function getTrendingDebates(limit = 5) {
  return getDebates({ sort: "trending", limit })
}

export async function getCategories() {
  try {
    const { databases } = await createAdminClient()
    const response = await databases.listDocuments(DATABASE_ID, "categories")
    return { data: response.documents.map(doc => ({...doc, id: doc.$id})), error: null }
  } catch (error: any) {
    return { data: [], error: error.message }
  }
}

export async function getCurrentUser() {
  try {
    const { account, databases } = await createAdminClient()
    const user = await account.get()
    const response = await databases.listDocuments(DATABASE_ID, "profiles", [Query.equal("$id", user.$id)])
    if (response.documents.length > 0) return response.documents[0]
    return user
  } catch (e) {
    return null
  }
}
