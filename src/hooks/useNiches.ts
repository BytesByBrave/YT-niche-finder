import { useEffect, useMemo, useRef, useState } from "react";
import type { Market, Category, TrendItem, SortKey } from "@/types";
import { buildRealTrends } from "@/services/youtubeApi";

export function useNiches() {
  const [items, setItems] = useState<TrendItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [market, setMarket] = useState<Market | "Both">("Both");
  const [cat, setCat] = useState<Category>("All");
  const [minSmall, setMinSmall] = useState<number>(0);
  const [maxSubs, setMaxSubs] = useState<number>(1_000_000);
  const [q, setQ] = useState("");
  const [apiQuery, setApiQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("opportunity");
  const [selected, setSelected] = useState<TrendItem | null>(null);
  const [live, setLive] = useState(true);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);
  const timer = useRef<number | null>(null);

  const fetchData = async (overrideQuery?: string) => {
    setLoading(true);
    try {
      const trends = await buildRealTrends(overrideQuery !== undefined ? overrideQuery : apiQuery);
      setItems(trends);
      setLastFetch(new Date());
      if (!selected && trends[0]) setSelected(trends[0]);
    } catch (e) {
      console.error("Fetch failed", e);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchData("");
  }, []);

  // Live refresh every 5 minutes
  useEffect(() => {
    if (!live) return;
    timer.current = window.setInterval(() => {
      fetchData(apiQuery);
    }, 300000); // 5 minutes
    return () => { if (timer.current) window.clearInterval(timer.current); };
  }, [live, apiQuery]);

  const filtered = useMemo(() => {
    let arr = items;
    if (market !== "Both") arr = arr.filter(i => i.market === market);
    if (cat !== "All") arr = arr.filter(i => i.category === cat);
    arr = arr.filter(i => i.channelsUnder10k >= minSmall && i.topChannelSubs <= maxSubs);
    if (q.trim()) {
      const qq = q.toLowerCase();
      arr = arr.filter(i => i.topic.toLowerCase().includes(qq) || i.keywords.some(k => k.includes(qq)) || i.channelTitle.toLowerCase().includes(qq));
    }
    switch (sort) {
      case "velocity": arr = arr.sort((a,b)=> b.velocity - a.velocity); break;
      case "volume": arr = arr.sort((a,b)=> b.volume - a.volume); break;
      case "lowcomp": arr = arr.sort((a,b)=> (a.competition + a.saturation) - (b.competition + b.saturation)); break;
      default: arr = arr.sort((a,b)=> b.opportunityScore - a.opportunityScore);
    }
    return arr;
  }, [items, market, cat, minSmall, maxSubs, q, sort]);

  useEffect(()=>{ if (!selected && filtered[0]) setSelected(filtered[0]); }, [filtered, selected]);

  const usCount = items.filter(i=>i.market==="US").length;
  const ukCount = items.filter(i=>i.market==="UK").length;
  const lowCompCount = items.filter(i=> i.channelsUnder10k >= 1 && i.competition < 50).length;
  const avgOpp = items.length ? Math.round(items.reduce((s,i)=> s+i.opportunityScore,0)/items.length) : 0;

  return {
    items,
    loading,
    market,
    setMarket,
    cat,
    setCat,
    minSmall,
    setMinSmall,
    maxSubs,
    setMaxSubs,
    q,
    setQ,
    apiQuery,
    setApiQuery,
    sort,
    setSort,
    selected,
    setSelected,
    live,
    setLive,
    lastFetch,
    filtered,
    fetchData,
    stats: { usCount, ukCount, lowCompCount, avgOpp }
  };
}