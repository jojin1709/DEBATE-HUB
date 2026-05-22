import { createClient } from "@/lib/supabase/server"
import { LeftSidebar } from "@/components/left-sidebar"
import { MainFeedDb } from "@/components/main-feed-db"
import { RightSidebar } from "@/components/right-sidebar"
import { MobileNav } from "@/components/mobile-nav"
import { IconSidebar } from "@/components/icon-sidebar"
import { Suspense } from "react"

export default async function Home() {
  const supabase = await createClient()
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  
  // Get user profile if logged in
  let profile = null
  if (user) {
    const { data: profileData } = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url, bio, points, level')
      .eq('id', user.id)
      .single()
    profile = profileData
  }
  
  // Get user's votes if logged in
  let userVotes: Record<string, 'agree' | 'disagree'> = {}
  if (user) {
    const { data: votes } = await supabase
      .from('votes')
      .select('debate_id, vote_type')
      .eq('user_id', user.id)
    
    if (votes) {
      votes.forEach((v: any) => {
        userVotes[v.debate_id] = v.vote_type
      })
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile top bar */}
      <Suspense fallback={<div className="h-14 bg-card border-b border-border" />}>
        <MobileNav />
      </Suspense>

      {/* Desktop: 3-column layout */}
      <div className="hidden lg:flex min-h-screen">
        <div className="flex-shrink-0 w-64">
          <Suspense fallback={<div className="w-64 bg-card border-r border-border h-full" />}>
            <LeftSidebar user={user} profile={profile} />
          </Suspense>
        </div>
        <Suspense fallback={<div className="flex-1 py-6 px-4 lg:px-6" />}>
          <MainFeedDb userId={user?.id} userVotes={userVotes} />
        </Suspense>
        <div className="flex-shrink-0 w-72">
          <Suspense fallback={<div className="w-72 border-l border-border h-full" />}>
            <RightSidebar />
          </Suspense>
        </div>
      </div>

      {/* Tablet: icon sidebar + feed */}
      <div className="hidden md:flex lg:hidden min-h-screen">
        <div className="flex-shrink-0 w-16">
          <Suspense fallback={<div className="w-16 bg-card border-r border-border h-full" />}>
            <IconSidebar />
          </Suspense>
        </div>
        <Suspense fallback={<div className="flex-1 py-6 px-4 lg:px-6" />}>
          <MainFeedDb userId={user?.id} userVotes={userVotes} />
        </Suspense>
      </div>

      {/* Mobile: feed only, below nav */}
      <div className="flex md:hidden min-h-screen pt-14">
        <Suspense fallback={<div className="flex-1 py-6 px-4 lg:px-6" />}>
          <MainFeedDb userId={user?.id} userVotes={userVotes} />
        </Suspense>
      </div>
    </div>
  )
}

