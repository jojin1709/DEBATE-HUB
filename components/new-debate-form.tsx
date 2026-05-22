"use client"

import { useState, useTransition, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Sparkles, Loader2 } from "lucide-react"
import { createDebate } from "@/lib/actions/debates"
import { cn } from "@/lib/utils"
import Link from "next/link"

interface Category {
  id: string
  name: string
  slug: string
  color: string
}

interface NewDebateFormProps {
  categories: Category[]
}

export function NewDebateForm({ categories }: NewDebateFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isAnonymous, setIsAnonymous] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsAnonymous(localStorage.getItem('anonMode') === 'true')
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!title.trim()) {
      setError("Please enter a debate title")
      return
    }

    if (!categoryId) {
      setError("Please select a category for your debate")
      return
    }

    startTransition(async () => {
      try {
        const result = await createDebate({
          title: title.trim(),
          description: description.trim() || undefined,
          category_id: categoryId,
          is_anonymous: isAnonymous,
        })

        if (result.error) {
          setError(result.error)
        } else {
          router.push("/")
          router.refresh()
        }
      } catch (err: any) {
        console.error("Create debate error:", err)
        setError("Something went wrong. Please try again.")
      }
    })
  }

  return (
    <div className="flex-grow max-w-5xl w-full mx-auto py-6 px-4 lg:px-6 flex flex-col gap-6">
      {/* Back to Home */}
      <Link
        href="/"
        className="flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors w-fit"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Feed
      </Link>

      <div className="bg-card rounded-2xl border border-border shadow-sm p-6 flex flex-col gap-6">
        <div>
          <h2 className="text-xl font-bold text-foreground tracking-tight">Start a New Debate</h2>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            Formulate a clear statement or question. Our community will vote on the sides (Agree/Disagree) and discuss civically.
          </p>
        </div>

        {error && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium rounded-xl p-3">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Title */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center">
              <label htmlFor="title" className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                Statement / Question
              </label>
              <span className={cn("text-[10px]", title.length > 150 ? "text-destructive" : "text-muted-foreground")}>
                {title.length}/150
              </span>
            </div>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value.slice(0, 150))}
              placeholder="e.g. AI automation will replace 50% of jobs by 2030"
              className="h-11 rounded-xl bg-background border-border text-sm"
              disabled={isPending}
              required
            />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center">
              <label htmlFor="description" className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                Background Context (Optional)
              </label>
              <span className={cn("text-[10px]", description.length > 1000 ? "text-destructive" : "text-muted-foreground")}>
                {description.length}/1000
              </span>
            </div>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 1000))}
              placeholder="Explain the background context, outline the conflict, or specify guidelines for both sides to help keep this debate civil and educational..."
              className="min-h-32 rounded-xl bg-background border-border text-sm py-3"
              disabled={isPending}
            />
          </div>

          {/* Category Selector */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
              Select Category
            </label>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => {
                const isSelected = categoryId === cat.id
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategoryId(cat.id)}
                    className={cn(
                      "px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all duration-150 flex items-center gap-1.5",
                      isSelected
                        ? "bg-primary border-primary text-primary-foreground shadow-sm scale-[1.02]"
                        : "bg-background border-border text-muted-foreground hover:border-primary/45 hover:text-foreground"
                    )}
                    disabled={isPending}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: cat.color }}
                    />
                    {cat.name}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Anonymity Toggle */}
          <div className="flex items-center justify-between p-3 bg-secondary/35 rounded-xl border border-border/50">
            <div>
              <p className="text-xs font-bold text-foreground">Post Anonymously</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Hide your display name on this debate</p>
            </div>
            <button
              type="button"
              onClick={() => setIsAnonymous(!isAnonymous)}
              className={cn(
                "w-10 h-5.5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none flex items-center",
                isAnonymous ? "bg-primary justify-end" : "bg-muted border border-border justify-start"
              )}
            >
              <span className="w-4 h-4 rounded-full bg-card shadow-sm" />
            </button>
          </div>

          {/* AI helper banner */}
          <div className="bg-primary/5 border border-primary/10 rounded-xl p-3 flex items-start gap-2.5 mt-2">
            <Sparkles className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold text-primary">AI Moderation Policy</p>
              <p className="text-[10px] text-muted-foreground leading-relaxed mt-0.5">
                DebateHub uses advanced natural language models to automatically detect hate speech, personal attacks, and uncivil terms. Keep the statement neutral and arguments factual.
              </p>
            </div>
          </div>

          {/* Submit Actions */}
          <div className="flex justify-end gap-3 pt-3 border-t border-border">
            <Link href="/">
              <Button type="button" variant="ghost" className="rounded-xl font-semibold" disabled={isPending}>
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              className="gap-2 rounded-xl font-semibold shadow-sm px-6"
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Publishing...
                </>
              ) : (
                "Publish Debate"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
