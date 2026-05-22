import { categories, debates } from '../mock-data'

// Helper cookie utilities
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const nameEQ = name + "="
  const ca = document.cookie.split(';')
  for(let i=0;i < ca.length;i++) {
    let c = ca[i]
    while (c.charAt(0)==' ') c = c.substring(1,c.length)
    if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length)
  }
  return null
}

function setCookie(name: string, value: string, days = 7) {
  if (typeof document === 'undefined') return
  let expires = ""
  if (days) {
    const date = new Date()
    date.setTime(date.getTime() + (days*24*60*60*1000))
    expires = "; expires=" + date.toUTCString()
  }
  document.cookie = name + "=" + (value || "")  + expires + "; path=/"
}

function deleteCookie(name: string) {
  if (typeof document === 'undefined') return
  document.cookie = name +'=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;'
}

async function getMockUserId(): Promise<string> {
  if (typeof window !== 'undefined') {
    return getCookie('mock_user_id') || 'mock-user-id'
  }
  try {
    const { cookies } = await import('next/headers')
    const cookieStore = await cookies()
    return cookieStore.get('mock_user_id')?.value || 'mock-user-id'
  } catch (e) {
    return 'mock-user-id'
  }
}

async function setMockUserCookie(userId: string) {
  if (typeof window !== 'undefined') {
    setCookie('mock_user_id', userId)
  } else {
    try {
      const { cookies } = await import('next/headers')
      const cookieStore = await cookies()
      cookieStore.set('mock_user_id', userId, { path: '/' })
    } catch (e) {
      // Ignored
    }
  }
}

async function deleteMockUserCookie() {
  if (typeof window !== 'undefined') {
    deleteCookie('mock_user_id')
  } else {
    try {
      const { cookies } = await import('next/headers')
      const cookieStore = await cookies()
      cookieStore.delete('mock_user_id')
    } catch (e) {
      // Ignored
    }
  }
}

function getStoredData<T>(key: string, defaultValue: T): T {
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(key)
      if (stored) return JSON.parse(stored)
    } catch (e) {
      console.error(e)
    }
  }
  return defaultValue
}

function setStoredData<T>(key: string, value: T) {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch (e) {
      console.error(e)
    }
  }
}

// Mock database categories matching the DB schema
export const mockCategories = [
  { id: "politics", name: "Politics", slug: "politics", color: "#F43F5E" },
  { id: "technology", name: "Technology", slug: "technology", color: "#3B82F6" },
  { id: "science", name: "Science", slug: "science", color: "#14B8A6" },
  { id: "economy", name: "Economy", slug: "economy", color: "#F59E0B" },
  { id: "climate", name: "Climate", slug: "climate", color: "#10B981" },
  { id: "society", name: "Society", slug: "society", color: "#F97316" },
  { id: "philosophy", name: "Philosophy", slug: "philosophy", color: "#6366F1" },
]

export const mockProfiles = [
  {
    id: "mock-user-id",
    username: "guest_debater",
    display_name: "Guest Debater",
    avatar_url: null,
    points: 150,
    level: 2,
    bio: "Passionate about civil discourse and exploring all perspectives."
  },
  {
    id: "user1",
    username: "alex_debates",
    display_name: "Alex Johnson",
    avatar_url: null,
    points: 1450,
    level: 8,
    bio: "AI and Philosophy enthusiast."
  },
  {
    id: "user2",
    username: "sarah_k",
    display_name: "Sarah Koenig",
    avatar_url: null,
    points: 1200,
    level: 7,
    bio: "Economics researcher."
  },
  {
    id: "user3",
    username: "debate_king",
    display_name: "Marcus Aurelius",
    avatar_url: null,
    points: 980,
    level: 6,
    bio: "Stoic philosopher."
  }
]

export const mockTrendingTopics = [
  { id: "1", tag: "AIAutomation", debate_count: 42, is_hot: true },
  { id: "2", tag: "UBI", debate_count: 28, is_hot: true },
  { id: "3", tag: "ClimateAction", debate_count: 35, is_hot: false },
  { id: "4", tag: "NuclearEnergy", debate_count: 19, is_hot: false },
  { id: "5", tag: "Section230", debate_count: 15, is_hot: false },
]

// Convert UI debates to DB schema-compatible mockDebates
export let mockDebates = debates.map(d => ({
  id: d.id,
  title: d.title,
  description: d.id === "1" ? "The rapid advance of LLMs and generative AI has triggered concerns about massive labor displacement. Proponents argue AI will create new industries, while critics fear the transition will be too fast and disruptive." : d.title,
  category_id: d.category,
  author_id: "user1",
  status: "active",
  is_live: d.isLive,
  is_featured: d.id === "1",
  agree_count: Math.round(d.participants * (d.agreePercent / 100)),
  disagree_count: Math.round(d.participants * (d.disagreePercent / 100)),
  comment_count: d.commentCount,
  view_count: d.views,
  ai_summary: d.aiSummary || null,
  ai_key_points: d.id === "1" ? ["Automation speed outpaces retraining", "Historical precedents may not apply to cognitive tasks", "New job categories in AI management and orchestration"] : null,
  ends_at: null,
  created_at: new Date(Date.now() - 3 * 3600000).toISOString(),
  updated_at: new Date(Date.now() - 3 * 3600000).toISOString(),
  category: mockCategories.find(c => c.slug === d.category) || null,
  author: { username: "alex_debates", display_name: "Alex Johnson", avatar_url: null }
}))

export let localVotes: Array<{ user_id: string, debate_id: string, vote_type: string }> = []
export let localBookmarks: Array<{ user_id: string, debate_id: string }> = []
export let localComments: Array<any> = [
  {
    id: "comment1",
    debate_id: "1",
    author_id: "user2",
    parent_id: null,
    content: "History shows every technological revolution eventually creates more jobs than it destroys — why would AI be different?",
    stance: "disagree",
    upvotes: 124,
    downvotes: 12,
    is_ai_generated: false,
    created_at: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
    author: { username: "sarah_k", display_name: "Sarah Koenig", avatar_url: null }
  },
  {
    id: "comment2",
    debate_id: "1",
    author_id: "user3",
    parent_id: null,
    content: "The scale and speed of cognitive automation is unprecedented. AI is not just replacing physical labor, but cognitive tasks as well.",
    stance: "agree",
    upvotes: 98,
    downvotes: 5,
    is_ai_generated: false,
    created_at: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
    updated_at: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
    author: { username: "debate_king", display_name: "Marcus Aurelius", avatar_url: null }
  }
]

let commentVotes: Array<{ user_id: string, comment_id: string, vote_type: 'up' | 'down' }> = []
let localFollows: Array<{ id: string; follower_id: string; following_id: string; created_at: string }> = []
let localNotifications: Array<any> = []

// Shared memory stores initialized using localStorage fallbacks (if window is available)
let profilesData = getStoredData('profiles', mockProfiles)
let debatesData = getStoredData('debates', mockDebates)
let votesData = getStoredData('votes', localVotes)
let bookmarksData = getStoredData('bookmarks', localBookmarks)
let commentsData = getStoredData('comments', localComments)
let commentVotesData = getStoredData('comment_votes', commentVotes)
let followsData = getStoredData('follows', localFollows)
let notificationsData = getStoredData('notifications', localNotifications)

function createMockQueryBuilder(tableName: string) {
  let filters: any[] = []
  let isSingle = false
  let isDelete = false
  let insertData: any = null
  let updateData: any = null
  let orderByCol: string | null = null
  let orderAscending = false

  const builder: any = {
    select: () => builder,
    eq: (col: string, val: any) => {
      filters.push({ type: 'eq', col, val })
      return builder
    },
    neq: (col: string, val: any) => {
      filters.push({ type: 'neq', col, val })
      return builder
    },
    in: (col: string, vals: any[]) => {
      filters.push({ type: 'in', col, val: vals })
      return builder
    },
    is: (col: string, val: any) => {
      filters.push({ type: 'is', col, val })
      return builder
    },
    ilike: (col: string, pattern: string) => {
      filters.push({ type: 'ilike', col, val: pattern })
      return builder
    },
    order: (col: string, options?: { ascending?: boolean }) => {
      orderByCol = col
      orderAscending = options?.ascending ?? false
      return builder
    },
    limit: () => builder,
    range: () => builder,
    single: () => {
      isSingle = true
      return builder
    },
    insert: (data: any) => {
      insertData = data
      return builder
    },
    update: (data: any) => {
      updateData = data
      return builder
    },
    delete: () => {
      isDelete = true
      return builder
    },
    then: (resolve: any) => {
      let queryData: any[] = []
      if (tableName === 'categories') {
        queryData = [...mockCategories]
      } else if (tableName === 'debates') {
        queryData = [...debatesData]
      } else if (tableName === 'profiles') {
        queryData = [...profilesData]
      } else if (tableName === 'trending_topics') {
        queryData = [...mockTrendingTopics]
      } else if (tableName === 'votes') {
        queryData = [...votesData]
      } else if (tableName === 'bookmarks') {
        queryData = [...bookmarksData]
      } else if (tableName === 'comments') {
        queryData = [...commentsData]
      } else if (tableName === 'comment_votes') {
        queryData = [...commentVotesData]
      } else if (tableName === 'follows') {
        queryData = [...followsData]
      } else if (tableName === 'notifications') {
        queryData = [...notificationsData]
      }

      let result = [...queryData]

      filters.forEach(filter => {
        // Resolve nested check e.g., 'category.slug'
        if (filter.col.includes('.')) {
          const [parent, child] = filter.col.split('.')
          if (filter.type === 'eq') {
            result = result.filter(item => item[parent]?.[child] === filter.val)
          }
          return
        }

        if (filter.type === 'eq') {
          result = result.filter(item => item[filter.col] === filter.val)
        } else if (filter.type === 'neq') {
          result = result.filter(item => item[filter.col] !== filter.val)
        } else if (filter.type === 'in') {
          result = result.filter(item => filter.val.includes(item[filter.col]))
        } else if (filter.type === 'is') {
          result = result.filter(item => item[filter.col] === filter.val)
        } else if (filter.type === 'ilike') {
          const search = filter.val.replace(/%/g, '').toLowerCase()
          result = result.filter(item => {
            const val = item[filter.col]
            return val && typeof val === 'string' && val.toLowerCase().includes(search)
          })
        }
      })

      if (orderByCol) {
        result.sort((a, b) => {
          const valA = a[orderByCol!]
          const valB = b[orderByCol!]
          if (valA < valB) return orderAscending ? -1 : 1
          if (valA > valB) return orderAscending ? 1 : -1
          return 0
        })
      }

      if (isDelete) {
        if (tableName === 'votes') {
          filters.forEach(filter => {
            if (filter.type === 'eq' && filter.col === 'id') {
              votesData = votesData.filter(v => v.debate_id !== filter.val)
            } else if (filter.type === 'eq') {
              votesData = votesData.filter(v => (v as any)[filter.col] !== filter.val)
            }
          })
          setStoredData('votes', votesData)
        } else if (tableName === 'bookmarks') {
          filters.forEach(filter => {
            if (filter.type === 'eq' && filter.col === 'id') {
              bookmarksData = bookmarksData.filter(b => b.debate_id !== filter.val)
            } else if (filter.type === 'eq') {
              bookmarksData = bookmarksData.filter(b => (b as any)[filter.col] !== filter.val)
            }
          })
          setStoredData('bookmarks', bookmarksData)
        } else if (tableName === 'comment_votes') {
          filters.forEach(filter => {
            if (filter.type === 'eq') {
              commentVotesData = commentVotesData.filter(v => (v as any)[filter.col] !== filter.val)
            }
          })
          setStoredData('comment_votes', commentVotesData)
        } else if (tableName === 'follows') {
          filters.forEach(filter => {
            if (filter.type === 'eq') {
              followsData = followsData.filter(f => (f as any)[filter.col] !== filter.val)
            }
          })
          setStoredData('follows', followsData)
        } else if (tableName === 'notifications') {
          filters.forEach(filter => {
            if (filter.type === 'eq') {
              notificationsData = notificationsData.filter(n => (n as any)[filter.col] !== filter.val)
            }
          })
          setStoredData('notifications', notificationsData)
        }
        return resolve({ data: null, error: null })
      }

      if (insertData) {
        const itemsToInsert = Array.isArray(insertData) ? insertData : [insertData]
        const insertedItems = itemsToInsert.map(item => {
          const newItem = {
            id: item.id || `mock-id-${Math.random().toString(36).substring(2, 11)}`,
            created_at: new Date().toISOString(),
            ...item
          }
          if (tableName === 'votes') {
            votesData.push(newItem)
            setStoredData('votes', votesData)

            const voter = profilesData.find(p => p.id === item.user_id)
            if (voter) {
              voter.points += 5
              voter.level = Math.floor(voter.points / 100) + 1
              setStoredData('profiles', profilesData)
            }
          } else if (tableName === 'bookmarks') {
            bookmarksData.push(newItem)
            setStoredData('bookmarks', bookmarksData)
          } else if (tableName === 'comments') {
            const authProfile = profilesData.find(p => p.id === item.author_id)
            newItem.author = authProfile || { username: 'guest_debater', display_name: 'Guest Debater', avatar_url: null, level: 1 }
            newItem.upvotes = 0
            newItem.downvotes = 0
            commentsData.push(newItem)
            setStoredData('comments', commentsData)

            const debate = debatesData.find(d => d.id === item.debate_id)
            if (debate) {
              debate.comment_count++
              setStoredData('debates', debatesData)
            }

            if (authProfile) {
              authProfile.points += 10
              authProfile.level = Math.floor(authProfile.points / 100) + 1
              setStoredData('profiles', profilesData)
            }

            try {
              const senderName = authProfile?.display_name || 'Someone'
              if (item.parent_id) {
                const parentComment = commentsData.find(c => c.id === item.parent_id)
                if (parentComment && parentComment.author_id !== item.author_id) {
                  const newNotif = {
                    id: `notif-${Math.random().toString(36).substring(2, 11)}`,
                    user_id: parentComment.author_id,
                    sender_id: item.author_id,
                    type: 'reply',
                    debate_id: item.debate_id,
                    comment_id: newItem.id,
                    content: `${senderName} replied to your argument.`,
                    is_read: false,
                    created_at: new Date().toISOString()
                  }
                  notificationsData.push(newNotif)
                  setStoredData('notifications', notificationsData)
                }
              } else {
                const debateObj = debatesData.find(d => d.id === item.debate_id)
                if (debateObj && debateObj.author_id && debateObj.author_id !== item.author_id) {
                  const newNotif = {
                    id: `notif-${Math.random().toString(36).substring(2, 11)}`,
                    user_id: debateObj.author_id,
                    sender_id: item.author_id,
                    type: 'comment',
                    debate_id: item.debate_id,
                    comment_id: newItem.id,
                    content: `${senderName} argued on your debate.`,
                    is_read: false,
                    created_at: new Date().toISOString()
                  }
                  notificationsData.push(newNotif)
                  setStoredData('notifications', notificationsData)
                }
              }
            } catch (err) {
              console.error(err)
            }
          } else if (tableName === 'comment_votes') {
            commentVotesData.push(newItem)
            setStoredData('comment_votes', commentVotesData)

            const comment = commentsData.find(c => c.id === item.comment_id)
            if (comment) {
              if (item.vote_type === 'up') {
                comment.upvotes = (comment.upvotes || 0) + 1
              } else if (item.vote_type === 'down') {
                comment.downvotes = (comment.downvotes || 0) + 1
              }
              setStoredData('comments', commentsData)
            }
          } else if (tableName === 'follows') {
            followsData.push(newItem)
            setStoredData('follows', followsData)

            const followerProfile = profilesData.find(p => p.id === item.follower_id)
            const followingProfile = profilesData.find(p => p.id === item.following_id)
            if (followingProfile && followerProfile) {
              const followerName = followerProfile.display_name || followerProfile.username || 'Someone'
              const newNotif = {
                id: `notif-${Math.random().toString(36).substring(2, 11)}`,
                user_id: item.following_id,
                sender_id: item.follower_id,
                type: 'follow',
                debate_id: null,
                comment_id: null,
                content: `${followerName} started following you.`,
                is_read: false,
                created_at: new Date().toISOString()
              }
              notificationsData.push(newNotif)
              setStoredData('notifications', notificationsData)
            }
          } else if (tableName === 'debates') {
            const isAnonymous = !!item.is_anonymous
            const authorProfile = profilesData.find(p => p.id === item.author_id)
            
            newItem.agree_count = 0
            newItem.disagree_count = 0
            newItem.comment_count = 0
            newItem.view_count = 0
            newItem.is_live = false
            newItem.is_featured = false
            newItem.status = 'active'
            newItem.is_anonymous = isAnonymous
            
            if (item.category_id) {
              newItem.category = mockCategories.find(c => c.id === item.category_id) || null
            } else {
              newItem.category = null
            }

            if (isAnonymous) {
              newItem.author = {
                username: 'anonymous',
                display_name: 'Anonymous Debater',
                avatar_url: null
              }
            } else if (authorProfile) {
              newItem.author = {
                username: authorProfile.username,
                display_name: authorProfile.display_name,
                avatar_url: authorProfile.avatar_url || null
              }
            } else {
              newItem.author = {
                username: 'guest_debater',
                display_name: 'Guest Debater',
                avatar_url: null
              }
            }

            debatesData.push(newItem)
            setStoredData('debates', debatesData)

            if (authorProfile && !isAnonymous) {
              authorProfile.points += 20
              authorProfile.level = Math.floor(authorProfile.points / 100) + 1
              setStoredData('profiles', profilesData)
            }
          } else if (tableName === 'notifications') {
            notificationsData.push(newItem)
            setStoredData('notifications', notificationsData)
          }
          return newItem
        })
        return resolve({ data: isSingle ? insertedItems[0] : insertedItems, error: null })
      }

      if (updateData) {
        if (tableName === 'debates') {
          filters.forEach(filter => {
            if (filter.type === 'eq') {
              debatesData = debatesData.map(d => {
                if ((d as any)[filter.col] === filter.val) {
                  return { ...d, ...updateData }
                }
                return d
              })
            }
          })
          setStoredData('debates', debatesData)
        } else if (tableName === 'comments') {
          filters.forEach(filter => {
            if (filter.type === 'eq') {
              commentsData = commentsData.map(c => {
                if ((c as any)[filter.col] === filter.val) {
                  return { ...c, ...updateData }
                }
                return c
              })
            }
          })
          setStoredData('comments', commentsData)
        } else if (tableName === 'profiles') {
          filters.forEach(filter => {
            if (filter.type === 'eq') {
              profilesData = profilesData.map(p => {
                if ((p as any)[filter.col] === filter.val) {
                  return { ...p, ...updateData }
                }
                return p
              })
            }
          })
          setStoredData('profiles', profilesData)
        } else if (tableName === 'notifications') {
          filters.forEach(filter => {
            if (filter.type === 'eq') {
              notificationsData = notificationsData.map(n => {
                if ((n as any)[filter.col] === filter.val) {
                  return { ...n, ...updateData }
                }
                return n
              })
            }
          })
          setStoredData('notifications', notificationsData)
        }
        return resolve({ data: isSingle ? result[0] : result, error: null })
      }

      if (isSingle) {
        return resolve({ data: result[0] || null, error: result[0] ? null : { code: 'PGRST116', message: 'Not found' } })
      }

      return resolve({ data: result, error: null })
    }
  }

  return new Proxy(builder, {
    get(target, prop) {
      if (prop in target) {
        return target[prop]
      }
      return () => builder
    }
  })
}

export const mockSupabaseClient = {
  auth: {
    getUser: async () => {
      const userId = await getMockUserId()
      const profile = profilesData.find(p => p.id === userId)
      if (!profile && userId === 'mock-user-id') {
        const guest = {
          id: 'mock-user-id',
          username: 'guest_debater',
          display_name: 'Guest Debater',
          avatar_url: null,
          points: 150,
          level: 2,
          bio: "Passionate about civil discourse and exploring all perspectives."
        }
        profilesData.push(guest)
        setStoredData('profiles', profilesData)
      }
      return { data: { user: { id: userId, email: `${userId}@debatehub.com` } }, error: null }
    },
    signOut: async () => {
      await deleteMockUserCookie()
      return { error: null }
    },
    signInWithPassword: async (credentials: any) => {
      const email = credentials.email
      const username = email.split('@')[0]
      let profile = profilesData.find(p => p.username === username)
      if (!profile) {
        profile = {
          id: `user-${Math.random().toString(36).substring(2, 11)}`,
          username,
          display_name: username,
          avatar_url: null,
          points: 100,
          level: 1,
          bio: "Joined DebateHub!"
        }
        profilesData.push(profile)
        setStoredData('profiles', profilesData)
      }
      await setMockUserCookie(profile.id)
      return { data: { user: { id: profile.id, email } }, error: null }
    },
    signUp: async (credentials: any) => {
      const email = credentials.email
      const username = email.split('@')[0]
      const id = `user-${Math.random().toString(36).substring(2, 11)}`
      
      const newProfile = {
        id,
        username,
        display_name: credentials.options?.data?.display_name || username,
        avatar_url: null,
        points: 100,
        level: 1,
        bio: "Joined DebateHub!"
      }
      profilesData.push(newProfile)
      setStoredData('profiles', profilesData)
      
      await setMockUserCookie(id)
      return { data: { user: { id, email } }, error: null }
    },
    signInWithOAuth: async (args?: any) => {
      const provider = args?.provider || 'google'
      const id = `mock-user-${provider}`
      let profile = profilesData.find(p => p.id === id)
      if (!profile) {
        profile = {
          id,
          username: `guest_${provider}`,
          display_name: `Guest (${provider})`,
          avatar_url: null,
          points: 100,
          level: 1,
          bio: `Signed in with ${provider}`
        }
        profilesData.push(profile)
        setStoredData('profiles', profilesData)
      }
      await setMockUserCookie(id)
      return { data: { provider, url: '#' }, error: null }
    },
  },
  from: (tableName: string) => createMockQueryBuilder(tableName),
  rpc: async (name: string, args?: any) => {
    if (name === 'update_debate_count' && args) {
      const debate = debatesData.find(d => d.id === args.debate_id)
      if (debate) {
        const field = args.field as 'agree_count' | 'disagree_count'
        if (debate[field] !== undefined) {
          debate[field] = Math.max(0, debate[field] + args.increment)
          setStoredData('debates', debatesData)
        }
      }
    } else if (name === 'increment_comment_count' && args) {
      const debate = debatesData.find(d => d.id === args.debate_id)
      if (debate) {
        debate.comment_count++
        setStoredData('debates', debatesData)
      }
    }
    return { data: null, error: null }
  }
}
