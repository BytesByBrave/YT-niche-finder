import { useEffect, useMemo, useRef, useState } from "react";
import type { NicheItem, AISafety, SortKey } from "../types";
import { buildNiches } from "../services/youtubeApi";

// ─── Formatters ───────────────────────────────────────────────────────────────
function fmt(n: number) {
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

// ─── AI Safety Badge ──────────────────────────────────────────────────────────
function SafetyBadge({ rating }: { rating: AISafety }) {
  const cfgMap: Record<AISafety, { label: string; cls: string }> = {
    safe:        { label: "✅ AI Safe",  cls: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
    risky:       { label: "⚠️ Risky",   cls: "bg-amber-50 text-amber-700 ring-amber-200" },
    "ban-risk":  { label: "❌ Ban Risk",cls: "bg-rose-50 text-rose-700 ring-rose-200" },
  };
  const cfg = cfgMap[rating];
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset whitespace-nowrap ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}

// ─── Opportunity Score Badge ──────────────────────────────────────────────────
function OppBadge({ score }: { score: number }) {
  const cls = score >= 70
    ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
    : score >= 50
    ? "bg-blue-50 text-blue-700 ring-blue-200"
    : "bg-zinc-100 text-zinc-600 ring-zinc-200";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-bold ring-1 ring-inset ${cls}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {score}
    </span>
  );
}

// ─── Mini Bar ─────────────────────────────────────────────────────────────────
function MiniBar({ value, max, color = "#18181b" }: { value: number; max: number; color?: string }) {
  const pct = Math.max(2, Math.min(100, (value / Math.max(1, max)) * 100));
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-100">
      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

// ─── Sparkline ────────────────────────────────────────────────────────────────
function Sparkline({ data, color = "#18181b" }: { data: number[]; color?: string }) {
  const w = 80, h = 24, pad = 2;
  if (!data?.length) return null;
  const max = Math.max(...data), min = Math.min(...data);
  const norm = (v: number) => h - pad - ((v - min) / Math.max(1, max - min)) * (h - pad * 2);
  const step = (w - pad * 2) / (data.length - 1);
  const d = data.map((v, i) => `${i === 0 ? "M" : "L"} ${pad + i * step} ${norm(v)}`).join(" ");
  return (
    <svg width={w} height={h} className="overflow-visible">
      <path d={d} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" />
    </svg>
  );
}

// ─── Category Emoji Map ───────────────────────────────────────────────────────
const NICHE_EMOJI: Record<string, string> = {
  Gaming: "🎮", Finance: "💰", Tech: "💻", Health: "🏃", Education: "📚",
  Entertainment: "🎬", Sports: "⚽", News: "📰", DIY: "🔨", Music: "🎵", All: "🌐",
};
const NICHE_COLOR: Record<string, string> = {
  Gaming: "#6366f1", Finance: "#10b981", Tech: "#3b82f6", Health: "#f43f5e",
  Education: "#f59e0b", Entertainment: "#8b5cf6", Sports: "#f97316",
  News: "#6b7280", DIY: "#84cc16", Music: "#ec4899", All: "#71717a",
};

// ─── Niche Row ────────────────────────────────────────────────────────────────
function NicheRow({
  item, active, maxVph, onClick,
}: {
  item: NicheItem; active: boolean; maxVph: number; onClick: () => void;
}) {
  const color = NICHE_COLOR[item.niche] || "#71717a";
  return (
    <button
      onClick={onClick}
      className={`group flex w-full items-center gap-3 px-4 py-3.5 text-left transition-all border-b border-zinc-100 last:border-0 ${
        active ? "bg-zinc-50 border-l-2" : "hover:bg-zinc-50/60"
      }`}
      style={active ? { borderLeftColor: color } : {}}
    >
      {/* Niche icon */}
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg shadow-sm"
        style={{ background: `${color}18`, border: `1.5px solid ${color}40` }}
      >
        {NICHE_EMOJI[item.niche] || "📌"}
      </div>

      {/* Name + safety */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[14px] font-semibold">{item.niche}</span>
          <SafetyBadge rating={item.aiSafety} />
        </div>
        <div className="mt-1">
          <MiniBar value={item.vph} max={maxVph} color={color} />
        </div>
      </div>

      {/* VPH */}
      <div className="hidden w-[80px] shrink-0 flex-col items-end sm:flex">
        <div className="text-[12px] text-zinc-400">VPH</div>
        <div className="text-[14px] font-bold tabular-nums">{fmtNum(item.vph)}</div>
      </div>

      {/* RPM */}
      <div className="hidden w-[60px] shrink-0 flex-col items-end md:flex">
        <div className="text-[12px] text-zinc-400">RPM</div>
        <div className="text-[14px] font-bold tabular-nums text-emerald-700">${item.rpm}</div>
      </div>

      {/* Market Cap */}
      <div className="hidden w-[90px] shrink-0 flex-col items-end lg:flex">
        <div className="text-[12px] text-zinc-400">Mkt Cap</div>
        <div className="text-[13px] font-bold tabular-nums">{fmt(item.marketCap)}</div>
      </div>

      {/* Competition */}
      <div className="hidden w-[80px] shrink-0 flex-col items-end xl:flex">
        <div className="text-[12px] text-zinc-400">Competition</div>
        <div className="text-[13px] font-semibold tabular-nums">{item.competition}/100</div>
      </div>

      {/* Opportunity */}
      <div className="shrink-0">
        <OppBadge score={item.opportunityScore} />
      </div>

      {/* Chevron */}
      <div className="ml-1 hidden text-zinc-300 group-hover:text-zinc-500 xl:block">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
    </button>
  );
}

// ─── Detail Panel ─────────────────────────────────────────────────────────────
function NicheDetail({ item }: { item: NicheItem }) {
  const color = NICHE_COLOR[item.niche] || "#71717a";
  const safetyLabel = item.aiSafety === "safe"
    ? { heading: "Great for AI Automation 🤖", bg: "bg-emerald-50", text: "text-emerald-800", border: "border-emerald-200" }
    : item.aiSafety === "risky"
    ? { heading: "Proceed with Caution ⚠️", bg: "bg-amber-50", text: "text-amber-800", border: "border-amber-200" }
    : { heading: "High Ban Risk — Avoid ❌", bg: "bg-rose-50", text: "text-rose-800", border: "border-rose-200" };

  return (
    <div className="space-y-4 p-5">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-2xl shadow-sm"
          style={{ background: `${color}20`, border: `2px solid ${color}50` }}
        >
          {NICHE_EMOJI[item.niche] || "📌"}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl font-bold">{item.niche}</h2>
            <SafetyBadge rating={item.aiSafety} />
          </div>
          <div className="mt-0.5 text-[12px] text-zinc-500">
            {item.competitorCount} competitor videos tracked • {item.smallChannelWins} small channel wins (&lt;10k subs)
          </div>
        </div>
        <OppBadge score={item.opportunityScore} />
      </div>

      {/* AI Safety Card */}
      <div className={`rounded-xl border p-3 ${safetyLabel.bg} ${safetyLabel.border}`}>
        <div className={`text-[13px] font-semibold ${safetyLabel.text}`}>{safetyLabel.heading}</div>
        <div className={`mt-1 text-[12px] leading-relaxed ${safetyLabel.text} opacity-80`}>{item.aiSafetyReason}</div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Est. RPM", value: `$${item.rpm}`, sub: "per 1K views", accent: "#10b981" },
          { label: "Views/Hour", value: fmtNum(item.vph), sub: "across niche", accent: "#3b82f6" },
          { label: "Market Cap", value: fmt(item.marketCap), sub: "est. monthly rev", accent: "#8b5cf6" },
          { label: "Avg Competitor", value: fmtNum(item.avgCompetitorSubs), sub: "subscribers", accent: "#f59e0b" },
        ].map(m => (
          <div key={m.label} className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-3">
            <div className="text-[11px] text-zinc-500">{m.label}</div>
            <div className="mt-0.5 text-[18px] font-bold tabular-nums" style={{ color: m.accent }}>{m.value}</div>
            <div className="text-[10px] text-zinc-400">{m.sub}</div>
          </div>
        ))}
      </div>

      {/* VPH Sparkline + Competition */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-zinc-200 p-3">
          <div className="text-[12px] font-medium text-zinc-500 mb-2">VPH Trend</div>
          <Sparkline data={item.vphTrend} color={color} />
          <div className="mt-1 text-[11px] text-zinc-400">Views per hour (12 data points)</div>
        </div>
        <div className="rounded-xl border border-zinc-200 p-3">
          <div className="text-[12px] font-medium text-zinc-500 mb-2">Competition</div>
          <div className="text-2xl font-bold tabular-nums">{item.competition}<span className="text-sm font-normal text-zinc-400">/100</span></div>
          <div className="mt-2">
            <MiniBar value={100 - item.competition} max={100}
              color={item.competition < 40 ? "#10b981" : item.competition < 65 ? "#f59e0b" : "#f43f5e"} />
          </div>
          <div className="mt-1 text-[11px] text-zinc-400">
            {item.competition < 40 ? "Low — easy to enter ✓" : item.competition < 65 ? "Medium — doable with good content" : "High — needs differentiation"}
          </div>
        </div>
      </div>

      {/* Top Keywords */}
      {item.topKeywords.length > 0 && (
        <div className="rounded-xl border border-zinc-200 p-3">
          <div className="text-[12px] font-medium text-zinc-500 mb-2">Top Keywords to Target</div>
          <div className="flex flex-wrap gap-1.5">
            {item.topKeywords.map((k: string) => (
              <span key={k} className="rounded-full bg-zinc-100 px-2.5 py-1 text-[12px] font-medium text-zinc-700 ring-1 ring-zinc-200">
                #{k}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Top Video */}
      {item.topVideo && (
        <div className="rounded-xl border border-zinc-200 p-3">
          <div className="text-[12px] font-medium text-zinc-500 mb-2">🏆 Top Performer in Niche</div>
          <a
            href={`https://www.youtube.com/watch?v=${item.topVideo.videoId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block overflow-hidden rounded-lg bg-zinc-100 mb-2 hover:opacity-90 transition"
          >
            <img
              src={`https://i.ytimg.com/vi/${item.topVideo.videoId}/hqdefault.jpg`}
              alt={item.topVideo.title}
              className="w-full aspect-video object-cover"
            />
          </a>
          <div className="text-[13px] font-medium leading-snug line-clamp-2">{item.topVideo.title}</div>
          <div className="mt-1 text-[11px] text-zinc-500">
            {item.topVideo.channelTitle} • {fmtNum(item.topVideo.viewCount)} views
          </div>
        </div>
      )}

      {/* Automation playbook */}
      <div className="rounded-xl border border-zinc-200 p-3">
        <div className="text-[12px] font-semibold mb-2">🤖 YouTube Automation Workflow</div>
        <ul className="space-y-1.5">
          {[
            item.aiSafety === "safe"
              ? "✅ Safe for fully AI-generated scripts, voiceover & B-roll"
              : item.aiSafety === "risky"
              ? "⚠️ Use human review for scripts — AI errors could trigger flags"
              : "❌ Avoid fully automated content — very high ban risk",
            `Target keywords: ${item.topKeywords.slice(0, 3).join(", ")}`,
            `Publish frequency: ${item.competition < 40 ? "Daily — low comp, volume strategy" : "3x/week — focus on quality"}`,
            `Estimated RPM: $${item.rpm} — ${item.rpm >= 8 ? "high value niche 💰" : item.rpm >= 5 ? "medium value" : "volume play needed"}`,
            `Market entry: ${item.smallChannelWins > 2 ? "Small channels winning here — great entry point ✓" : "Dominated by larger channels — niche down further"}`,
          ].map((tip, i) => (
            <li key={i} className="flex items-start gap-2 text-[12px] text-zinc-700 leading-relaxed">
              <span className="mt-0.5 shrink-0 text-zinc-400">•</span>
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="text-[11px] text-zinc-400 text-right">
        Data from YouTube API • Updated {new Date(item.lastUpdated).toLocaleTimeString()}
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [niches, setNiches] = useState<NicheItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [market, setMarket] = useState<"US" | "UK" | "Both">("Both");
  const [sort, setSort] = useState<SortKey>("opportunity");
  const [safeOnly, setSafeOnly] = useState(false);
  const [selected, setSelected] = useState<NicheItem | null>(null);
  const [live, setLive] = useState(true);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);
  const timer = useRef<number | null>(null);

  const fetchData = async (mkt = market) => {
    setLoading(true);
    try {
      const result = await buildNiches(mkt);
      setNiches(result);
      setLastFetch(new Date());
      if (result[0]) setSelected(result[0]);
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

  const filtered = useMemo(() => {
    let arr = [...niches];
    if (market !== "Both") arr = arr.filter(n => n.market === market || n.market === "Both");
    if (safeOnly) arr = arr.filter(n => n.aiSafety === "safe");
    switch (sort) {
      case "vph":       return arr.sort((a, b) => b.vph - a.vph);
      case "rpm":       return arr.sort((a, b) => b.rpm - a.rpm);
      case "marketcap": return arr.sort((a, b) => b.marketCap - a.marketCap);
      case "lowcomp":   return arr.sort((a, b) => a.competition - b.competition);
      default:          return arr.sort((a, b) => b.opportunityScore - a.opportunityScore);
    }
  }, [niches, market, safeOnly, sort]);

  const maxVph = Math.max(...filtered.map(n => n.vph), 1);

  const safeCount = niches.filter(n => n.aiSafety === "safe").length;
  const avgRpm = niches.length ? (niches.reduce((s, n) => s + n.rpm, 0) / niches.length).toFixed(1) : "0";
  const totalVph = niches.reduce((s, n) => s + n.vph, 0);

  return (
    <div className="min-h-screen bg-[#f7f7f8] text-zinc-900" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* ── Header ── */}
      <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1400px] items-center gap-3 px-5 py-3.5">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-900 text-white shadow-sm text-lg">
              🎯
            </div>
            <div>
              <div className="text-[15px] font-bold leading-5 tracking-tight">Niche Intelligence</div>
              <div className="text-[11px] text-zinc-400 -mt-0.5">YouTube Automation Finder</div>
            </div>
          </div>

          {/* Stats pills */}
          <div className="ml-4 hidden items-center gap-2 md:flex">
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-200">
              ✅ {safeCount} AI-Safe Niches
            </span>
            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700 ring-1 ring-blue-200">
              Avg RPM ${avgRpm}
            </span>
            <span className="rounded-full bg-violet-50 px-2.5 py-1 text-[11px] font-semibold text-violet-700 ring-1 ring-violet-200">
              {fmtNum(totalVph)} total VPH
            </span>
          </div>

          <div className="ml-auto flex items-center gap-2">
            {lastFetch && (
              <span className="hidden text-[11px] text-zinc-400 sm:block">
                Updated {lastFetch.toLocaleTimeString()}
              </span>
            )}
            <button
              onClick={() => setLive(v => !v)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition ${
                live ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-zinc-300 bg-white text-zinc-600"
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${live ? "bg-emerald-500 animate-pulse" : "bg-zinc-400"}`} />
              {live ? "Live" : "Paused"}
            </button>
            <button
              onClick={() => fetchData(market)}
              disabled={loading}
              className="rounded-full border border-zinc-300 bg-white px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 transition"
            >
              {loading ? "Loading…" : "↻ Refresh"}
            </button>
          </div>
        </div>
      </header>

      {/* ── Filter Bar ── */}
      <div className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-3 px-5 py-3">
          {/* Market toggle */}
          <div className="flex items-center gap-1 rounded-xl bg-zinc-100 p-1">
            {(["Both", "US", "UK"] as const).map(m => (
              <button
                key={m}
                onClick={() => { setMarket(m); fetchData(m); }}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  market === m ? "bg-white shadow-sm ring-1 ring-zinc-200 text-zinc-900" : "text-zinc-500 hover:text-zinc-900"
                }`}
              >
                {m === "Both" ? "🌍 Both" : m === "US" ? "🇺🇸 US" : "🇬🇧 UK"}
              </button>
            ))}
          </div>

          <div className="h-6 w-px bg-zinc-200 hidden sm:block" />

          {/* Sort */}
          <div className="flex items-center gap-1 rounded-xl bg-zinc-100 p-1">
            {([
              { k: "opportunity", l: "Opportunity" },
              { k: "vph",        l: "VPH" },
              { k: "rpm",        l: "RPM" },
              { k: "marketcap",  l: "Market Cap" },
              { k: "lowcomp",    l: "Low Comp" },
            ] as { k: SortKey; l: string }[]).map(s => (
              <button
                key={s.k}
                onClick={() => setSort(s.k)}
                className={`rounded-lg px-3 py-1.5 text-[12px] font-medium transition ${
                  sort === s.k ? "bg-white shadow-sm ring-1 ring-zinc-200 text-zinc-900" : "text-zinc-500 hover:text-zinc-900"
                }`}
              >
                {s.l}
              </button>
            ))}
          </div>

          <div className="h-6 w-px bg-zinc-200 hidden sm:block" />

          {/* AI Safe toggle */}
          <button
            onClick={() => setSafeOnly(v => !v)}
            className={`inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-[12px] font-medium transition ${
              safeOnly
                ? "border-emerald-300 bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"
            }`}
          >
            <span className={`h-4 w-7 rounded-full transition-colors relative ${safeOnly ? "bg-emerald-400" : "bg-zinc-200"}`}>
              <span className={`absolute top-0.5 h-3 w-3 rounded-full bg-white shadow transition-transform ${safeOnly ? "translate-x-3.5" : "translate-x-0.5"}`} />
            </span>
            AI Safe Only
          </button>
        </div>
      </div>

      {/* ── Main Content ── */}
      <main className="mx-auto grid max-w-[1400px] grid-cols-12 gap-0 px-5 py-5">
        {/* ── Niche List ── */}
        <section className="col-span-12 xl:col-span-5">
          <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
            {/* Table header */}
            <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="text-[14px] font-bold">Niches</span>
                <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-semibold text-zinc-600">
                  {filtered.length}
                </span>
              </div>
              <div className="hidden items-center gap-4 text-[11px] text-zinc-400 md:flex">
                <span className="w-[80px] text-right">VPH</span>
                <span className="w-[60px] text-right">RPM</span>
                <span className="w-[90px] text-right hidden lg:block">Mkt Cap</span>
                <span className="w-[80px] text-right hidden xl:block">Competition</span>
                <span className="w-[60px] text-right">Score</span>
              </div>
            </div>

            {/* Rows */}
            <div className="max-h-[calc(100vh-260px)] divide-y divide-zinc-50 overflow-auto">
              {loading && niches.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <div className="h-7 w-7 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-800" />
                  <div className="text-sm text-zinc-400">Fetching live YouTube niche data…</div>
                </div>
              ) : filtered.length === 0 ? (
                <div className="py-12 text-center text-sm text-zinc-400">
                  No niches match filters. Try removing "AI Safe Only".
                </div>
              ) : filtered.map(item => (
                <NicheRow
                  key={item.id}
                  item={item}
                  active={selected?.id === item.id}
                  maxVph={maxVph}
                  onClick={() => setSelected(item)}
                />
              ))}
            </div>
          </div>

          {/* Overview cards */}
          <div className="mt-4 grid grid-cols-3 gap-3">
            {[
              {
                label: "Highest RPM",
                value: niches.length ? `$${Math.max(...niches.map(n => n.rpm))}` : "—",
                sub: niches.length ? niches.find(n => n.rpm === Math.max(...niches.map(n => n.rpm)))?.niche : "",
                color: "#10b981",
              },
              {
                label: "Fastest Growing",
                value: niches.length ? fmtNum(Math.max(...niches.map(n => n.vph))) : "—",
                sub: "views/hr",
                color: "#3b82f6",
              },
              {
                label: "Easiest Entry",
                value: niches.length ? `${Math.min(...niches.map(n => n.competition))}/100` : "—",
                sub: niches.length ? niches.find(n => n.competition === Math.min(...niches.map(n => n.competition)))?.niche : "",
                color: "#8b5cf6",
              },
            ].map(c => (
              <div key={c.label} className="rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm">
                <div className="text-[11px] text-zinc-400">{c.label}</div>
                <div className="mt-0.5 text-[18px] font-bold tabular-nums" style={{ color: c.color }}>{c.value}</div>
                <div className="text-[11px] text-zinc-500 capitalize">{c.sub}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Detail Panel ── */}
        <aside className="col-span-12 mt-4 xl:col-span-7 xl:mt-0 xl:pl-4">
          <div className="sticky top-[120px]">
            <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-3">
                <div>
                  <div className="text-[14px] font-bold">Niche Intelligence</div>
                  <div className="text-[11px] text-zinc-400">Select a niche to see full analysis + AI automation guide</div>
                </div>
                {selected && (
                  <span
                    className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
                    style={{
                      background: `${NICHE_COLOR[selected.niche]}18`,
                      color: NICHE_COLOR[selected.niche],
                      border: `1px solid ${NICHE_COLOR[selected.niche]}40`,
                    }}
                  >
                    {selected.niche}
                  </span>
                )}
              </div>
              <div className="max-h-[calc(100vh-200px)] overflow-auto">
                {selected ? (
                  <NicheDetail item={selected} />
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-zinc-400">
                    <div className="text-4xl mb-3">🎯</div>
                    <div className="text-sm">Select a niche from the list to see analysis</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </aside>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-zinc-200 bg-white/70 mt-4">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-5 py-3 text-[11px] text-zinc-400">
          <div>✅ Live YouTube Data API v3 • Niche aggregation • RPM estimates based on industry benchmarks</div>
          <div>Auto-refresh every 5 min</div>
        </div>
      </footer>
    </div>
  );
}