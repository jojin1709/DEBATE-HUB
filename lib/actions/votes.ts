'use server'

import { createClient } from '@/lib/supabase/server'

export async function submitVote(
  debateId: string,
  voteType: 'agree' | 'disagree'
) {
  const supabase = await createClient()

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new Error('Not authenticated')
    }

    // Check if user already voted
    const { data: existingVote, error: checkError } = await supabase
      .from('votes')
      .select('id, vote_type')
      .eq('debate_id', debateId)
      .eq('user_id', user.id)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError
    }

    if (existingVote) {
      if (existingVote.vote_type === voteType) {
        // Remove vote (toggle off)
        const { error: deleteError } = await supabase
          .from('votes')
          .delete()
          .eq('debate_id', debateId)
          .eq('user_id', user.id)

        if (deleteError) throw deleteError

        // Update debate counts
        const countField =
          voteType === 'agree' ? 'agree_count' : 'disagree_count'
        await supabase.rpc('update_debate_count', {
          debate_id: debateId,
          field: countField,
          increment: -1,
        })

        return { success: true, voted: false }
      } else {
        // Change vote
        const oldType = existingVote.vote_type
        const { error: updateError } = await supabase
          .from('votes')
          .update({ vote_type: voteType })
          .eq('debate_id', debateId)
          .eq('user_id', user.id)

        if (updateError) throw updateError

        // Update debate counts
        const oldField = oldType === 'agree' ? 'agree_count' : 'disagree_count'
        const newField =
          voteType === 'agree' ? 'agree_count' : 'disagree_count'

        await supabase.rpc('update_debate_count', {
          debate_id: debateId,
          field: oldField,
          increment: -1,
        })

        await supabase.rpc('update_debate_count', {
          debate_id: debateId,
          field: newField,
          increment: 1,
        })

        return { success: true, voted: true, voteType }
      }
    } else {
      // Add new vote
      const { error: insertError } = await supabase.from('votes').insert({
        debate_id: debateId,
        user_id: user.id,
        vote_type: voteType,
      })

      if (insertError) throw insertError

      // Update debate count
      const countField =
        voteType === 'agree' ? 'agree_count' : 'disagree_count'
      await supabase.rpc('update_debate_count', {
        debate_id: debateId,
        field: countField,
        increment: 1,
      })

      return { success: true, voted: true, voteType }
    }
  } catch (error) {
    console.error('Vote error:', error)
    throw error
  }
}

export async function getUserVotes(debateIds: string[]) {
  const supabase = await createClient()

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return {}
    }

    const { data, error } = await supabase
      .from('votes')
      .select('debate_id, vote_type')
      .eq('user_id', user.id)
      .in('debate_id', debateIds)

    if (error) throw error

    const voteMap: { [key: string]: 'agree' | 'disagree' } = {}
    data.forEach((vote: any) => {
      voteMap[vote.debate_id] = vote.vote_type
    })

    return voteMap
  } catch (error) {
    console.error('Get user votes error:', error)
    return {}
  }
}

export async function getDebateVoteCounts(debateId: string) {
  const supabase = await createClient()

  try {
    const { data, error } = await supabase
      .from('debates')
      .select('agree_count, disagree_count')
      .eq('id', debateId)
      .single()

    if (error) throw error

    return data
  } catch (error) {
    console.error('Get vote counts error:', error)
    return { agree_count: 0, disagree_count: 0 }
  }
}
