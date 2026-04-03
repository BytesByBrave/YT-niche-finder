import { memo } from "react";
import type { TrendItem, Category } from "@/types";
import { Pill, Sparkline } from "./ui";

interface NicheCardProps {
item: TrendItem;
isActive: boolean;
onClick: () => void;
}

export const NicheCard = memo(function NicheCard({ item, isActive, onClick }: NicheCardProps) {
const hoursAgo = Math.floor((Date.now() - new Date(item.publishedAt).getTime()) / (1000 * 60 * 60));

const getCategoryTone = (category: Category): "violet" | "emerald" | "blue" | "rose" | "amber" | "zinc" => {
switch (category) {
    case "Tech": return "violet";
    case "Finance": return "emerald";
    case "Gaming": return "blue";
    case "Health": return "rose";
    case "Sports": return "amber";
    default: return "zinc";
}
};

const fmt = (n: number) => {
if (n >= 1_000_000) return `${(n/1_000_000).toFixed(1)}M`;
if (n >= 1_000) return `${(n/1_000).toFixed(1)}K`;
return `${n}`;
};

return (
<button
    onClick={onClick}
    className={`group flex w-full items-center gap-3 px-3 py-3 text-left transition ${isActive ? "bg-zinc-50" : "hover:bg-zinc-50/70"}`}
>
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-zinc-900 text-white">
    <span className="text-[11px] font-semibold">{item.market}</span>
    </div>
    <div className="min-w-0 flex-1">
    <div className="flex items-center gap-2">
        <div className="truncate text-[14px] font-medium leading-5">{item.topic}</div>
        <Pill tone={getCategoryTone(item.category)}>{item.category}</Pill>
    </div>
    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-zinc-600">
        <span className="inline-flex items-center gap-1"><span className="text-zinc-400">by</span><b className="truncate max-w-[120px]">{item.channelTitle}</b></span>
        <span className="inline-flex items-center gap-1"><span className="text-zinc-400">views</span><b className="tabular-nums">{fmt(item.viewCount)}</b></span>
        <span className="inline-flex items-center gap-1"><span className="text-zinc-400">•</span><b>{hoursAgo}h ago</b></span>
        <span className="inline-flex items-center gap-1"><span className="text-zinc-400">subs</span><b>{fmt(item.topChannelSubs)}</b></span>
    </div>
    </div>
    <div className="hidden w-[140px] shrink-0 md:block">
    <Sparkline data={item.momentum} />
    </div>
    <div className="flex w-[110px] shrink-0 flex-col items-end gap-1">
    <div className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${item.opportunityScore>=75?"bg-emerald-50 text-emerald-700 ring-emerald-200":item.opportunityScore>=60?"bg-blue-50 text-blue-700 ring-blue-200":"bg-zinc-100 text-zinc-700 ring-zinc-200"}`}>
        <span className="h-1.5 w-1.5 rounded-full bg-current" />
        {item.opportunityScore} opp
    </div>
    <div className="text-[11px] text-zinc-500">vel {item.velocity}</div>
    </div>
    <div className="ml-1 hidden text-zinc-300 group-hover:text-zinc-500 xl:block">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
    </div>
</button>
);
});