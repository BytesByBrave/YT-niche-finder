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

export type SortKey = "opportunity" | "velocity" | "volume" | "lowcomp";