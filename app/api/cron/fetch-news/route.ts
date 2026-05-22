import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/appwrite/server"
import { ID } from "node-appwrite"
import { Groq } from "groq-sdk"

const DATABASE_ID = "debatehub_main"

export async function GET(request: Request) {
  // 1. Verify Cron Secret to prevent unauthorized access
  const authHeader = request.headers.get("authorization")
  if (
    process.env.CRON_SECRET && 
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return new Response("Unauthorized", { status: 401 })
  }

  try {
    // 2. Fetch Latest Global News (Free NewsAPI Clone - no key required)
    const newsResponse = await fetch("https://saurav.tech/NewsAPI/top-headlines/category/general/us.json")
    const newsData = await newsResponse.json()
    
    if (!newsData.articles || newsData.articles.length === 0) {
      return NextResponse.json({ success: false, message: "No news found" })
    }

    // Get top 10 headlines
    const headlines = newsData.articles.slice(0, 10).map((article: any) => `${article.title}: ${article.description}`).join("\n")

    // 3. Send to AI to Pick the Best Debate Topic
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
    
    const aiResponse = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are an AI moderator for DebateHub. Review the following news headlines and pick the SINGLE most controversial, interesting, or globally significant topic. 
          Return ONLY a JSON object with this exact structure:
          {
            "title": "A short, catchy debate question",
            "description": "A 2-3 sentence neutral background of the news event explaining why it is being debated.",
            "category_slug": "politics" // Must be one of: politics, technology, science, philosophy, pop-culture
          }`
        },
        { role: "user", content: headlines }
      ],
      model: "llama-3.3-70b-specdec",
      response_format: { type: "json_object" }
    })

    const debateContent = JSON.parse(aiResponse.choices[0]?.message?.content || "{}")

    if (!debateContent.title) {
      return NextResponse.json({ success: false, message: "AI failed to generate debate" })
    }

    // 4. Create "DebateBot" User if it doesn't exist, or use a system placeholder
    const { databases } = await createAdminClient()
    
    // We will use a generic author ID for the AI bot
    const botId = "ai_debate_bot"
    
    try {
      // Ensure bot profile exists
      await databases.createDocument(DATABASE_ID, "profiles", botId, {
        username: "NewsBot",
        display_name: "DebateHub AI News",
        points: 9999,
        level: 99
      })
    } catch(e) {
      // Bot probably already exists
    }

    // 5. Insert Debate into Database
    const debate = await databases.createDocument(DATABASE_ID, "debates", ID.unique(), {
      title: debateContent.title,
      description: debateContent.description,
      category_id: debateContent.category_slug,
      author_id: botId,
      status: "active",
      agree_count: 0,
      disagree_count: 0,
      view_count: 0,
      is_live: true
    })

    return NextResponse.json({ success: true, debate })

  } catch (error: any) {
    console.error("Cron Error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
