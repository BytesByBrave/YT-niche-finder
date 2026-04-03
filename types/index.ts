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
  | "Music";

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
  /** Estimated RPM in USD based on category benchmarks */
  rpm: number;
  /** Views Per Hour aggregated across all videos in this niche */
  vph: number;
  /** Estimated monthly market cap in USD (totalMonthlyViews × rpm / 1000) */
  marketCap: number;
  /** Number of competitor channels found */
  competitorCount: number;
  /** Average subscriber count among competitors */
  avgCompetitorSubs: number;
  /** Overall competition score 0–100 (lower = easier to enter) */
  competition: number;
  /** Opportunity score 0–100 (higher = better) */
  opportunityScore: number;
  /** AI-content safety rating */
  aiSafety: AISafety;
  /** Human-readable reason for safety rating */
  aiSafetyReason: string;
  /** Top keywords / topics to target in this niche */
  topKeywords: string[];
  /** VPH trend for sparkline (last 12 data points) */
  vphTrend: number[];
  /** Top performing video in this niche */
  topVideo: {
    title: string;
    videoId: string;
    viewCount: number;
    channelTitle: string;
  } | null;
  /** Total raw view count across all niche videos */
  totalViews: number;
  /** Count of small channels (<10k subs) winning in this niche */
  smallChannelWins: number;
  lastUpdated: number;
};

export type SortKey = "opportunity" | "vph" | "rpm" | "marketcap" | "lowcomp";

export const CATEGORIES: Category[] = [
  "All", "Tech", "Gaming", "Finance", "Health",
  "Education", "Entertainment", "Sports", "News", "DIY", "Music",
];