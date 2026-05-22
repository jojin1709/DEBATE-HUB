"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { ArrowLeft, MessageSquare, AlertCircle, Loader2, Image as ImageIcon, X, Upload } from "lucide-react"
import { MobileNav } from "@/components/mobile-nav"
import { LeftSidebar } from "@/components/left-sidebar"
import { RightSidebar } from "@/components/right-sidebar"
import { createDebate, getCategories } from "@/lib/actions/debates"
import { storage, account } from "@/lib/appwrite/client"
import { ID } from "appwrite"

export default function NewDebatePage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [categories, setCategories] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [categorySlug, setCategorySlug] = useState("")
  const [isAnonymous, setIsAnonymous] = useState(false)
  
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  useEffect(() => {
    const init = async () => {
      try {
        await account.get()
      } catch (e) {
        router.push("/auth/login")
      }
      
      const { data } = await getCategories()
      setCategories(data || [])
    }
    init()
  }, [router])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !categorySlug) {
      setError("Title and Category are required.")
      return
    }

    setIsSubmitting(true)
    setError(null)
    
    let mediaUrl = null
    let mediaType = null

    if (file) {
      setIsUploading(true)
      try {
        const upload = await storage.createFile('media_uploads', ID.unique(), file)
        
        // Use endpoint and project from env to build raw URL for media
        const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1'
        const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || ''
        
        mediaUrl = `${endpoint}/storage/buckets/media_uploads/files/${upload.$id}/view?project=${projectId}`
        
        if (file.type.startsWith('image/')) mediaType = 'image'
        else if (file.type.startsWith('video/')) mediaType = 'video'
        else if (file.type.startsWith('audio/')) mediaType = 'audio'
        else mediaType = 'file'
      } catch (err: any) {
        setError("Failed to upload media: " + err.message)
        setIsSubmitting(false)
        setIsUploading(false)
        return
      }
      setIsUploading(false)
    }

    const { data, error: submitError } = await createDebate({
      title,
      description,
      category_id: categorySlug,
      is_anonymous: isAnonymous,
      media_url: mediaUrl || undefined,
      media_type: mediaType || undefined
    })

    if (submitError) {
      setError(submitError)
      setIsSubmitting(false)
    } else if (data) {
      router.push(`/debates/${data.id}`)
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row">
      <MobileNav />
      
      <div className="hidden md:block w-64 flex-shrink-0">
        <LeftSidebar />
      </div>
      
      <main className="flex-1 flex justify-center py-8 px-4 md:px-8 mt-14 md:mt-0 pb-24 md:pb-8">
        <div className="max-w-2xl w-full">
          <Link href="/" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Feed
          </Link>
          
          <Card className="border-border/60 shadow-lg bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold">Start a Debate</CardTitle>
                  <CardDescription className="text-sm mt-1">Post a controversial topic, state your stance, and let the community engage.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                
                {error && (
                  <div className="bg-destructive/10 text-destructive text-sm font-medium p-3 rounded-lg flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <p>{error}</p>
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-sm font-semibold">Debate Topic <span className="text-destructive">*</span></Label>
                  <Input 
                    id="title" 
                    placeholder="e.g., Artificial intelligence will eliminate more jobs than it creates."
                    className="text-base font-medium h-12"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    maxLength={150}
                  />
                  <p className="text-xs text-muted-foreground text-right">{title.length}/150</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category" className="text-sm font-semibold">Category <span className="text-destructive">*</span></Label>
                  <Select value={categorySlug} onValueChange={setCategorySlug} required>
                    <SelectTrigger className="h-12 text-base">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.slug}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-semibold flex items-center justify-between">
                    <span>Background Context <span className="text-muted-foreground font-normal">(Optional)</span></span>
                  </Label>
                  <Textarea 
                    id="description" 
                    placeholder="Provide some background information or your initial argument..."
                    className="min-h-[120px] resize-none text-base"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
                
                {/* Media Upload */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Add Media (Photo, Video, Audio)</Label>
                  <div className="border-2 border-dashed border-border rounded-xl p-4 flex flex-col items-center justify-center gap-3 bg-secondary/20 hover:bg-secondary/40 transition-colors">
                    {!file ? (
                      <>
                        <div className="w-12 h-12 rounded-full bg-background flex items-center justify-center shadow-sm">
                          <ImageIcon className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-medium">Click to upload media</p>
                          <p className="text-xs text-muted-foreground mt-1">Supports JPG, PNG, MP4, MP3, WAV</p>
                        </div>
                        <Input 
                          type="file" 
                          accept="image/*,video/*,audio/*" 
                          className="hidden" 
                          id="media-upload"
                          onChange={handleFileChange}
                        />
                        <Label htmlFor="media-upload" className="cursor-pointer">
                          <Button type="button" variant="outline" size="sm" className="mt-2 pointer-events-none">
                            Select File
                          </Button>
                        </Label>
                      </>
                    ) : (
                      <div className="flex items-center justify-between w-full bg-background p-3 rounded-lg border border-border">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <Upload className="w-5 h-5 text-primary flex-shrink-0" />
                          <span className="text-sm font-medium truncate">{file.name}</span>
                        </div>
                        <Button type="button" variant="ghost" size="icon" onClick={() => setFile(null)} className="flex-shrink-0">
                          <X className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-secondary/30">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-semibold">Post Anonymously</Label>
                    <p className="text-xs text-muted-foreground">Hide your identity on this debate</p>
                  </div>
                  <Switch checked={isAnonymous} onCheckedChange={setIsAnonymous} />
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-12 text-base font-semibold rounded-xl" 
                  disabled={isSubmitting || !title || !categorySlug}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      {isUploading ? "Uploading Media..." : "Creating Debate..."}
                    </>
                  ) : (
                    "Publish Debate"
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
      
      <div className="hidden xl:block w-72 flex-shrink-0">
        <RightSidebar />
      </div>
    </div>
  )
}
