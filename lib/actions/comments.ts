"use server"

import { createAdminClient } from "@/lib/appwrite/server"
import { revalidatePath } from "next/cache"
import { ID, Query } from "node-appwrite"

const DATABASE_ID = "debatehub_main"

export async function getComments(debateId: string): Promise<{ data: any[]; error: string | null }> {
  try {
    const { databases } = await createAdminClient()
    const response = await databases.listDocuments(DATABASE_ID, "comments", [
      Query.equal("debate_id", debateId),
      Query.orderDesc("upvotes")
    ])

    const comments = response.documents.map(doc => ({...doc, id: doc.$id}))

    // Fetch authors
    for (let comment of comments) {
      if (comment.author_id) {
        try {
          const authorResp = await databases.listDocuments(DATABASE_ID, "profiles", [Query.equal("$id", comment.author_id)])
          if (authorResp.documents.length > 0) comment.author = authorResp.documents[0]
        } catch (e) {}
      }
    }

    return { data: comments, error: null }
  } catch (error: any) {
    return { data: [], error: error.message }
  }
}

export async function createComment(
  debateId: string,
  content: string,
  stance: "agree" | "disagree" | "neutral",
  parentId?: string,
  media_url?: string,
  media_type?: string
): Promise<{ data: any | null; error: string | null }> {
  try {
    const { databases, account } = await createAdminClient()
    const user = await account.get()

    const comment = await databases.createDocument(DATABASE_ID, "comments", ID.unique(), {
      debate_id: debateId,
      author_id: user.$id,
      content,
      stance,
      upvotes: 0,
      media_url: media_url || null,
      media_type: media_type || null
    })

    // Increment comment count on debate
    try {
      const debate = await databases.getDocument(DATABASE_ID, "debates", debateId)
      await databases.updateDocument(DATABASE_ID, "debates", debateId, {
        comment_count: (debate.comment_count || 0) + 1
      })
    } catch(e) {}

    revalidatePath(`/debates/${debateId}`)
    return { data: {...comment, id: comment.$id}, error: null }
  } catch (error: any) {
    return { data: null, error: error.message }
  }
}

export async function voteOnComment(commentId: string, voteType: "up" | "down") {
    // Simplified for appwrite migration
    return { success: true, error: null }
}
