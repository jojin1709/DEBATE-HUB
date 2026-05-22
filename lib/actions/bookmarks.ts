'use server'

import { createClient } from '@/lib/supabase/server'

export async function toggleBookmark(debateId: string) {
  const supabase = await createClient()

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new Error('Not authenticated')
    }

    // Check if bookmark exists
    const { data: existingBookmark, error: checkError } = await supabase
      .from('bookmarks')
      .select('id')
      .eq('debate_id', debateId)
      .eq('user_id', user.id)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError
    }

    if (existingBookmark) {
      // Remove bookmark
      const { error: deleteError } = await supabase
        .from('bookmarks')
        .delete()
        .eq('debate_id', debateId)
        .eq('user_id', user.id)

      if (deleteError) throw deleteError
      return { success: true, bookmarked: false }
    } else {
      // Add bookmark
      const { error: insertError } = await supabase.from('bookmarks').insert({
        debate_id: debateId,
        user_id: user.id,
      })

      if (insertError) throw insertError
      return { success: true, bookmarked: true }
    }
  } catch (error) {
    console.error('Bookmark error:', error)
    throw error
  }
}

export async function getUserBookmarks() {
  const supabase = await createClient()

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return []
    }

    const { data, error } = await supabase
      .from('bookmarks')
      .select('debate_id')
      .eq('user_id', user.id)

    if (error) throw error

    return data.map((b: any) => b.debate_id)
  } catch (error) {
    console.error('Get bookmarks error:', error)
    return []
  }
}

export async function getBookmarkedDebates() {
  const supabase = await createClient()

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return []
    }

    const { data, error } = await supabase
      .from('bookmarks')
      .select(
        `
        debate:debates (
          id,
          title,
          description,
          category_id,
          author_id,
          status,
          is_live,
          agree_count,
          disagree_count,
          comment_count,
          view_count,
          ai_summary,
          created_at,
          updated_at,
          author:profiles (
            id,
            username,
            display_name,
            avatar_url,
            level,
            points
          ),
          category:categories (
            id,
            name,
            slug,
            color
          )
        )
      `
      )
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw error

    return data.map((b: any) => b.debate)
  } catch (error) {
    console.error('Get bookmarked debates error:', error)
    return []
  }
}
