import { createClient } from "@/lib/supabase/server"
import { getCategories } from "@/lib/actions/debates"
import { LeftSidebar } from "@/components/left-sidebar"
import { RightSidebar } from "@/components/right-sidebar"
import { MobileNav } from "@/components/mobile-nav"
import { IconSidebar } from "@/components/icon-sidebar"
import { NewDebateForm } from "@/components/new-debate-form"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Create Debate – DebateHub",
  description: "Start a new anonymous AI-moderated debate on DebateHub.",
}

export default async function NewDebatePage() {
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

  // Fetch categories for form selection
  const { data: categories = [] } = await getCategories()

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile top bar */}
      <MobileNav />

      {/* Desktop: 3-column layout */}
      <div className="hidden lg:flex min-h-screen">
        <div className="flex-shrink-0 w-64">
          <LeftSidebar user={user} profile={profile} />
        </div>
        <NewDebateForm categories={categories} />
        <div className="flex-shrink-0 w-72">
          <RightSidebar />
        </div>
      </div>

      {/* Tablet: icon sidebar + feed */}
      <div className="hidden md:flex lg:hidden min-h-screen">
        <div className="flex-shrink-0 w-16">
          <IconSidebar />
        </div>
        <NewDebateForm categories={categories} />
      </div>

      {/* Mobile: feed only, below nav */}
      <div className="flex md:hidden min-h-screen pt-14">
        <NewDebateForm categories={categories} />
      </div>
    </div>
  )
}
