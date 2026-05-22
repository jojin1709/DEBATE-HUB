"use server"

import { createAdminClient } from "@/lib/appwrite/server"
import { revalidatePath } from "next/cache"
import { ID, Query } from "node-appwrite"

const DATABASE_ID = "debatehub_main"

export async function voteOnDebate(
  debateId: string,
  voteType: "agree" | "disagree"
): Promise<{ success: boolean; error: string | null }> {
  try {
    const { databases, account } = await createAdminClient()
    const user = await account.get()

    // Check existing vote
    const existing = await databases.listDocuments(DATABASE_ID, "votes", [
      Query.equal("user_id", user.$id),
      Query.equal("debate_id", debateId)
    ])

    const debate = await databases.getDocument(DATABASE_ID, "debates", debateId)

    if (existing.documents.length > 0) {
      const vote = existing.documents[0]
      if (vote.vote_type === voteType) {
        // remove
        await databases.deleteDocument(DATABASE_ID, "votes", vote.$id)
        await databases.updateDocument(DATABASE_ID, "debates", debateId, {
          [voteType === "agree" ? "agree_count" : "disagree_count"]: Math.max(0, debate[voteType === "agree" ? "agree_count" : "disagree_count"] - 1)
        })
      } else {
        // change
        await databases.updateDocument(DATABASE_ID, "votes", vote.$id, { vote_type: voteType })
        await databases.updateDocument(DATABASE_ID, "debates", debateId, {
          agree_count: voteType === "agree" ? debate.agree_count + 1 : Math.max(0, debate.agree_count - 1),
          disagree_count: voteType === "disagree" ? debate.disagree_count + 1 : Math.max(0, debate.disagree_count - 1)
        })
      }
    } else {
      // new
      await databases.createDocument(DATABASE_ID, "votes", ID.unique(), {
        user_id: user.$id,
        debate_id: debateId,
        vote_type: voteType
      })
      await databases.updateDocument(DATABASE_ID, "debates", debateId, {
        [voteType === "agree" ? "agree_count" : "disagree_count"]: debate[voteType === "agree" ? "agree_count" : "disagree_count"] + 1
      })
    }

    revalidatePath("/")
    revalidatePath(`/debates/${debateId}`)
    return { success: true, error: null }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
