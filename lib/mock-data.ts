export const categories = [
  { label: "All", value: "all" },
  { label: "Politics", value: "politics" },
  { label: "Technology", value: "technology" },
  { label: "Science", value: "science" },
  { label: "Economy", value: "economy" },
  { label: "Climate", value: "climate" },
  { label: "Society", value: "society" },
  { label: "Philosophy", value: "philosophy" },
]

export const categoryColors: Record<string, string> = {
  politics: "bg-rose-100 text-rose-700",
  technology: "bg-blue-100 text-blue-700",
  science: "bg-teal-100 text-teal-700",
  economy: "bg-amber-100 text-amber-700",
  climate: "bg-green-100 text-green-700",
  society: "bg-orange-100 text-orange-700",
  philosophy: "bg-indigo-100 text-indigo-700",
}

export interface DebateParticipant {
  initials: string
  color: string
}

export interface Comment {
  author: string
  text: string
  time: string
}

export interface Debate {
  id: string
  title: string
  category: string
  agreePercent: number
  disagreePercent: number
  participants: number
  participantAvatars: DebateParticipant[]
  commentCount: number
  isLive: boolean
  aiSummary?: string
  topComment: Comment
  timeAgo: string
  views: number
}

export const debates: Debate[] = [
  {
    id: "1",
    title: "Artificial intelligence will eliminate more jobs than it creates within the next decade",
    category: "technology",
    agreePercent: 62,
    disagreePercent: 38,
    participants: 1847,
    participantAvatars: [
      { initials: "SW", color: "bg-blue-500" },
      { initials: "MK", color: "bg-emerald-500" },
      { initials: "RL", color: "bg-rose-500" },
      { initials: "AZ", color: "bg-amber-500" },
    ],
    commentCount: 342,
    isLive: true,
    aiSummary: "AI analysis suggests 68% of arguments focus on automation of repetitive tasks, with key disagreements around reskilling timelines.",
    topComment: {
      author: "SilverFox92",
      text: "History shows every technological revolution eventually creates more jobs than it destroys — why would AI be different?",
      time: "2m ago",
    },
    timeAgo: "3h ago",
    views: 24_500,
  },
  {
    id: "2",
    title: "Universal Basic Income is the most viable solution to growing wealth inequality",
    category: "economy",
    agreePercent: 55,
    disagreePercent: 45,
    participants: 2310,
    participantAvatars: [
      { initials: "PM", color: "bg-purple-500" },
      { initials: "CJ", color: "bg-cyan-500" },
      { initials: "KT", color: "bg-pink-500" },
    ],
    commentCount: 518,
    isLive: true,
    aiSummary: "Polarized debate — agree side cites Nordic models while disagree side emphasizes inflation risks and work disincentives.",
    topComment: {
      author: "NightOwlDebater",
      text: "The real question isn't whether it works but who gets to define what counts as 'universal'.",
      time: "7m ago",
    },
    timeAgo: "1h ago",
    views: 31_200,
  },
  {
    id: "3",
    title: "Social media companies should be held legally liable for content on their platforms",
    category: "society",
    agreePercent: 71,
    disagreePercent: 29,
    participants: 985,
    participantAvatars: [
      { initials: "BW", color: "bg-orange-500" },
      { initials: "HN", color: "bg-teal-500" },
      { initials: "VI", color: "bg-violet-500" },
      { initials: "YO", color: "bg-lime-500" },
    ],
    commentCount: 207,
    isLive: false,
    topComment: {
      author: "DigitalNomad77",
      text: "Section 230 is 25 years old — it was never designed for billion-user platforms.",
      time: "34m ago",
    },
    timeAgo: "5h ago",
    views: 8_900,
  },
  {
    id: "4",
    title: "Nuclear energy is essential for achieving net-zero carbon emissions by 2050",
    category: "climate",
    agreePercent: 48,
    disagreePercent: 52,
    participants: 1432,
    participantAvatars: [
      { initials: "FE", color: "bg-sky-500" },
      { initials: "LG", color: "bg-green-500" },
    ],
    commentCount: 389,
    isLive: true,
    aiSummary: "Arguments are closely split — safety concerns dominate opposition while proponents emphasize baseload reliability.",
    topComment: {
      author: "GreenFuturist",
      text: "Renewables + storage are scaling faster than any nuclear build has in history. Why bet on old tech?",
      time: "12m ago",
    },
    timeAgo: "2h ago",
    views: 17_600,
  },
  {
    id: "5",
    title: "Democracy is incompatible with the speed required for modern climate action",
    category: "politics",
    agreePercent: 33,
    disagreePercent: 67,
    participants: 762,
    participantAvatars: [
      { initials: "RK", color: "bg-red-500" },
      { initials: "OM", color: "bg-indigo-500" },
      { initials: "TB", color: "bg-yellow-500" },
    ],
    commentCount: 156,
    isLive: false,
    topComment: {
      author: "PhilosophyMajor",
      text: "This is a false dichotomy — democracies can move fast when the public is adequately informed.",
      time: "1h ago",
    },
    timeAgo: "8h ago",
    views: 6_100,
  },
  {
    id: "6",
    title: "Consciousness is purely a product of physical brain processes — there is no 'soul'",
    category: "philosophy",
    agreePercent: 44,
    disagreePercent: 56,
    participants: 1128,
    participantAvatars: [
      { initials: "QR", color: "bg-fuchsia-500" },
      { initials: "ZP", color: "bg-slate-500" },
      { initials: "WS", color: "bg-rose-400" },
    ],
    commentCount: 294,
    isLive: false,
    topComment: {
      author: "QuantumMindX",
      text: "We can't explain qualia through physical processes yet — the hard problem of consciousness remains unsolved.",
      time: "2h ago",
    },
    timeAgo: "12h ago",
    views: 11_400,
  },
]
