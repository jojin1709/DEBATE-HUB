import { getCurrentUser, getDebateById } from "@/lib/actions/debates"
import { getComments } from "@/lib/actions/comments"
import { LeftSidebar } from "@/components/left-sidebar"
import { RightSidebar } from "@/components/right-sidebar"
import { MobileNav } from "@/components/mobile-nav"
import { IconSidebar } from "@/components/icon-sidebar"
import { DebateDetailClient } from "@/components/debate-detail-client"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Metadata } from "next"

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  try {
    const { data: debate } = await getDebateById(id)
    return {
      title: debate ? `${debate.title} – DebateHub` : "Debate Not Found – DebateHub",
      description: debate?.description || "Read arguments, vote, and join the debate on DebateHub.",
    }
  } catch (error) {
    return {
      title: "Debate – DebateHub",
    }
  }
}

export default async function DebateDetailPage({ params }: PageProps) {
  const { id } = await params

  // Get current user profile
  let profile = await getCurrentUser()
  const user = profile ? { id: profile.$id || profile.id } : null

  // Fetch the debate and its comments
  const [{ data: debate }, { data: comments = [] }] = await Promise.all([
    getDebateById(id),
    getComments(id),
  ])

  if (!debate) {
    return (
      <div className="min-h-screen bg-background">
        <MobileNav />
        <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 text-center gap-4">
          <h2 className="text-2xl font-bold text-foreground">Debate Not Found</h2>
          <p className="text-muted-foreground text-sm max-w-md">
            The debate you are looking for does not exist, has been removed, or is no longer active.
          </p>
          <Link href="/">
            <Button className="gap-2 rounded-xl font-semibold shadow-sm">
              <ArrowLeft className="w-4 h-4" />
              Back to Feed
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile top bar */}
      <MobileNav />

      {/* Desktop: 3-column layout */}
      <div className="hidden lg:flex min-h-screen">
        <div className="flex-shrink-0 w-64">
          <LeftSidebar user={user} profile={profile} />
        </div>
        <DebateDetailClient debate={debate} initialComments={comments} userId={user?.id} />
        <div className="flex-shrink-0 w-72">
          <RightSidebar />
        </div>
      </div>

      {/* Tablet: icon sidebar + feed */}
      <div className="hidden md:flex lg:hidden min-h-screen">
        <div className="flex-shrink-0 w-16">
          <IconSidebar />
        </div>
        <DebateDetailClient debate={debate} initialComments={comments} userId={user?.id} />
      </div>

      {/* Mobile: feed only, below nav */}
      <div className="flex md:hidden min-h-screen pt-14">
        <DebateDetailClient debate={debate} initialComments={comments} userId={user?.id} />
      </div>
    </div>
  )
}
