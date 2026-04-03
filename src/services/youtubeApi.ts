import type { Market, TrendItem, Category, NicheItem, AISafety, CuratedNiche, ChannelResult } from "@/types";

const YT_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;

// ─── Core YouTube API Fetchers ────────────────────────────────────────────────

export async function fetchTrendingVideos(market: Market, maxResults = 50, query = "") {
  const regionCode = market === "US" ? "US" : "GB";
  try {
    let url = "";
    if (query) {
      const date30DaysAgo = new Date();
      date30DaysAgo.setDate(date30DaysAgo.getDate() - 30);
      const searchRes = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&q=${encodeURIComponent(query)}&regionCode=${regionCode}&maxResults=${maxResults}&publishedAfter=${date30DaysAgo.toISOString()}&order=viewCount&key=${YT_API_KEY}`
      );
      if (!searchRes.ok) throw new Error(`Search API error: ${searchRes.status}`);
      const searchData = await searchRes.json();
      const videoIds = searchData.items?.map((item: any) => item.id?.videoId).filter(Boolean).join(",");
      if (!videoIds) return [];
      url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${videoIds}&key=${YT_API_KEY}`;
    } else {
      url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&chart=mostPopular&regionCode=${regionCode}&maxResults=${maxResults}&key=${YT_API_KEY}`;
    }
    const res = await fetch(url);
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    const data = await res.json();
    return data.items || [];
  } catch (error) {
    console.error("YouTube API fetch failed:", error);
    return [];
  }
}

export async function fetchChannelStats(channelIds: string[]) {
  if (channelIds.length === 0) return {};
  try {
    const ids = channelIds.slice(0, 50).join(",");
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=${ids}&key=${YT_API_KEY}`
    );
    if (!res.ok) return {};
    const data = await res.json();
    const map: Record<string, number> = {};
    data.items?.forEach((ch: any) => {
      map[ch.id] = parseInt(ch.statistics?.subscriberCount || "0", 10);
    });
    return map;
  } catch {
    return {};
  }
}

/** Search for YouTube channels by niche query */
export async function searchChannelsByNiche(
  query: string,
  regionCode: string,
  maxResults = 10
): Promise<any[]> {
  try {
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${encodeURIComponent(query)}&regionCode=${regionCode}&maxResults=${maxResults}&order=relevance&key=${YT_API_KEY}`
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.items || [];
  } catch {
    return [];
  }
}

/** Fetch full channel details — stats, branding, etc. */
export async function fetchChannelDetails(channelIds: string[], rpm = 5): Promise<ChannelResult[]> {
  if (channelIds.length === 0) return [];
  try {
    const ids = channelIds.slice(0, 50).join(",");
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,brandingSettings&id=${ids}&key=${YT_API_KEY}`
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data.items || []).map((ch: any): ChannelResult => {
      const subs = parseInt(ch.statistics?.subscriberCount || "0", 10);
      const videos = parseInt(ch.statistics?.videoCount || "0", 10);
      const views = parseInt(ch.statistics?.viewCount || "0", 10);
      // Estimated monthly views = total views / channel age in months
      const publishedAt = ch.snippet?.publishedAt || new Date().toISOString();
      const ageMonths = Math.max(1, (Date.now() - new Date(publishedAt).getTime()) / (1000 * 60 * 60 * 24 * 30));
      const monthlyViews = Math.round(views / ageMonths);
      const estMonthlyRevenue = Math.round((monthlyViews * rpm) / 1000);
      const tier: ChannelResult["tier"] =
        subs >= 1_000_000 ? "mega" :
        subs >= 500_000 ? "large" :
        subs >= 100_000 ? "mid" :
        subs >= 10_000 ? "small" : "micro";
      return {
        id: ch.id,
        title: ch.snippet?.title || "Unknown Channel",
        description: ch.snippet?.description || "",
        thumbnail: ch.snippet?.thumbnails?.medium?.url || ch.snippet?.thumbnails?.default?.url || "",
        subscriberCount: subs,
        videoCount: videos,
        viewCount: views,
        customUrl: ch.snippet?.customUrl || "",
        publishedAt,
        estMonthlyRevenue,
        tier,
      };
    });
  } catch {
    return [];
  }
}

// ─── Data Processing ──────────────────────────────────────────────────────────

export function categorizeVideo(title: string, description: string, tags: string[] = []): Category {
  const text = `${title} ${description} ${tags.join(" ")}`.toLowerCase();
  if (/game|gaming|minecraft|fortnite|valorant|gta|playstation|xbox|nintendo|stream/i.test(text)) return "Gaming";
  if (/tech|iphone|android|apple|samsung|ai|chatgpt|tesla|review|unbox|phone|laptop/i.test(text)) return "Tech";
  if (/money|finance|stock|invest|crypto|bitcoin|trading|side hustle|make money/i.test(text)) return "Finance";
  if (/workout|fitness|health|diet|yoga|pilates|gym|weight/i.test(text)) return "Health";
  if (/learn|how to|tutorial|education|school|study|gcse|exam/i.test(text)) return "Education";
  if (/music|song|album|lyrics|concert/i.test(text)) return "Music";
  if (/football|sports|nfl|nba|premier league|f1|match/i.test(text)) return "Sports";
  if (/news|breaking|politics|election|government/i.test(text)) return "News";
  if (/diy|craft|build|make|home|garden|cook|recipe/i.test(text)) return "DIY";
  if (/celebrity|celeb|gossip|kardashian|drama|reality/i.test(text)) return "Celebrity";
  if (/royal|queen|king|crown|monarchy|palace|prince|princess/i.test(text)) return "Royal";
  if (/true crime|murder|crime|detective|mystery|investigation/i.test(text)) return "TrueCrime";
  if (/travel|trip|visit|explore|tour|destination/i.test(text)) return "Travel";
  if (/history|historical|ancient|war|heritage|century/i.test(text)) return "History";
  return "Entertainment";
}

export function extractKeywords(title: string, tags: string[] = []): string[] {
  const stopWords = new Set(["the","a","an","and","or","but","in","on","at","to","for","of","with","by","is","are","was","official","video","2024","2025"]);
  const words = title.toLowerCase().replace(/[^\w\s]/g, " ").split(/\s+/).filter(w => w.length > 2 && !stopWords.has(w));
  const combined = [...new Set([...words.slice(0, 3), ...tags.slice(0, 2).map(t => t.toLowerCase())])];
  return combined.slice(0, 5);
}

export function calculateVelocity(viewCount: number, likeCount: number, publishedAt: string): number {
  const hoursAgo = (Date.now() - new Date(publishedAt).getTime()) / (1000 * 60 * 60);
  const viewsPerHour = viewCount / Math.max(1, hoursAgo);
  const engagement = likeCount / Math.max(1, viewCount);
  const velocityBase = Math.log10(viewsPerHour + 1) * 20;
  const engagementBoost = engagement * 30;
  return Math.min(99, Math.max(40, Math.round(velocityBase + engagementBoost)));
}

export function opportunity(velocity: number, comp: number, small: number, views: number) {
  const lowComp = 100 - comp;
  const early = Math.min(100, Math.log10(views + 1) * 18);
  const smallDensity = Math.min(100, small * 12);
  return Math.round(0.4 * velocity + 0.3 * lowComp + 0.2 * early + 0.1 * smallDensity);
}

export function genMomentum(velocity: number, engagementRate: number) {
  const seed = (velocity + engagementRate * 1000) % 10;
  return Array.from({ length: 12 }, (_, i) => {
    const trend = velocity * (0.65 + (i * 0.035)) + (Math.sin(seed + i) * 5);
    return Math.max(5, Math.min(100, Math.round(trend)));
  });
}

export async function buildRealTrends(apiQuery = ""): Promise<TrendItem[]> {
  const [usVideos, ukVideos] = await Promise.all([
    fetchTrendingVideos("US", 40, apiQuery),
    fetchTrendingVideos("UK", 40, apiQuery)
  ]);
  const allVideos = [
    ...usVideos.map((v: any) => ({ ...v, market: "US" as Market })),
    ...ukVideos.map((v: any) => ({ ...v, market: "UK" as Market }))
  ];
  const channelIds = [...new Set(allVideos.map((v: any) => v.snippet.channelId))] as string[];
  const channelStats = await fetchChannelStats(channelIds);
  const trends: TrendItem[] = allVideos.map((video: any) => {
    const snippet = video.snippet;
    const stats = video.statistics || {};
    const market = video.market as Market;
    const viewCount = parseInt(stats.viewCount || "0", 10);
    const likeCount = parseInt(stats.likeCount || "0", 10);
    const commentCount = parseInt(stats.commentCount || "0", 10);
    const channelSubs = channelStats[snippet.channelId] || 50000;
    const velocity = calculateVelocity(viewCount, likeCount, snippet.publishedAt);
    const category = categorizeVideo(snippet.title, snippet.description, snippet.tags);
    const keywords = extractKeywords(snippet.title, snippet.tags);
    const engagementRate = viewCount > 0 ? (likeCount + commentCount) / viewCount : 0;
    const isRecent = (Date.now() - new Date(snippet.publishedAt).getTime()) < 24 * 60 * 60 * 1000;
    const competition = Math.max(15, Math.min(90, 70 - (engagementRate * 500) + (viewCount > 500000 ? 20 : 0) - (channelSubs < 10000 ? 15 : 0)));
    const saturation = Math.max(10, Math.min(95, 50 + (viewCount > 1000000 ? 25 : 0) - (isRecent ? 15 : 0)));
    const channelsUnder10k = channelSubs < 10000 ? 1 : 0;
    const channelsUnder50k = channelSubs < 50000 ? 1 : 0;
    const volume = Math.round(viewCount / Math.max(1, (Date.now() - new Date(snippet.publishedAt).getTime()) / (1000 * 60 * 60)));
    const oppScore = Math.max(0, Math.min(100, opportunity(velocity, competition, channelsUnder10k, viewCount)));
    const predictedPeak = isRecent ? Math.floor(velocity / 10) + 2 : Math.floor(velocity / 5) + 12;
    const contentGaps: string[] = [];
    if (!snippet.description?.includes(market === "US" ? "US" : "UK")) contentGaps.push(`no ${market}-specific angle`);
    if (snippet.title.length < 40) contentGaps.push("missing long-tail keywords");
    if (!/2024|2025|new|latest/i.test(snippet.title)) contentGaps.push("no freshness hook");
    if (engagementRate < 0.02) contentGaps.push("low engagement - improve hook");
    return {
      id: `${market}-${video.id}`,
      market, topic: snippet.title, keywords, category,
      velocity, volume, videosLast24h: isRecent ? 1 : 0,
      avgViews: viewCount, topChannelSubs: channelSubs,
      channelsUnder50k, channelsUnder10k,
      competition: Math.round(competition), saturation: Math.round(saturation),
      momentum: genMomentum(velocity, engagementRate),
      sentiment: Math.max(-0.3, Math.min(0.9, (likeCount / Math.max(1, likeCount + (viewCount * 0.01))) * 1.5 - 0.3)),
      thumbnailStyle: "clean", language: market === "US" ? "en-US" : "en-GB",
      opportunityScore: oppScore, predictedPeakInH: predictedPeak,
      contentGaps: contentGaps.slice(0, 3), related: keywords,
      lastUpdated: Date.now(), videoId: video.id,
      channelTitle: snippet.channelTitle, publishedAt: snippet.publishedAt,
      viewCount, likeCount,
    };
  });
  const seen = new Set<string>();
  return trends.filter(t => {
    const key = t.topic.toLowerCase().replace(/[^\w]/g, "").slice(0, 20);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).sort((a, b) => b.opportunityScore - a.opportunityScore);
}

// ─── RPM Benchmarks ───────────────────────────────────────────────────────────
export const RPM_BENCHMARKS: Record<string, number> = {
  Finance: 15, TrueCrime: 12, Tech: 10, Health: 10,
  Royal: 9, Celebrity: 8, History: 8, Education: 7,
  Food: 7, Travel: 7, DIY: 6, Rewinds: 6,
  Sports: 5, Gaming: 4, Entertainment: 3, Music: 2, News: 3,
};

// ─── AI Safety Ratings ────────────────────────────────────────────────────────
export const AI_SAFETY_MAP: Record<string, { rating: AISafety; reason: string }> = {
  Gaming:        { rating: "safe",     reason: "Gameplay commentary & reviews — very AI-automation friendly." },
  DIY:           { rating: "safe",     reason: "Tutorial & how-to content — AI voiceover + B-roll works well." },
  Education:     { rating: "safe",     reason: "Explainer format — perfect for AI-generated narration." },
  Entertainment: { rating: "safe",     reason: "General entertainment — broad and forgiving for AI channels." },
  Rewinds:       { rating: "safe",     reason: "Compilation & nostalgia content — AI scripting + footage works well. Use royalty-free clips." },
  Travel:        { rating: "safe",     reason: "AI voiceover + stock travel footage is well-established format." },
  History:       { rating: "safe",     reason: "Educational narration — AI scripts work well. Fact-check thoroughly." },
  Celebrity:     { rating: "risky",    reason: "Defamation risk — AI may generate inaccurate claims. Needs human review per video." },
  Royal:         { rating: "risky",    reason: "Factual accuracy critical — Royal-related misinformation can trigger strikes." },
  Food:          { rating: "safe",     reason: "Recipe & cooking content — AI scripts + B-roll footage works great." },
  TrueCrime:     { rating: "risky",    reason: "Sensitive content — must be factual. AI-generated crime details can be flagged." },
  Tech:          { rating: "risky",    reason: "Product claims & specs — risk of misinformation flags if AI errors." },
  Health:        { rating: "risky",    reason: "Medical content — YouTube YMYL policies; needs human review." },
  Finance:       { rating: "risky",    reason: "Financial advice regulations — disclaimers required, human oversight needed." },
  Sports:        { rating: "risky",    reason: "Broadcast rights issues — clips may trigger copyright. Commentary safer." },
  News:          { rating: "ban-risk", reason: "Misinformation policy — AI-generated news is very high-risk for bans." },
  Music:         { rating: "ban-risk", reason: "Copyright — cover/reaction content gets Content ID'd; original only." },
};

// ─── Curated Niche Library ────────────────────────────────────────────────────
export const CURATED_NICHES: Omit<CuratedNiche, "vph"|"marketCap"|"competition"|"opportunityScore"|"vphTrend"|"topKeywords"|"topVideo"|"channels"|"lastUpdated">[] = [
  // ── US Niches ────
  {
    id: "us-celebrity",
    name: "American Celebrity Gossip",
    emoji: "⭐",
    color: "#f59e0b",
    market: "US",
    category: "Celebrity",
    searchQuery: "celebrity gossip drama USA 2025",
    rpm: 8,
    aiSafety: "risky",
    aiSafetyReason: "Defamation risk — verify all claims before publishing. AI errors can trigger strikes.",
    automationTips: [
      "Use AI for script structure only — manually fact-check each claim",
      "Focus on official statements and confirmed news, not rumours",
      "Thumbnail: face + text overlay (emotion hook) — high CTR",
      "Publish within 24h of news breaking — freshness is king",
      "Add 'reaction' or 'explained' angle to avoid direct defamation",
    ],
    tags: ["celebrity", "gossip", "drama", "US", "pop culture"],
  },
  {
    id: "us-health",
    name: "American Health & Wellness",
    emoji: "💪",
    color: "#10b981",
    market: "US",
    category: "Health",
    searchQuery: "American health wellness tips lifestyle USA",
    rpm: 10,
    aiSafety: "risky",
    aiSafetyReason: "YMYL category — health misinformation is flagged hard. Always add disclaimer.",
    automationTips: [
      "Always add 'not medical advice' disclaimer in video + description",
      "Stick to general wellness (sleep, fitness, diet) — avoid specific conditions",
      "AI voiceover works well for listicle format: 'Top 10 habits...'",
      "Pair stock footage of exercise/food with AI narration",
      "High RPM ($10+) — one of the most monetizable topics",
    ],
    tags: ["health", "wellness", "fitness", "diet", "lifestyle"],
  },
  {
    id: "us-rewinds",
    name: "American Rewinds & Nostalgia",
    emoji: "📺",
    color: "#8b5cf6",
    market: "US",
    category: "Rewinds",
    searchQuery: "American nostalgia rewind moments viral USA history",
    rpm: 6,
    aiSafety: "safe",
    aiSafetyReason: "Historical compilation content — AI scripting works great. Use royalty-free or fair-use clips with commentary.",
    automationTips: [
      "Format: 'Remember when...' or 'This happened 10 years ago' — evergreen content",
      "Use AI to write nostalgic narration scripts — very natural fit",
      "Compile viral moments, decade reviews, cultural throwbacks",
      "Fair-use commentary is key — add opinions/analysis on each clip",
      "Great for bulk publishing — 2-3 videos per day feasible",
    ],
    tags: ["nostalgia", "rewind", "throwback", "viral", "America"],
  },
  {
    id: "us-truecrime",
    name: "US True Crime",
    emoji: "🔍",
    color: "#ef4444",
    market: "US",
    category: "TrueCrime",
    searchQuery: "true crime USA America documentary story",
    rpm: 12,
    aiSafety: "risky",
    aiSafetyReason: "Sensitive — must be factually accurate. Victims' families can flag inaccurate content.",
    automationTips: [
      "Use only verified public record information — court documents, police records",
      "AI draft scripts then human-edit for accuracy",
      "Dark, cinematic thumbnail style performs best in this niche",
      "Highest RPM per video of all niches — worth the extra care",
      "Add 'based on public records' disclaimer",
    ],
    tags: ["true crime", "mystery", "crime", "detective", "america"],
  },
  {
    id: "us-finance",
    name: "US Finance & Investing",
    emoji: "💰",
    color: "#22c55e",
    market: "US",
    category: "Finance",
    searchQuery: "personal finance investing money USA America",
    rpm: 15,
    aiSafety: "risky",
    aiSafetyReason: "Financial advice regulations — must include 'not financial advice' disclaimers.",
    automationTips: [
      "Always add: 'This is not financial advice' in video intro and description",
      "AI works well for: 'How to save $1000/month', budgeting guides",
      "Highest RPM niche ($15) — even 50K views = significant revenue",
      "Information-based content (not advice) is safer legally",
      "Target beginners — 'Finance for beginners' has lower competition",
    ],
    tags: ["finance", "investing", "money", "wealth", "budget"],
  },
  {
    id: "us-bbq-food",
    name: "American BBQ & Food",
    emoji: "🍖",
    color: "#f97316",
    market: "US",
    category: "Food",
    searchQuery: "American BBQ food recipes cooking USA",
    rpm: 6,
    aiSafety: "safe",
    aiSafetyReason: "Food & recipe content is very AI-automation friendly with stock footage.",
    automationTips: [
      "AI voiceover + stock food footage = full automation possible",
      "Format: recipe tutorials, state food comparisons, BBQ guides",
      "Regional angle: 'Texas BBQ vs Carolina BBQ' drives engagement",
      "Very low competition in regional food sub-niches",
      "Seasonal content (summer BBQ, Thanksgiving) gets huge spikes",
    ],
    tags: ["BBQ", "food", "recipe", "cooking", "American"],
  },
  {
    id: "us-sports",
    name: "US Sports Highlights",
    emoji: "🏈",
    color: "#3b82f6",
    market: "US",
    category: "Sports",
    searchQuery: "NFL NBA American football basketball highlights USA",
    rpm: 5,
    aiSafety: "risky",
    aiSafetyReason: "Broadcast rights — cannot use actual game footage. Commentary/analysis only.",
    automationTips: [
      "Never use official game footage — copyright strikes guaranteed",
      "commentary, predictions, and analysis are safe",
      "Focus: player news, trade analysis, game previews — no clips",
      "AI works well for 'Will X player get traded?' discussion format",
      "Great for evergreen: 'All time best NFL moments' (with graphics, no clips)",
    ],
    tags: ["NFL", "NBA", "sports", "football", "basketball"],
  },
  {
    id: "us-politics-commentary",
    name: "American Politics Commentary",
    emoji: "🗳️",
    color: "#6366f1",
    market: "US",
    category: "News",
    searchQuery: "American politics commentary explain USA news",
    rpm: 7,
    aiSafety: "ban-risk",
    aiSafetyReason: "Election integrity & political misinformation policies are heavily enforced. AI content in politics = very high ban risk.",
    automationTips: [
      "❌ Avoid fully AI-generated political content — extremely high ban risk",
      "If using AI: historical analysis only, never current election commentary",
      "Policy explanation (non-partisan) is relatively safer",
      "Add heavy disclaimers and ensure factual accuracy",
      "Best strategy: pivot to political history content instead",
    ],
    tags: ["politics", "USA", "commentary", "government", "policy"],
  },

  // ── UK Niches ────
  {
    id: "uk-royal-news",
    name: "Royal Family News",
    emoji: "👑",
    color: "#a855f7",
    market: "UK",
    category: "Royal",
    searchQuery: "Royal Family news UK 2025 latest",
    rpm: 9,
    aiSafety: "risky",
    aiSafetyReason: "Defamation risk for living royals — verify every claim. Factual news about public statements is safe.",
    automationTips: [
      "AI works for: Royal history, event recaps, palace announcements",
      "Stick to confirmed public news — avoid speculation about private matters",
      "Thumbnail: Royal portraits + '👑 BREAKING' text = high CTR",
      "Massive audience in UK AND US — dual-market opportunity",
      "Evergreen: 'History of the Royal Crown explained' style content",
    ],
    tags: ["royal family", "UK", "monarchy", "palace", "crown"],
  },
  {
    id: "uk-royal-history",
    name: "Royal Crown & British History",
    emoji: "🏰",
    color: "#7c3aed",
    market: "UK",
    category: "History",
    searchQuery: "British royal crown history monarchy heritage UK",
    rpm: 8,
    aiSafety: "safe",
    aiSafetyReason: "Historical documentary content — AI narration is perfect for this format. Low accuracy risk with historical facts.",
    automationTips: [
      "✅ Perfect for AI automation — historical narration scripts",
      "Use AI to write: 'Untold Story of [Historical Figure]' scripts",
      "Combine with royalty-free historical imagery and AI voiceover",
      "Evergreen content — videos stay relevant for years",
      "Sub-niches: Tudor era, Victorian Britain, WWII — all huge audiences",
    ],
    tags: ["crown", "monarchy", "British history", "heritage", "royal"],
  },
  {
    id: "uk-food-baking",
    name: "British Food & Great British Baking",
    emoji: "🫖",
    color: "#f59e0b",
    market: "UK",
    category: "Food",
    searchQuery: "British food baking recipe UK traditional",
    rpm: 7,
    aiSafety: "safe",
    aiSafetyReason: "Recipe & food content — AI scripting + stock footage is a proven fully-automated format.",
    automationTips: [
      "✅ Fully automated: AI script + stock kitchen footage + AI voiceover",
      "Focus: traditional British recipes, afternoon tea, pub food",
      "Great British Bake Off style format has massive audience",
      "Seasonal content: Christmas pudding, Easter simnel cake — spikes hugely",
      "UK food + American audience curiosity = huge cross-market appeal",
    ],
    tags: ["baking", "British food", "recipes", "UK cuisine", "tea"],
  },
  {
    id: "uk-truecrime",
    name: "UK True Crime",
    emoji: "🕵️",
    color: "#dc2626",
    market: "UK",
    category: "TrueCrime",
    searchQuery: "UK true crime documentary British crime story",
    rpm: 11,
    aiSafety: "risky",
    aiSafetyReason: "UK defamation laws are stricter than US — must only use verified public record information.",
    automationTips: [
      "UK defamation law is stricter than US — only verified public facts",
      "Focus on resolved, historical cases — avoid active investigations",
      "AI for narration script structure, human for final fact-check",
      "Strong UK + Australia audience crossover",
      "Victorian and WWII era crimes are safe (historical)",
    ],
    tags: ["UK crime", "British true crime", "crime", "mystery", "detective"],
  },
  {
    id: "uk-celebrity",
    name: "British Celebrity & Reality TV",
    emoji: "📸",
    color: "#ec4899",
    market: "UK",
    category: "Celebrity",
    searchQuery: "UK celebrity British reality TV drama Love Island 2025",
    rpm: 6,
    aiSafety: "risky",
    aiSafetyReason: "Defamation risk — UK has stronger privacy laws than US. Only cover confirmed public information.",
    automationTips: [
      "Focus on reality TV recaps (Love Island, X Factor, Strictly) — safer",
      "AI for recap scripts: 'What happened on Love Island last night'",
      "UK audience is very engaged with reality TV content",
      "Avoid private life speculation — stick to what's aired on TV",
      "Reaction + commentary format reduces defamation risk",
    ],
    tags: ["UK celebrity", "reality TV", "Love Island", "British TV", "gossip"],
  },
  {
    id: "uk-premier-league",
    name: "Premier League & British Football",
    emoji: "⚽",
    color: "#3b82f6",
    market: "UK",
    category: "Sports",
    searchQuery: "Premier League football UK highlights analysis 2025",
    rpm: 5,
    aiSafety: "risky",
    aiSafetyReason: "Premier League clips are heavily protected. Analysis and commentary are safe — no match footage.",
    automationTips: [
      "Never use match footage — Premier League has aggressive copyright enforcement",
      "AI works for: predictions, player analysis, transfer news",
      "Format: 'Who will win the title?' opinion content = no copyright risk",
      "Use graphics/charts for stats — completely safe",
      "Massive UK audience — low quality bar needed, just consistency",
    ],
    tags: ["Premier League", "football", "UK sport", "EPL", "soccer"],
  },
  {
    id: "uk-history",
    name: "British History & Heritage",
    emoji: "📜",
    color: "#0ea5e9",
    market: "UK",
    category: "History",
    searchQuery: "British history heritage UK documentary",
    rpm: 8,
    aiSafety: "safe",
    aiSafetyReason: "Historical educational content — perfect for AI automation with narration + archive imagery.",
    automationTips: [
      "✅ Ideal for AI: narration scripts + historical image B-roll",
      "Topics: Tudor kings, Victorian era, World War history, Empire era",
      "Both UK AND US audiences love British history content",
      "Evergreen — videos from 3 years ago still get views",
      "Low competition vs high search volume = great opportunity",
    ],
    tags: ["British history", "Tudor", "Victorian", "WWII", "heritage"],
  },
  {
    id: "uk-travel",
    name: "UK Travel & British Countryside",
    emoji: "🌿",
    color: "#16a34a",
    market: "UK",
    category: "Travel",
    searchQuery: "UK travel countryside British village explore guide",
    rpm: 7,
    aiSafety: "safe",
    aiSafetyReason: "Travel content is fully AI-automatable with stock footage + AI voiceover.",
    automationTips: [
      "✅ Fully automated: stock countryside footage + AI narration",
      "Format: 'Most beautiful villages in England', 'Hidden UK gems'",
      "Massive American audience curious about UK travel",
      "Seasonal content: British autumn leaves, Christmas markets — spikes huge",
      "Sub-niche: UK castles, Scottish Highlands, Welsh coast — all underserved",
    ],
    tags: ["UK travel", "British countryside", "villages", "Scotland", "England"],
  },
];

// ─── Build Curated Niches with Live Data ─────────────────────────────────────

export async function buildCuratedNiches(market: "US" | "UK" | "Both" = "Both"): Promise<CuratedNiche[]> {
  const nicheList = market === "Both"
    ? CURATED_NICHES
    : CURATED_NICHES.filter(n => n.market === market);

  // Fetch data for all niches in parallel (batch to avoid API rate limits)
  const results = await Promise.allSettled(
    nicheList.map(async (niche) => {
      const regionCode = niche.market === "US" ? "US" : "GB";

      // Fetch videos for this niche
      const videos = await fetchTrendingVideos(niche.market, 15, niche.searchQuery);

      // Fetch channels for this niche
      const channelSearchResults = await searchChannelsByNiche(niche.searchQuery, regionCode, 8);
      const channelIds = channelSearchResults
        .map((r: any) => r.id?.channelId || r.snippet?.channelId)
        .filter(Boolean) as string[];
      const channels = await fetchChannelDetails(channelIds, niche.rpm);

      // Process video metrics
      let vph = 0;
      let competition = 60;
      let totalViews = 0;
      const keywordMap: Record<string, number> = {};
      let topVideo: CuratedNiche["topVideo"] = null;
      let maxViews = 0;

      videos.forEach((v: any) => {
        const viewCount = parseInt(v.statistics?.viewCount || "0", 10);
        const likeCount = parseInt(v.statistics?.likeCount || "0", 10);
        const hoursAgo = Math.max(1, (Date.now() - new Date(v.snippet.publishedAt).getTime()) / (1000 * 60 * 60));
        vph += Math.round(viewCount / hoursAgo);
        totalViews += viewCount;
        const engRate = viewCount > 0 ? (likeCount / viewCount) : 0;
        competition = Math.max(15, Math.min(90, 70 - engRate * 500));
        const kws = extractKeywords(v.snippet.title, v.snippet.tags || []);
        kws.forEach((k: string) => { keywordMap[k] = (keywordMap[k] || 0) + 1; });
        if (viewCount > maxViews) {
          maxViews = viewCount;
          topVideo = {
            title: v.snippet.title,
            videoId: v.id,
            viewCount,
            channelTitle: v.snippet.channelTitle,
          };
        }
      });

      const topKeywords = Object.entries(keywordMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(e => e[0]);

      const estimatedMonthlyViews = totalViews * 20;
      const marketCap = Math.round((estimatedMonthlyViews * niche.rpm) / 1000);

      // Opportunity score
      const avgVelocity = 65;
      const smallWins = channels.filter(c => c.tier === "micro" || c.tier === "small").length;
      const opportunityScore = Math.round(
        0.35 * avgVelocity +
        0.30 * (100 - competition) +
        0.20 * Math.min(100, Math.log10(totalViews + 1) * 18) +
        0.15 * Math.min(100, smallWins * 20)
      );

      // VPH trend (simulated from real data)
      const vphTrend = Array.from({ length: 12 }, (_, i) => {
        return Math.max(1, Math.round(vph * (0.5 + (i * 0.05)) + (Math.random() * vph * 0.1)));
      });

      return {
        ...niche,
        vph,
        marketCap,
        competition: Math.round(competition),
        opportunityScore: Math.min(99, Math.max(20, opportunityScore)),
        vphTrend,
        topKeywords,
        topVideo,
        channels: channels.sort((a, b) => b.subscriberCount - a.subscriberCount),
        lastUpdated: Date.now(),
      } as CuratedNiche;
    })
  );

  return results
    .filter((r): r is PromiseFulfilledResult<CuratedNiche> => r.status === "fulfilled")
    .map(r => r.value)
    .sort((a, b) => b.opportunityScore - a.opportunityScore);
}

// ─── Legacy NicheItem builder (still used by useNiches hook) ─────────────────
export async function buildNiches(market: "US" | "UK" | "Both" = "Both", apiQuery = ""): Promise<NicheItem[]> {
  const trends = await buildRealTrends(apiQuery);
  const filtered = market === "Both" ? trends : trends.filter(t => t.market === market);
  const groups: Record<string, TrendItem[]> = {};
  for (const item of filtered) {
    const cat = item.category === "All" ? "Entertainment" : item.category;
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(item);
  }
  const niches: NicheItem[] = Object.entries(groups).map(([cat, videos]) => {
    const rpm = RPM_BENCHMARKS[cat] ?? 3;
    const safety = AI_SAFETY_MAP[cat] ?? { rating: "risky" as AISafety, reason: "Unknown — review manually." };
    const totalVPH = videos.reduce((s, v) => s + v.volume, 0);
    const totalViews = videos.reduce((s, v) => s + v.viewCount, 0);
    const avgComp = Math.round(videos.reduce((s, v) => s + v.competition, 0) / videos.length);
    const avgOpp = Math.round(videos.reduce((s, v) => s + v.opportunityScore, 0) / videos.length);
    const avgSubs = Math.round(videos.reduce((s, v) => s + v.topChannelSubs, 0) / videos.length);
    const smallWins = videos.filter(v => v.channelsUnder10k > 0).length;
    const estimatedMonthlyViews = totalViews * 20;
    const marketCap = Math.round((estimatedMonthlyViews * rpm) / 1000);
    const vphTrend = Array.from({ length: 12 }, (_, i) => {
      const subset = videos.slice(0, Math.max(1, Math.floor(videos.length * (i + 1) / 12)));
      return Math.max(1, Math.round(subset.reduce((s, v) => s + v.volume, 0) / Math.max(1, i + 1)));
    });
    const kwMap: Record<string, number> = {};
    videos.forEach(v => v.keywords.forEach((k: string) => { kwMap[k] = (kwMap[k] || 0) + 1; }));
    const topKeywords = Object.entries(kwMap).sort((a, b) => b[1] - a[1]).slice(0, 6).map(e => e[0]);
    const topVideo = videos.sort((a, b) => b.viewCount - a.viewCount)[0];
    return {
      id: `niche-${cat}-${market}`,
      niche: cat as Category, market,
      rpm, vph: totalVPH, marketCap,
      competitorCount: videos.length, avgCompetitorSubs: avgSubs,
      competition: avgComp, opportunityScore: avgOpp,
      aiSafety: safety.rating, aiSafetyReason: safety.reason,
      topKeywords, vphTrend,
      topVideo: topVideo ? { title: topVideo.topic, videoId: topVideo.videoId, viewCount: topVideo.viewCount, channelTitle: topVideo.channelTitle } : null,
      totalViews, smallChannelWins: smallWins, lastUpdated: Date.now(),
    };
  });
  return niches.sort((a, b) => b.opportunityScore - a.opportunityScore);
}