"use server"

import { createAdminClient } from "@/lib/appwrite/server"
import { revalidatePath } from "next/cache"
import { ID, Query } from "node-appwrite"

const DATABASE_ID = "debatehub_main"

export async function getNotifications(): Promise<{ data: any[]; error: string | null }> {
  try {
    const { databases, account } = await createAdminClient()
    const user = await account.get()

    const response = await databases.listDocuments(DATABASE_ID, "notifications", [
      Query.equal("user_id", user.$id),
      Query.orderDesc("$createdAt")
    ])

    return { data: response.documents.map(doc => ({...doc, id: doc.$id})), error: null }
  } catch (error: any) {
    return { data: [], error: error.message }
  }
}

export async function markNotificationAsRead(id: string): Promise<{ success: boolean; error: string | null }> {
  try {
    const { databases } = await createAdminClient()
    await databases.updateDocument(DATABASE_ID, "notifications", id, { is_read: true })
    return { success: true, error: null }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function toggleFollow(targetUserId: string): Promise<{ success: boolean; is_following: boolean; error: string | null }> {
  try {
    const { databases, account } = await createAdminClient()
    const user = await account.get()

    if (user.$id === targetUserId) return { success: false, is_following: false, error: "Cannot follow yourself" }

    const existing = await databases.listDocuments(DATABASE_ID, "follows", [
      Query.equal("follower_id", user.$id),
      Query.equal("following_id", targetUserId)
    ])

    if (existing.documents.length > 0) {
      await databases.deleteDocument(DATABASE_ID, "follows", existing.documents[0].$id)
      return { success: true, is_following: false, error: null }
    } else {
      await databases.createDocument(DATABASE_ID, "follows", ID.unique(), {
        follower_id: user.$id,
        following_id: targetUserId
      })
      return { success: true, is_following: true, error: null }
    }
  } catch (error: any) {
    return { success: false, is_following: false, error: error.message }
  }
}
