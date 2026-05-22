<div align="center">
  <img src="public/icon.svg" alt="DebateHub Logo" width="120" height="120" />
  <h1>🎙️ DebateHub</h1>
  <p><strong>A Next-Generation AI-Powered Social Debate Platform</strong></p>

  <p>
    <a href="#features">✨ Features</a> •
    <a href="#tech-stack">🛠️ Tech Stack</a> •
    <a href="#getting-started">🚀 Getting Started</a> •
    <a href="#ai-integration">🤖 AI Integration</a>
  </p>
</div>

---

## 🌟 Overview

**DebateHub** is a highly polished, modern platform designed for structured, civil, and engaging discussions. Unlike traditional social media platforms, DebateHub encourages well-thought-out arguments with the assistance of advanced AI models. Our platform makes it easy to participate in deep conversations on trending topics ranging from Technology and Science to Philosophy and Politics.

---

## ✨ Key Features

### 🗣️ Rich Social Debates
- **Interactive Feed:** Browse trending topics, new arguments, and hot debates seamlessly.
- **Vote & React:** Upvote compelling arguments, downvote trolls, and express your stance (Agree / Disagree) directly on the main feed.
- **Deep Threading:** Follow conversations with multi-level nested replies.
- **Follow Network:** Follow your favorite debaters and build your network.

### 🤖 AI-Powered Moderation & Insights
- **Smart Moderation:** Real-time AI filtering blocks toxic comments and personal attacks to keep discussions civil.
- **AI Debate Summaries:** Get an instant, unbiased summary of the core arguments from both sides using cutting-edge LLMs (via Groq/OpenRouter).
- **Anonymous Mode:** Debate sensitive topics safely with a built-in anonymous mode that masks your profile.

### 🎨 Premium UI/UX
- **Modern Glassmorphism Design:** Beautiful translucent sidebars, glowing hover effects, and crisp typography.
- **Fully Responsive:** Flawless experience whether you are on a massive desktop monitor or your phone.
- **Dark Mode Native:** A stunning, eye-friendly dark color palette by default.
- **Gamification:** Earn reputation points, level up, and climb the leaderboard as your arguments gain traction.

---

## 🛠️ Tech Stack

DebateHub is built on a modern, robust, and type-safe stack:

- **Frontend:** [Next.js 14](https://nextjs.org/) (App Router), React 18, TypeScript
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) & Radix UI Primitives (shadcn/ui)
- **Database/Auth (Mocked):** Designed for [Supabase](https://supabase.com/) integration. Currently ships with a highly robust local-storage powered mock client that perfectly simulates a real database, including joins, relations, authentication, and offline sync!
- **AI Integration:** [Groq](https://groq.com/) / [OpenRouter](https://openrouter.ai/) for high-speed LLM access (Llama 3).

---

## 🚀 Getting Started

To get a local copy up and running, follow these simple steps.

### 1. Clone the repository
```bash
git clone https://github.com/jojin1709/DEBATE-HUB.git
cd DEBATE-HUB
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Set up Environment Variables
Copy the example env file:
```bash
cp .env.example .env.development
```
Open `.env.development` and add your [Groq API Key](https://console.groq.com/keys) to enable AI features:
```env
GROQ_API_KEY=gsk_your_key_here
```

### 4. Run the Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser and start debating!

---

## 🤖 AI Configuration (Free Tier)

DebateHub utilizes high-performance models (like Meta's Llama 3) for content moderation and summarization. 
1. Get a completely **free** API key from [Groq Console](https://console.groq.com/keys).
2. Add it to your `.env` or deployment dashboard as `GROQ_API_KEY`.
3. If Groq is unavailable, you can also use `OPENROUTER_API_KEY` as a fallback!

---

## 📄 License

This project is open-source and available under the MIT License.
