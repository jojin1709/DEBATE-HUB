'use server'

import { createClient } from '@/lib/supabase/server'

export async function followUser(followingId: string) {
  const supabase = await createClient()

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new Error('Not authenticated')
    }

    if (user.id === followingId) {
      throw new Error('Cannot follow yourself')
    }

    const { error } = await supabase.from('follows').insert({
      follower_id: user.id,
      following_id: followingId,
    })

    if (error) throw error

    return { success: true }
  } catch (error) {
    console.error('Follow user error:', error)
    throw error
  }
}

export async function unfollowUser(followingId: string) {
  const supabase = await createClient()

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new Error('Not authenticated')
    }

    const { error } = await supabase
      .from('follows')
      .delete()
      .eq('follower_id', user.id)
      .eq('following_id', followingId)

    if (error) throw error

    return { success: true }
  } catch (error) {
    console.error('Unfollow user error:', error)
    throw error
  }
}

export async function getFollowStatus(followingId: string) {
  const supabase = await createClient()

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return false
    }

    const { data, error } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', user.id)
      .eq('following_id', followingId)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw error
    }

    return !!data
  } catch (error) {
    console.error('Get follow status error:', error)
    return false
  }
}

export async function getFollowers(userId: string) {
  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from('follows')
      .select(`
        follower:profiles!follower_id (
          id,
          username,
          display_name,
          avatar_url,
          points,
          level
        )
      `)
      .eq('following_id', userId)

    if (error) throw error

    return data.map((f: any) => f.follower)
  } catch (error) {
    console.error('Get followers error:', error)
    return []
  }
}

export async function getFollowings(userId: string) {
  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from('follows')
      .select(`
        following:profiles!following_id (
          id,
          username,
          display_name,
          avatar_url,
          points,
          level
        )
      `)
      .eq('follower_id', userId)

    if (error) throw error

    return data.map((f: any) => f.following)
  } catch (error) {
    console.error('Get followings error:', error)
    return []
  }
}

export async function getNotifications() {
  const supabase = await createClient()

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return []
    }

    const { data, error } = await supabase
      .from('notifications')
      .select(`
        id,
        user_id,
        sender_id,
        type,
        debate_id,
        comment_id,
        content,
        is_read,
        created_at,
        sender:profiles!sender_id (
          id,
          username,
          display_name,
          avatar_url
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) throw error

    return data || []
  } catch (error) {
    console.error('Get notifications error:', error)
    return []
  }
}

export async function markAllNotificationsRead() {
  const supabase = await createClient()

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new Error('Not authenticated')
    }

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)

    if (error) throw error

    return { success: true }
  } catch (error) {
    console.error('Mark all notifications read error:', error)
    throw error
  }
}

export async function markNotificationRead(notificationId: string) {
  const supabase = await createClient()

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new Error('Not authenticated')
    }

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .eq('user_id', user.id)

    if (error) throw error

    return { success: true }
  } catch (error) {
    console.error('Mark notification read error:', error)
    throw error
  }
}

export async function getLeaderboard() {
  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url, points, level, bio')
      .order('points', { ascending: false })
      .limit(10)

    if (error) throw error

    return data || []
  } catch (error) {
    console.error('Get leaderboard error:', error)
    return []
  }
}

export async function getCurrentProfile() {
  const supabase = await createClient()

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return null
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Get current profile error:', error)
    return null
  }
}

export async function getProfileById(profileId: string) {
  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', profileId)
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Get profile by id error:', error)
    return null
  }
}
