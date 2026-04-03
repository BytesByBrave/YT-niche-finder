import type { Market, TrendItem, Category, NicheItem, AISafety } from "@/types";

const YT_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;

// --- Real YouTube API Integration ---
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

// --- Data processing functions ---
export function categorizeVideo(title: string, description: string, tags: string[] = []): Category {
  const text = `${title} ${description} ${tags.join(" ")}`.toLowerCase();
  if (/game|gaming|minecraft|fortnite|valorant|gta|playstation|xbox|nintendo|stream/i.test(text)) return "Gaming";
  if (/tech|iphone|android|apple|samsung|ai|chatgpt|tesla|review|unbox|phone|laptop/i.test(text)) return "Tech";
  if (/money|finance|stock|invest|crypto|bitcoin|trading|side hustle|make money/i.test(text)) return "Finance";
  if (/workout|fitness|health|diet|yoga|pilates|gym|weight/i.test(text)) return "Health";
  if (/learn|how to|tutorial|education|school|study|gcse|exam/i.test(text)) return "Education";
  if (/music|song|album|video|official|lyrics|concert/i.test(text)) return "Music";
  if (/football|sports|nfl|nba|premier league|f1|match|game/i.test(text)) return "Sports";
  if (/news|breaking|politics|election|government/i.test(text)) return "News";
  if (/diy|craft|build|make|home|garden|cook|recipe/i.test(text)) return "DIY";
  return "Entertainment";
}

export function extractKeywords(title: string, tags: string[] = []): string[] {
  const stopWords = new Set(["the","a","an","and","or","but","in","on","at","to","for","of","with","by","is","are","was","official","video","2024","2025"]);
  const words = title.toLowerCase().replace(/[^\w\s]/g, " ").split(/\s+/).filter(w => w.length > 2 && !stopWords.has(w));
  const combined = [...new Set([...words.slice(0, 3), ...tags.slice(0, 2).map(t => t.toLowerCase())])];
  return combined.slice(0, 5);
}

export function detectThumbnailStyle(title: string): "face" | "text-heavy" | "mystery" | "clean" {
  const t = title.toLowerCase();
  if (/\?|!|shocking|crazy|insane|you won't|secret/i.test(t)) return "mystery";
  if (/\d+.*tips|how to|guide|tutorial|explained/i.test(t)) return "text-heavy";
  if (/i tried|my|react|face reveal|meet/i.test(t)) return "face";
  return "clean";
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
    const thumbnailStyle = detectThumbnailStyle(snippet.title);

    const engagementRate = viewCount > 0 ? (likeCount + commentCount) / viewCount : 0;
    const isRecent = (Date.now() - new Date(snippet.publishedAt).getTime()) < 24 * 60 * 60 * 1000;

    const competition = Math.max(15, Math.min(90,
      70 - (engagementRate * 500) + (viewCount > 500000 ? 20 : 0) - (channelSubs < 10000 ? 15 : 0)
    ));

    const saturation = Math.max(10, Math.min(95,
      50 + (viewCount > 1000000 ? 25 : 0) - (isRecent ? 15 : 0)
    ));

    const channelsUnder10k = channelSubs < 10000 ? 1 : 0;
    const channelsUnder50k = channelSubs < 50000 ? 1 : 0;
    const volume = Math.round(viewCount / Math.max(1, (Date.now() - new Date(snippet.publishedAt).getTime()) / (1000 * 60 * 60)));
    const oppScore = Math.max(0, Math.min(100, opportunity(velocity, competition, channelsUnder10k, viewCount)));
    const predictedPeak = isRecent ? Math.floor(velocity / 10) + 2 : Math.floor(velocity / 5) + 12;

    const contentGaps = [];
    if (!snippet.description?.includes(market === "US" ? "US" : "UK")) contentGaps.push(`no ${market}-specific angle`);
    if (snippet.title.length < 40) contentGaps.push("missing long-tail keywords");
    if (!/2024|2025|new|latest/i.test(snippet.title)) contentGaps.push("no freshness hook");
    if (engagementRate < 0.02) contentGaps.push("low engagement - improve hook");

    return {
      id: `${market}-${video.id}`,
      market,
      topic: snippet.title,
      keywords,
      category,
      velocity,
      volume,
      videosLast24h: isRecent ? 1 : 0,
      avgViews: viewCount,
      topChannelSubs: channelSubs,
      channelsUnder50k,
      channelsUnder10k,
      competition: Math.round(competition),
      saturation: Math.round(saturation),
      momentum: genMomentum(velocity, engagementRate),
      sentiment: Math.max(-0.3, Math.min(0.9, (likeCount / Math.max(1, likeCount + (viewCount * 0.01))) * 1.5 - 0.3)),
      thumbnailStyle,
      language: market === "US" ? "en-US" : "en-GB",
      opportunityScore: oppScore,
      predictedPeakInH: predictedPeak,
      contentGaps: contentGaps.slice(0, 3),
      related: keywords,
      lastUpdated: Date.now(),
      videoId: video.id,
      channelTitle: snippet.channelTitle,
      publishedAt: snippet.publishedAt,
      viewCount,
      likeCount,
    };
  });

  const seen = new Set<string>();
  const unique = trends.filter(t => {
    const key = t.topic.toLowerCase().replace(/[^\w]/g, "").slice(0, 20);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return unique.sort((a, b) => b.opportunityScore - a.opportunityScore);
}

// --- RPM benchmarks per category (USD, industry standard estimates) ---
const RPM_BENCHMARKS: Record<string, number> = {
  Finance: 15,
  Tech: 10,
  Health: 8,
  Education: 7,
  DIY: 6,
  Sports: 5,
  Gaming: 4,
  Entertainment: 3,
  Music: 2,
  News: 3,
};

// --- AI safety ratings per category ---
const AI_SAFETY: Record<string, { rating: AISafety; reason: string }> = {
  Gaming:        { rating: "safe",     reason: "Gameplay commentary & reviews — very AI-automation friendly, low ban risk." },
  DIY:           { rating: "safe",     reason: "Tutorial & how-to content — AI voiceover + B-roll works well, low risk." },
  Education:     { rating: "safe",     reason: "Explainer & tutorial format — perfect for AI-generated narration." },
  Entertainment: { rating: "safe",     reason: "General entertainment — broad and forgiving, good for AI channels." },
  Tech:          { rating: "risky",    reason: "Product claims & specs — risk of misinformation flags if AI makes errors." },
  Health:        { rating: "risky",    reason: "Medical content — YouTube's YMYL policies; AI content needs human review." },
  Finance:       { rating: "risky",    reason: "Financial advice regulations — disclaimer required, human oversight needed." },
  Sports:        { rating: "risky",    reason: "Broadcast rights issues — clips may trigger copyright. Commentary is safer." },
  News:          { rating: "ban-risk", reason: "Misinformation policy — AI-generated news is high-risk for strikes & bans." },
  Music:         { rating: "ban-risk", reason: "Copyright — cover/reaction content gets Content ID'd; original only is safe." },
};

/** Build niche-level aggregated data from real YouTube video data */
export async function buildNiches(market: "US" | "UK" | "Both" = "Both", apiQuery = ""): Promise<NicheItem[]> {
  const trends = await buildRealTrends(apiQuery);

  // Filter by market if needed
  const filtered = market === "Both" ? trends : trends.filter(t => t.market === market);

  // Group by category
  const groups: Record<string, TrendItem[]> = {};
  for (const item of filtered) {
    const cat = item.category === "All" ? "Entertainment" : item.category;
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(item);
  }

  const niches: NicheItem[] = Object.entries(groups).map(([cat, videos]) => {
    const rpm = RPM_BENCHMARKS[cat] ?? 3;
    const safety = AI_SAFETY[cat] ?? { rating: "risky" as AISafety, reason: "Unknown category — review manually." };

    // Aggregate metrics
    const totalVPH = videos.reduce((s, v) => s + v.volume, 0);
    const totalViews = videos.reduce((s, v) => s + v.viewCount, 0);
    const avgComp = Math.round(videos.reduce((s, v) => s + v.competition, 0) / videos.length);
    const avgOpp = Math.round(videos.reduce((s, v) => s + v.opportunityScore, 0) / videos.length);
    const avgSubs = Math.round(videos.reduce((s, v) => s + v.topChannelSubs, 0) / videos.length);
    const smallWins = videos.filter(v => v.channelsUnder10k > 0).length;

    // Market cap: estimated monthly views * rpm / 1000
    // totalViews from ~24h of trending, scale to 30 days, weighted conservatively
    const estimatedMonthlyViews = totalViews * 20; // ~20x daily sample = conservative monthly
    const marketCap = Math.round((estimatedMonthlyViews * rpm) / 1000);

    // Build VPH trend sparkline (simulate 12 recent points from video data)
    const vphTrend = Array.from({ length: 12 }, (_, i) => {
      const subset = videos.slice(0, Math.max(1, Math.floor(videos.length * (i + 1) / 12)));
      const vph = subset.reduce((s, v) => s + v.volume, 0);
      return Math.max(1, Math.round(vph / Math.max(1, i + 1)));
    });

    // Top keywords across niche
    const kwMap: Record<string, number> = {};
    videos.forEach(v => v.keywords.forEach(k => { kwMap[k] = (kwMap[k] || 0) + 1; }));
    const topKeywords = Object.entries(kwMap).sort((a, b) => b[1] - a[1]).slice(0, 6).map(e => e[0]);

    // Top video
    const topVideo = videos.sort((a, b) => b.viewCount - a.viewCount)[0];

    return {
      id: `niche-${cat}-${market}`,
      niche: cat as Category,
      market,
      rpm,
      vph: totalVPH,
      marketCap,
      competitorCount: videos.length,
      avgCompetitorSubs: avgSubs,
      competition: avgComp,
      opportunityScore: avgOpp,
      aiSafety: safety.rating,
      aiSafetyReason: safety.reason,
      topKeywords,
      vphTrend,
      topVideo: topVideo ? {
        title: topVideo.topic,
        videoId: topVideo.videoId,
        viewCount: topVideo.viewCount,
        channelTitle: topVideo.channelTitle,
      } : null,
      totalViews,
      smallChannelWins: smallWins,
      lastUpdated: Date.now(),
    };
  });

  return niches.sort((a, b) => b.opportunityScore - a.opportunityScore);
}