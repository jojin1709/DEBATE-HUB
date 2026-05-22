"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, SlidersHorizontal, Sparkles, TrendingUp, Zap } from "lucide-react"
import { DebateCard } from "@/components/debate-card"
import { DebateCardSkeleton } from "@/components/debate-card-skeleton"
import { debates, categories } from "@/lib/mock-data"

export function MainFeed() {
  const [activeCategory, setActiveCategory] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [loading] = useState(false)

  const filteredDebates = debates.filter((d) => {
    const matchesCategory = activeCategory === "all" || d.category === activeCategory
    const matchesSearch =
      searchQuery === "" ||
      d.title.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const liveDebates = filteredDebates.filter((d) => d.isLive)

  return (
    <main className="flex-1 min-w-0 py-6 px-4 lg:px-6 flex flex-col gap-6 max-w-5xl w-full mx-auto">
      {/* Search Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search debates, topics, or arguments..."
            className="pl-10 h-11 rounded-xl bg-card border-border text-sm"
          />
        </div>
        <Button variant="outline" size="icon" className="h-11 w-11 rounded-xl border-border flex-shrink-0">
          <SlidersHorizontal className="w-4 h-4" />
          <span className="sr-only">Filters</span>
        </Button>
      </div>

      {/* Category Chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
        {categories.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setActiveCategory(cat.value)}
            className={cn(
              "flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-150 border",
              activeCategory === cat.value
                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                : "bg-card text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Live Debates Banner */}
      {liveDebates.length > 0 && activeCategory === "all" && searchQuery === "" && (
        <div className="bg-live/8 border border-live/20 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-live/15 flex items-center justify-center flex-shrink-0">
            <Zap className="w-4.5 h-4.5 text-live" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-live animate-pulse" />
              {liveDebates.length} debates happening live right now
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Join and cast your vote in real-time
            </p>
          </div>
          <Button size="sm" className="flex-shrink-0 rounded-xl text-xs font-semibold">
            View Live
          </Button>
        </div>
      )}

      {/* AI Insights Banner */}
      {activeCategory === "all" && searchQuery === "" && (
        <div className="bg-primary/5 border border-primary/15 rounded-2xl p-4 flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-4.5 h-4.5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-primary">Daily AI Insight</p>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Debates on <span className="font-medium text-foreground">AI & Jobs</span> have surged 340% this week. The consensus is shifting — more users now agree that job displacement is imminent. Explore the top arguments.
            </p>
          </div>
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 cursor-pointer hover:bg-primary/20 transition-colors">
            <TrendingUp className="w-4 h-4 text-primary" />
          </div>
        </div>
      )}

      {/* Feed Label */}
      <div className="flex items-center justify-between -mb-2">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          {activeCategory === "all" ? "All Debates" : `${activeCategory.charAt(0).toUpperCase() + activeCategory.slice(1)} Debates`}
          {filteredDebates.length > 0 && (
            <span className="ml-2 text-xs font-normal normal-case">({filteredDebates.length})</span>
          )}
        </h2>
        <button className="text-xs text-primary font-medium hover:underline">
          Sort: Latest
        </button>
      </div>

      {/* Debate Cards */}
      {loading ? (
        <div className="flex flex-col gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <DebateCardSkeleton key={i} />
          ))}
        </div>
      ) : filteredDebates.length === 0 ? (
        <EmptyState query={searchQuery} />
      ) : (
        <div className="flex flex-col gap-4">
          {filteredDebates.map((debate) => (
            <DebateCard key={debate.id} debate={debate} />
          ))}
        </div>
      )}
    </main>
  )
}

function EmptyState({ query }: { query: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
      <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center">
        <Search className="w-7 h-7 text-muted-foreground" />
      </div>
      <div>
        <p className="font-semibold text-foreground">No debates found</p>
        <p className="text-sm text-muted-foreground mt-1">
          {query
            ? `No debates match "${query}"`
            : "There are no debates in this category yet."}
        </p>
      </div>
      <Button variant="outline" size="sm" className="rounded-xl">
        Start a Debate
      </Button>
    </div>
  )
}
