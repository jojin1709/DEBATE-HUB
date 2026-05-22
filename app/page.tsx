import { getCurrentUser } from "@/lib/actions/debates"
import { LeftSidebar } from "@/components/left-sidebar"
import { MainFeedDb } from "@/components/main-feed-db"
import { RightSidebar } from "@/components/right-sidebar"
import { MobileNav } from "@/components/mobile-nav"
import { IconSidebar } from "@/components/icon-sidebar"
import { Suspense } from "react"
import { createAdminClient } from "@/lib/appwrite/server"
import { Query } from "node-appwrite"

export default async function Home() {
  const userProfile: any = await getCurrentUser()
  const user = userProfile ? { id: userProfile.$id || userProfile.id } : null
  
  let profile = userProfile
  
  // Get user's votes if logged in
  let userVotes: Record<string, 'agree' | 'disagree'> = {}
  if (user) {
    try {
      const { databases } = await createAdminClient()
      const response = await databases.listDocuments("debatehub_main", "votes", [
        Query.equal("user_id", user.id)
      ])
      
      response.documents.forEach((v: any) => {
        userVotes[v.debate_id] = v.vote_type
      })
    } catch(e) {}
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
