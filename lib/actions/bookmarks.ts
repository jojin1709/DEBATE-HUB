"use server"

import { createAdminClient } from "@/lib/appwrite/server"
import { revalidatePath } from "next/cache"
import { ID, Query } from "node-appwrite"

const DATABASE_ID = "debatehub_main"

export async function toggleBookmark(debateId: string): Promise<{ success: boolean; bookmarked: boolean; error: string | null }> {
  try {
    const { databases, account } = await createAdminClient()
    const user = await account.get()

    const existing = await databases.listDocuments(DATABASE_ID, "bookmarks", [
      Query.equal("user_id", user.$id),
      Query.equal("debate_id", debateId)
    ])

    if (existing.documents.length > 0) {
      await databases.deleteDocument(DATABASE_ID, "bookmarks", existing.documents[0].$id)
      return { success: true, bookmarked: false, error: null }
    } else {
      await databases.createDocument(DATABASE_ID, "bookmarks", ID.unique(), {
        user_id: user.$id,
        debate_id: debateId
      })
      return { success: true, bookmarked: true, error: null }
    }
  } catch (error: any) {
    return { success: false, bookmarked: false, error: error.message }
  }
}
