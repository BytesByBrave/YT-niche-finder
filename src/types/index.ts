export type Market = "US" | "UK";

export type Category =
  | "All"
  | "Tech"
  | "Gaming"
  | "Finance"
  | "Health"
  | "Education"
  | "Entertainment"
  | "Sports"
  | "News"
  | "DIY"
  | "Music"
  | "Celebrity"
  | "Rewinds"
  | "Royal"
  | "Food"
  | "TrueCrime"
  | "Travel"
  | "History";

export type AISafety = "safe" | "risky" | "ban-risk";

export type TrendItem = {
  id: string;
  market: Market;
  topic: string;
  keywords: string[];
  category: Category;
  velocity: number;
  volume: number;
  videosLast24h: number;
  avgViews: number;
  topChannelSubs: number;
  channelsUnder50k: number;
  channelsUnder10k: number;
  competition: number;
  saturation: number;
  momentum: number[];
  sentiment: number;
  thumbnailStyle: "face" | "text-heavy" | "mystery" | "clean";
  language: string;
  opportunityScore: number;
  predictedPeakInH: number;
  contentGaps: string[];
  related: string[];
  lastUpdated: number;
  videoId: string;
  channelTitle: string;
  publishedAt: string;
  viewCount: number;
  likeCount: number;
};

/** Aggregated niche-level data — one row per niche category */
export type NicheItem = {
  id: string;
  niche: Category;
  market: Market | "Both";
  rpm: number;
  vph: number;
  marketCap: number;
  competitorCount: number;
  avgCompetitorSubs: number;
  competition: number;
  opportunityScore: number;
  aiSafety: AISafety;
  aiSafetyReason: string;
  topKeywords: string[];
  vphTrend: number[];
  topVideo: {
    title: string;
    videoId: string;
    viewCount: number;
    channelTitle: string;
  } | null;
  totalViews: number;
  smallChannelWins: number;
  lastUpdated: number;
};

/** A single YouTube channel found for a niche */
export type ChannelResult = {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  subscriberCount: number;
  videoCount: number;
  viewCount: number;
  customUrl: string;
  publishedAt: string;
  /** Estimated monthly revenue based on niche RPM */
  estMonthlyRevenue: number;
  /** Channel size tier */
  tier: "mega" | "large" | "mid" | "small" | "micro";
};

/** A pre-defined curated niche with known market and real YouTube data */
export type CuratedNiche = {
  id: string;
  name: string;
  emoji: string;
  color: string;
  market: Market;
  category: Category;
  searchQuery: string;
  rpm: number;
  aiSafety: AISafety;
  aiSafetyReason: string;
  automationTips: string[];
  tags: string[];
  // Live data filled in after API fetch
  vph: number;
  marketCap: number;
  competition: number;
  opportunityScore: number;
  vphTrend: number[];
  topKeywords: string[];
  topVideo: {
    title: string;
    videoId: string;
    viewCount: number;
    channelTitle: string;
  } | null;
  channels: ChannelResult[];
  lastUpdated: number;
};

export type SortKey = "opportunity" | "vph" | "rpm" | "marketcap" | "lowcomp";

export const CATEGORIES: Category[] = [
  "All", "Tech", "Gaming", "Finance", "Health",
  "Education", "Entertainment", "Sports", "News", "DIY", "Music",
  "Celebrity", "Rewinds", "Royal", "Food", "TrueCrime", "Travel", "History",
];