"use server"

import { Comment } from './actions/comments'

async function callAI(systemPrompt: string, userPrompt: string): Promise<string> {
  const groqKey = process.env.GROQ_API_KEY
  const openRouterKey = process.env.OPENROUTER_API_KEY

  if (groqKey) {
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${groqKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-specdec",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          temperature: 0.3
        })
      })
      if (res.ok) {
        const json = await res.json()
        return json.choices?.[0]?.message?.content || ""
      }
    } catch (e) {
      console.error("Groq API Call Failed, trying OpenRouter fallback:", e)
    }
  }

  if (openRouterKey) {
    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${openRouterKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "meta-llama/llama-3-8b-instruct:free",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          temperature: 0.3
        })
      })
      if (res.ok) {
        const json = await res.json()
        return json.choices?.[0]?.message?.content || ""
      }
    } catch (e) {
      console.error("OpenRouter API Call Failed, falling back to Mock:", e)
    }
  }

  return ""
}

export async function moderateComment(content: string): Promise<{
  isToxic: boolean
  score: number
  reason: string | null
}> {
  const cleanContent = content.trim().toLowerCase()
  
  // Toxicity words mock list
  const badWords = ["idiot", "stupid", "dumb", "fuck", "hate", "trash", "shut up", "asshole", "bitch"]
  const containsBadWord = badWords.some(word => cleanContent.includes(word))

  if (containsBadWord) {
    return {
      isToxic: true,
      score: 0.85,
      reason: "Comment contains uncivil language or personal attacks, violating our community standards for respectful debate."
    }
  }

  // Attempt real AI moderation if keys configured
  const systemPrompt = `You are an AI moderator for DebateHub, a civil social debate platform. Your task is to analyze comments and identify toxicity, personal attacks, hate speech, harassment, or extreme incivility. Respond ONLY in valid JSON format:
{
  "isToxic": boolean,
  "score": number, // 0.0 (civil) to 1.0 (highly toxic)
  "reason": string | null
}`
  
  const userPrompt = `Analyze the following comment: "${content}"`
  
  const responseText = await callAI(systemPrompt, userPrompt)
  if (responseText) {
    try {
      // Find JSON block if wrapped
      const jsonStart = responseText.indexOf('{')
      const jsonEnd = responseText.lastIndexOf('}')
      if (jsonStart !== -1 && jsonEnd !== -1) {
        const jsonStr = responseText.substring(jsonStart, jsonEnd + 1)
        const result = JSON.parse(jsonStr)
        return {
          isToxic: !!result.isToxic,
          score: Number(result.score) || 0,
          reason: result.reason || null
        }
      }
    } catch (e) {
      console.error("Failed to parse moderation JSON:", e)
    }
  }

  // Safe fallback if no issues and API failed/not configured
  return {
    isToxic: false,
    score: 0.05,
    reason: null
  }
}

export async function generateDebateSummary(
  title: string,
  description: string,
  comments: Comment[]
): Promise<{
  summary: string
  keyPoints: string[]
}> {
  const agreeComments = comments.filter(c => c.stance === 'agree').map(c => c.content).slice(0, 5).join("\n- ")
  const disagreeComments = comments.filter(c => c.stance === 'disagree').map(c => c.content).slice(0, 5).join("\n- ")

  const systemPrompt = `You are a debate analyst. Synthesize the core arguments from both the agreeing and disagreeing sides of a debate. Produce a response in valid JSON format:
{
  "summary": "A concise, objective 3-4 sentence paragraph summarizing the debate's current state.",
  "keyPoints": [
    "Key point 1 summarizing the main agreement arguments",
    "Key point 2 summarizing the main disagreement arguments",
    "Key point 3 highlighting the major point of conflict"
  ]
}`

  const userPrompt = `Debate Title: ${title}
Debate Description: ${description}
Agree Arguments:
- ${agreeComments || "None yet."}
Disagree Arguments:
- ${disagreeComments || "None yet."}`

  const responseText = await callAI(systemPrompt, userPrompt)
  if (responseText) {
    try {
      const jsonStart = responseText.indexOf('{')
      const jsonEnd = responseText.lastIndexOf('}')
      if (jsonStart !== -1 && jsonEnd !== -1) {
        const jsonStr = responseText.substring(jsonStart, jsonEnd + 1)
        const result = JSON.parse(jsonStr)
        return {
          summary: result.summary || "",
          keyPoints: result.keyPoints || []
        }
      }
    } catch (e) {
      console.error("Failed to parse summary JSON:", e)
    }
  }

  // Premium Mock summary builder
  const samplePoints = [
    "Agreeing arguments focus on the acceleration of innovation and productivity gains.",
    "Disagreeing arguments emphasize risks of displacement, inequality, and safety concerns.",
    "The central clash lies in balancing speed of advancement against the robustness of safety guards."
  ]

  return {
    summary: `The debate on "${title}" highlights critical divisions in perspective. Proponents emphasize the transformative opportunities and efficiency enhancements. Opponents voice substantial concern over structural changes, ethical implications, and safety mitigations. The discussion reflects a broader societal challenge in navigating rapid technological and philosophical transitions.`,
    keyPoints: samplePoints
  }
}

export async function suggestRebuttals(
  debateTitle: string,
  commentContent: string,
  stance: 'agree' | 'disagree' | 'neutral'
): Promise<string[]> {
  const systemPrompt = `You are a debate mentor. Given a debate topic, a specific comment, and the user's intended stance, suggest 3 constructive, polite, and persuasive counter-arguments or rebuttals to help them draft their response. Return ONLY a JSON string array of 3 suggestions:
[
  "Suggestion 1...",
  "Suggestion 2...",
  "Suggestion 3..."
]`

  const userPrompt = `Debate Topic: ${debateTitle}
Opposing/Reference Comment: ${commentContent}
My Intended Stance: ${stance}`

  const responseText = await callAI(systemPrompt, userPrompt)
  if (responseText) {
    try {
      const jsonStart = responseText.indexOf('[')
      const jsonEnd = responseText.lastIndexOf(']')
      if (jsonStart !== -1 && jsonEnd !== -1) {
        const jsonStr = responseText.substring(jsonStart, jsonEnd + 1)
        const result = JSON.parse(jsonStr)
        if (Array.isArray(result)) return result
      }
    } catch (e) {
      console.error("Failed to parse rebuttal suggestions JSON:", e)
    }
  }

  // Realistic fallback suggestions
  if (stance === 'agree') {
    return [
      "Highlight the empirical evidence supporting the positive correlation between the proposal and long-term societal growth.",
      "Address safety risks head-on by arguing that proactive regulation can mitigate them without stifling the core benefits.",
      "Argue that historical transitions demonstrate that initial friction is followed by major improvements in quality of life."
    ]
  } else if (stance === 'disagree') {
    return [
      "Point out the immediate negative externalities that are frequently overlooked by optimistic projections.",
      "Argue that the velocity of the change makes safe adaptation nearly impossible without substantial guardrails first.",
      "Emphasize the ethical imperative to protect vulnerable segments of the population who bear the brunt of the transition."
    ]
  } else {
    return [
      "Argue that a hybrid approach incorporating parts of both views offers the most stable and risk-managed outcome.",
      "Advocate for a delayed implementation or testing phase to observe outcomes before committing fully to one stance.",
      "Emphasize that the debate is not binary and requires a nuanced understanding of localized impacts."
    ]
  }
}
