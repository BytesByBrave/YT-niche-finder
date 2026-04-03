import { useEffect, useRef, useState } from "react";
import type { CuratedNiche, ChannelResult, AISafety } from "../types";
import { buildCuratedNiches } from "../services/youtubeApi";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtSubs(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return `${n}`;
}
function fmtMoney(n: number) {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n}`;
}
function fmtNum(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return `${n}`;
}

// ─── Sparkline ────────────────────────────────────────────────────────────────
function Sparkline({ data, color }: { data: number[]; color: string }) {
  if (!data?.length) return null;
  const w = 100, h = 28, pad = 2;
  const max = Math.max(...data), min = Math.min(...data);
  const norm = (v: number) => h - pad - ((v - min) / Math.max(1, max - min)) * (h - pad * 2);
  const step = (w - pad * 2) / (data.length - 1);
  const d = data.map((v, i) => `${i === 0 ? "M" : "L"} ${pad + i * step} ${norm(v)}`).join(" ");
  const area = d + ` L ${pad + (data.length - 1) * step} ${h} L ${pad} ${h} Z`;
  return (
    <svg width={w} height={h} className="overflow-visible">
      <defs>
        <linearGradient id={`sg-${color.replace("#","")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#sg-${color.replace("#","")})`} />
      <path d={d} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" />
    </svg>
  );
}

// ─── Safety Badge ─────────────────────────────────────────────────────────────
function SafetyBadge({ rating, small = false }: { rating: AISafety; small?: boolean }) {
  const cfgMap: Record<AISafety, { label: string; cls: string }> = {
    safe:       { label: "✅ AI Safe",  cls: "bg-emerald-500/15 text-emerald-400 ring-emerald-500/30" },
    risky:      { label: "⚠️ Risky",   cls: "bg-amber-500/15 text-amber-400 ring-amber-500/30" },
    "ban-risk": { label: "❌ Ban Risk", cls: "bg-red-500/15 text-red-400 ring-red-500/30" },
  };
  const cfg = cfgMap[rating];
  return (
    <span className={`inline-flex items-center rounded-full ring-1 ring-inset font-semibold whitespace-nowrap ${
      small ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-[11px]"
    } ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}

// ─── Tier Badge ───────────────────────────────────────────────────────────────
function TierBadge({ tier }: { tier: ChannelResult["tier"] }) {
  const cfg: Record<ChannelResult["tier"], { label: string; cls: string }> = {
    mega:  { label: "🥇 Top",      cls: "bg-yellow-500/15 text-yellow-400 ring-yellow-500/30" },
    large: { label: "📈 Large",    cls: "bg-blue-500/15 text-blue-400 ring-blue-500/30" },
    mid:   { label: "🚀 Growing",  cls: "bg-violet-500/15 text-violet-400 ring-violet-500/30" },
    small: { label: "🌱 Small",    cls: "bg-emerald-500/15 text-emerald-400 ring-emerald-500/30" },
    micro: { label: "🔬 Micro",    cls: "bg-zinc-500/15 text-zinc-400 ring-zinc-500/30" },
  };
  const c = cfg[tier];
  return (
    <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${c.cls}`}>
      {c.label}
    </span>
  );
}


// ─── Channel Card ─────────────────────────────────────────────────────────────
function ChannelCard({ ch }: { ch: ChannelResult }) {
  const handle = ch.customUrl ? `@${ch.customUrl.replace(/^@/, "")}` : ch.title;
  return (
    <a
      href={`https://youtube.com/${ch.customUrl ? ch.customUrl : `channel/${ch.id}`}`}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-start gap-3 rounded-xl border border-white/5 bg-white/5 p-3 hover:bg-white/8 hover:border-white/10 transition-all group"
    >
      {/* Avatar */}
      <div className="relative shrink-0">
        {ch.thumbnail ? (
          <img src={ch.thumbnail} alt={ch.title} className="h-10 w-10 rounded-full object-cover ring-2 ring-white/10" />
        ) : (
          <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center text-lg">
            📺
          </div>
        )}
      </div>
      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="truncate text-[13px] font-semibold text-white group-hover:text-white/90">{ch.title}</span>
          <TierBadge tier={ch.tier} />
        </div>
        <div className="mt-0.5 text-[11px] text-white/40 truncate">{handle}</div>
        <div className="mt-1.5 flex items-center gap-3">
          <span className="text-[12px] font-bold text-white/80">{fmtSubs(ch.subscriberCount)}<span className="ml-0.5 text-[10px] font-normal text-white/40">subs</span></span>
          <span className="text-[12px] text-white/50">{fmtNum(ch.videoCount)}<span className="ml-0.5 text-[10px] text-white/30">videos</span></span>
          {ch.estMonthlyRevenue > 0 && (
            <span className="text-[12px] font-semibold text-emerald-400">
              ~{fmtMoney(ch.estMonthlyRevenue)}<span className="text-[10px] font-normal text-emerald-400/60">/mo</span>
            </span>
          )}
        </div>
      </div>
      <div className="shrink-0 mt-1 text-white/20 group-hover:text-white/50 transition">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M7 17L17 7M17 7H7M17 7v10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </div>
    </a>
  );
}

// ─── Niche Sidebar Row ────────────────────────────────────────────────────────
function NicheSidebarRow({ niche, active, onClick }: { niche: CuratedNiche; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`group w-full flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-left transition-all ${
        active
          ? "bg-white/10 border border-white/10"
          : "hover:bg-white/5 border border-transparent"
      }`}
      style={active ? { borderLeftColor: niche.color, borderLeftWidth: "2px" } : {}}
    >
      <span className="text-lg shrink-0">{niche.emoji}</span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13px] font-medium text-white/90">{niche.name}</div>
        <div className="mt-0.5 flex items-center gap-1.5">
          <SafetyBadge rating={niche.aiSafety} small />
          <span className="text-[10px] text-white/40">${niche.rpm} RPM</span>
        </div>
        <div className="mt-1">
          <div className="h-0.5 w-full overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full transition-all" style={{ width: `${niche.opportunityScore}%`, background: niche.color }} />
          </div>
        </div>
      </div>
      <div className="shrink-0 text-right">
        <div className="text-[11px] font-bold tabular-nums" style={{ color: niche.color }}>{niche.opportunityScore}</div>
      </div>
    </button>
  );
}

// ─── Niche Intelligence Panel ─────────────────────────────────────────────────
function NicheIntelPanel({ niche }: { niche: CuratedNiche }) {
  const safeCard = {
    safe:       { bg: "bg-emerald-500/10", border: "border-emerald-500/20", text: "text-emerald-300", heading: "✅ Great for AI Automation" },
    risky:      { bg: "bg-amber-500/10",   border: "border-amber-500/20",   text: "text-amber-300",   heading: "⚠️ Proceed with Caution" },
    "ban-risk": { bg: "bg-red-500/10",     border: "border-red-500/20",     text: "text-red-300",     heading: "❌ High Ban Risk — Avoid AI" },
  }[niche.aiSafety];

  return (
    <div className="space-y-4 p-4">
      {/* Hero */}
      <div className="rounded-2xl p-4 relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${niche.color}22 0%, ${niche.color}08 100%)`, border: `1px solid ${niche.color}30` }}>
        <div className="absolute top-0 right-0 text-6xl opacity-10 select-none pr-2 pt-1">{niche.emoji}</div>
        <div className="relative">
          <div className="flex items-start gap-3">
            <div className="text-3xl">{niche.emoji}</div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xl font-bold text-white">{niche.name}</span>
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full" style={{ background: `${niche.color}25`, color: niche.color, border: `1px solid ${niche.color}40` }}>
                  {niche.market === "US" ? "🇺🇸 US" : "🇬🇧 UK"}
                </span>
                <SafetyBadge rating={niche.aiSafety} />
              </div>
              <div className="mt-1 text-[12px] text-white/50">
                Opportunity score: <span className="font-bold" style={{ color: niche.color }}>{niche.opportunityScore}/100</span>
                {" · "}Competition: <span className="font-medium text-white/70">{niche.competition}/100</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { l: "Est. RPM", v: `$${niche.rpm}`, sub: "per 1K views", c: "#10b981" },
          { l: "Views / Hr", v: fmtNum(niche.vph), sub: "live niche VPH", c: "#3b82f6" },
          { l: "Market Cap", v: fmtMoney(niche.marketCap), sub: "est. monthly rev", c: niche.color },
          { l: "Channels Found", v: `${niche.channels.length}`, sub: "in this niche", c: "#a855f7" },
        ].map(m => (
          <div key={m.l} className="rounded-xl border border-white/5 bg-white/5 p-3">
            <div className="text-[10px] text-white/40">{m.l}</div>
            <div className="mt-0.5 text-[18px] font-bold tabular-nums" style={{ color: m.c }}>{m.v}</div>
            <div className="text-[10px] text-white/30">{m.sub}</div>
          </div>
        ))}
      </div>

      {/* VPH Trend + Competition */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-white/5 bg-white/5 p-3">
          <div className="text-[11px] text-white/40 mb-2">VPH Trend</div>
          <Sparkline data={niche.vphTrend} color={niche.color} />
          <div className="mt-1 text-[10px] text-white/30">Views per hour over time</div>
        </div>
        <div className="rounded-xl border border-white/5 bg-white/5 p-3">
          <div className="text-[11px] text-white/40 mb-2">Competition Level</div>
          <div className="text-2xl font-bold text-white tabular-nums">
            {niche.competition}<span className="text-sm font-normal text-white/30">/100</span>
          </div>
          <div className="mt-2">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full" style={{
                width: `${100 - niche.competition}%`,
                background: niche.competition < 40 ? "#10b981" : niche.competition < 65 ? "#f59e0b" : "#ef4444"
              }} />
            </div>
          </div>
          <div className="mt-1.5 text-[10px] text-white/40">
            {niche.competition < 40 ? "🟢 Low — easy to enter" : niche.competition < 65 ? "🟡 Medium — needs good content" : "🔴 High — differentiate well"}
          </div>
        </div>
      </div>

      {/* AI Safety Card */}
      <div className={`rounded-xl border p-3 ${safeCard.bg} ${safeCard.border}`}>
        <div className={`text-[13px] font-semibold ${safeCard.text}`}>{safeCard.heading}</div>
        <div className={`mt-1 text-[12px] leading-relaxed ${safeCard.text} opacity-70`}>{niche.aiSafetyReason}</div>
      </div>

      {/* Automation Workflow */}
      <div className="rounded-xl border border-white/5 bg-white/5 p-3">
        <div className="text-[12px] font-semibold text-white/80 mb-2">🤖 Automation Workflow Guide</div>
        <ul className="space-y-1.5">
          {niche.automationTips.map((tip, i) => (
            <li key={i} className="flex items-start gap-2 text-[12px] text-white/60 leading-relaxed">
              <span className="shrink-0 text-white/30 mt-0.5">•</span>
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Top Keywords */}
      {niche.topKeywords.length > 0 && (
        <div className="rounded-xl border border-white/5 bg-white/5 p-3">
          <div className="text-[12px] font-semibold text-white/80 mb-2">🔑 Top Keywords to Target</div>
          <div className="flex flex-wrap gap-1.5">
            {niche.topKeywords.map(k => (
              <span key={k} className="rounded-full border border-white/10 bg-white/8 px-2.5 py-1 text-[11px] font-medium text-white/60">
                #{k}
              </span>
            ))}
            {niche.tags.map(t => (
              <span key={`tag-${t}`} className="rounded-full px-2.5 py-1 text-[11px] font-medium border" style={{ background: `${niche.color}15`, color: niche.color, borderColor: `${niche.color}30` }}>
                {t}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Top Video */}
      {niche.topVideo && (
        <div className="rounded-xl border border-white/5 bg-white/5 p-3">
          <div className="text-[12px] font-semibold text-white/80 mb-2">🏆 Top Performing Video in Niche</div>
          <a href={`https://youtube.com/watch?v=${niche.topVideo.videoId}`} target="_blank" rel="noopener noreferrer"
            className="block overflow-hidden rounded-lg hover:opacity-90 transition mb-2">
            <img src={`https://i.ytimg.com/vi/${niche.topVideo.videoId}/hqdefault.jpg`} alt={niche.topVideo.title}
              className="w-full aspect-video object-cover" />
          </a>
          <div className="text-[12px] font-medium text-white/80 line-clamp-2">{niche.topVideo.title}</div>
          <div className="mt-1 text-[11px] text-white/40">{niche.topVideo.channelTitle} · {fmtNum(niche.topVideo.viewCount)} views</div>
        </div>
      )}

      <div className="text-[10px] text-white/20 text-right">
        Live data · Updated {new Date(niche.lastUpdated).toLocaleTimeString()}
      </div>
    </div>
  );
}

// ─── Channel Explorer Panel ───────────────────────────────────────────────────
function ChannelExplorer({ niche }: { niche: CuratedNiche }) {
  const [showAll, setShowAll] = useState(false);
  const channels = showAll ? niche.channels : niche.channels.slice(0, 5);

  return (
    <div className="p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[14px] font-bold text-white">Channel Explorer</div>
          <div className="text-[11px] text-white/40">{niche.channels.length} channels found in <span style={{ color: niche.color }}>{niche.name}</span></div>
        </div>
        <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ background: `${niche.color}20`, color: niche.color, border: `1px solid ${niche.color}30` }}>
          ${niche.rpm} RPM
        </span>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-1.5 rounded-xl border border-white/5 bg-white/5 px-3 py-2">
        {(["mega","large","mid","small","micro"] as ChannelResult["tier"][]).map(t => (
          <TierBadge key={t} tier={t} />
        ))}
      </div>

      {/* Channel list */}
      {niche.channels.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="text-3xl mb-2">📡</div>
          <div className="text-sm text-white/40">Loading channel data…</div>
          <div className="text-[11px] text-white/25 mt-1">API fetching channels for this niche</div>
        </div>
      ) : (
        <div className="space-y-2">
          {channels.map(ch => (
            <ChannelCard key={ch.id} ch={ch} />
          ))}
        </div>
      )}

      {/* Load more */}
      {niche.channels.length > 5 && (
        <button
          onClick={() => setShowAll(v => !v)}
          className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 text-[12px] font-medium text-white/60 hover:bg-white/8 hover:text-white/80 transition"
        >
          {showAll ? "Show Less" : `Show All ${niche.channels.length} Channels`}
        </button>
      )}

      {/* Search on YouTube CTA */}
      <a
        href={`https://youtube.com/results?search_query=${encodeURIComponent(niche.searchQuery)}&sp=CAASAhAC`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 w-full rounded-xl border border-white/10 bg-white/5 py-2.5 text-[12px] font-medium text-white/60 hover:bg-white/8 hover:text-white/80 transition"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M21.6 7.2c-.2-.8-.8-1.4-1.6-1.6C18.2 5 12 5 12 5s-6.2 0-8 .6c-.8.2-1.4.8-1.6 1.6C2 9 2 12 2 12s0 3 .4 4.8c.2.8.8 1.4 1.6 1.6 1.8.6 8 .6 8 .6s6.2 0 8-.6c.8-.2 1.4-.8 1.6-1.6.4-1.8.4-4.8.4-4.8s0-3-.4-4.8zM10 15V9l5 3-5 3z"/></svg>
        Find More Channels on YouTube
      </a>
    </div>
  );
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────
function LoadingSkeleton() {
  return (
    <div className="space-y-2 p-3">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="h-16 rounded-xl bg-white/5 animate-pulse" style={{ animationDelay: `${i * 0.1}s` }} />
      ))}
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [niches, setNiches] = useState<CuratedNiche[]>([]);
  const [loading, setLoading] = useState(true);
  const [market, setMarket] = useState<"US" | "UK" | "Both">("Both");
  const [selected, setSelected] = useState<CuratedNiche | null>(null);
  const [live, setLive] = useState(true);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);
  const timer = useRef<number | null>(null);

  const fetchData = async (mkt: "US" | "UK" | "Both" = market) => {
    setLoading(true);
    try {
      const result = await buildCuratedNiches(mkt);
      setNiches(result);
      setLastFetch(new Date());
      if (!selected && result[0]) setSelected(result[0]);
      else if (selected) {
        const updated = result.find(n => n.id === selected.id);
        if (updated) setSelected(updated);
      }
    } catch (e) {
      console.error("Niche fetch failed", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData("Both"); }, []);

  useEffect(() => {
    if (!live) return;
    timer.current = window.setInterval(() => fetchData(market), 300_000);
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [live, market]);

  const usNiches = niches.filter(n => n.market === "US");
  const ukNiches = niches.filter(n => n.market === "UK");
  const displayNiches = market === "US" ? usNiches : market === "UK" ? ukNiches : niches;

  const safeCount = niches.filter(n => n.aiSafety === "safe").length;
  const topRpm = niches.length ? Math.max(...niches.map(n => n.rpm)) : 0;

  return (
    <div className="flex h-screen flex-col overflow-hidden" style={{ background: "#0c0c0e", fontFamily: "'Inter', system-ui, sans-serif", color: "white" }}>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />

      {/* ── Top Bar ── */}
      <header className="shrink-0 flex items-center gap-4 border-b px-5 py-3" style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}>
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl text-xl" style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", boxShadow: "0 0 20px #6366f140" }}>
            🎯
          </div>
          <div>
            <div className="text-[15px] font-bold tracking-tight">Niche Intelligence</div>
            <div className="text-[10px] text-white/30 -mt-0.5">YouTube Automation Dashboard</div>
          </div>
        </div>

        {/* Market tabs */}
        <div className="flex items-center gap-1 rounded-xl p-1" style={{ background: "rgba(255,255,255,0.05)" }}>
          {(["Both", "US", "UK"] as const).map(m => (
            <button key={m} onClick={() => { setMarket(m); fetchData(m); }}
              className={`rounded-lg px-3 py-1.5 text-[12px] font-medium transition ${market === m ? "bg-white/10 text-white shadow-sm" : "text-white/40 hover:text-white/70"}`}>
              {m === "Both" ? "🌍 All Niches" : m === "US" ? "🇺🇸 US Only" : "🇬🇧 UK Only"}
            </button>
          ))}
        </div>

        {/* Stats */}
        <div className="hidden items-center gap-2 md:flex ml-2">
          <span className="rounded-full border px-2.5 py-1 text-[11px] font-semibold" style={{ background: "rgba(16,185,129,0.1)", color: "#10b981", borderColor: "rgba(16,185,129,0.2)" }}>
            ✅ {safeCount} AI-Safe
          </span>
          <span className="rounded-full border px-2.5 py-1 text-[11px] font-semibold" style={{ background: "rgba(99,102,241,0.1)", color: "#818cf8", borderColor: "rgba(99,102,241,0.2)" }}>
            {displayNiches.length} Niches
          </span>
          <span className="rounded-full border px-2.5 py-1 text-[11px] font-semibold" style={{ background: "rgba(245,158,11,0.1)", color: "#fbbf24", borderColor: "rgba(245,158,11,0.2)" }}>
            Top RPM ${topRpm}
          </span>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {lastFetch && <span className="hidden text-[10px] text-white/25 sm:block">Updated {lastFetch.toLocaleTimeString()}</span>}
          <button onClick={() => setLive(v => !v)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition ${live ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" : "border-white/10 bg-white/5 text-white/40"}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${live ? "bg-emerald-400 animate-pulse" : "bg-white/30"}`} />
            {live ? "Live" : "Paused"}
          </button>
          <button onClick={() => fetchData(market)} disabled={loading}
            className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-white/50 hover:bg-white/8 hover:text-white/70 disabled:opacity-40 transition">
            {loading ? "…" : "↻ Refresh"}
          </button>
        </div>
      </header>

      {/* ── 3-Column Body ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── LEFT: Niche Sidebar ── */}
        <aside className="w-72 shrink-0 flex flex-col border-r overflow-hidden" style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.01)" }}>
          <div className="shrink-0 px-4 py-3 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
            <div className="text-[12px] font-bold text-white/50 uppercase tracking-wider">Curated Niches</div>
          </div>

          <div className="flex-1 overflow-auto py-2 px-2 space-y-0.5">
            {loading && niches.length === 0 ? (
              <LoadingSkeleton />
            ) : (
              <>
                {/* US Section */}
                {(market === "Both" || market === "US") && usNiches.length > 0 && (
                  <>
                    <div className="px-3 pt-3 pb-1.5 text-[10px] font-bold uppercase tracking-widest text-white/25 flex items-center gap-2">
                      <span>🇺🇸</span> United States
                    </div>
                    {usNiches.map(n => (
                      <NicheSidebarRow key={n.id} niche={n} active={selected?.id === n.id} onClick={() => setSelected(n)} />
                    ))}
                  </>
                )}

                {/* UK Section */}
                {(market === "Both" || market === "UK") && ukNiches.length > 0 && (
                  <>
                    <div className="px-3 pt-4 pb-1.5 text-[10px] font-bold uppercase tracking-widest text-white/25 flex items-center gap-2">
                      <span>🇬🇧</span> United Kingdom
                    </div>
                    {ukNiches.map(n => (
                      <NicheSidebarRow key={n.id} niche={n} active={selected?.id === n.id} onClick={() => setSelected(n)} />
                    ))}
                  </>
                )}
              </>
            )}
          </div>

          {/* Sidebar footer */}
          <div className="shrink-0 border-t px-4 py-3" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
            <div className="text-[10px] text-white/20">
              {niches.length} curated niches · Live YouTube data · 5 min refresh
            </div>
          </div>
        </aside>

        {/* ── CENTER: Niche Intelligence ── */}
        <main className="flex-1 overflow-auto border-r" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          {selected ? (
            <NicheIntelPanel niche={selected} key={selected.id} />
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-center px-8">
              <div className="text-5xl mb-4">🎯</div>
              <div className="text-[16px] font-semibold text-white/60">Select a niche to see intelligence</div>
              <div className="mt-2 text-[13px] text-white/30 max-w-xs">
                Choose any niche from the sidebar to see RPM, VPH, market cap, AI safety guide, and automation workflow
              </div>
            </div>
          )}
        </main>

        {/* ── RIGHT: Channel Explorer ── */}
        <aside className="w-80 shrink-0 flex flex-col overflow-hidden" style={{ background: "rgba(255,255,255,0.01)" }}>
          <div className="shrink-0 px-4 py-3 border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
            <div className="text-[12px] font-bold text-white/50 uppercase tracking-wider">Channel Explorer</div>
          </div>
          <div className="flex-1 overflow-auto">
            {selected ? (
              <ChannelExplorer niche={selected} key={selected.id} />
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-center px-6">
                <div className="text-4xl mb-3">📺</div>
                <div className="text-[13px] text-white/30">Select a niche to explore channels</div>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}