import { memo } from "react";
import type { Market, Category, SortKey } from "@/types";
import { Pill } from "./ui";

interface FilterBarProps {
market: Market | "Both";
setMarket: (market: Market | "Both") => void;
cat: Category;
setCat: (cat: Category) => void;
apiQuery: string;
setApiQuery: (query: string) => void;
q: string;
setQ: (query: string) => void;
sort: SortKey;
setSort: (sort: SortKey) => void;
onSearch: () => void;
loading: boolean;
}

const CATEGORIES: Category[] = ["All","Tech","Gaming","Finance","Health","Education","Entertainment","Sports","News","DIY","Music"];

export const FilterBar = memo(function FilterBar({
market,
setMarket,
cat,
setCat,
apiQuery,
setApiQuery,
q,
setQ,
sort,
setSort,
onSearch,
loading
}: FilterBarProps) {
return (
<div className="flex flex-wrap items-center gap-2 rounded-2xl border border-zinc-200 bg-white p-2 shadow-sm">
    <div className="flex items-center gap-1 rounded-xl bg-zinc-100 p-1">
    {(["Both","US","UK"] as const).map(m => (
        <button key={m} onClick={()=>setMarket(m)} className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${market===m ? "bg-white shadow-sm ring-1 ring-zinc-200" : "text-zinc-600 hover:text-zinc-900"}`}>{m}</button>
    ))}
    </div>
    <div className="h-6 w-px bg-zinc-200" />
    <div className="flex flex-wrap items-center gap-1.5">
    {CATEGORIES.map(c => (
        <button key={c} onClick={()=>setCat(c)} className={`rounded-full px-2.5 py-1 text-xs font-medium ring-1 transition ${cat===c ? "bg-zinc-900 text-white ring-zinc-900" : "bg-white text-zinc-700 ring-zinc-200 hover:bg-zinc-50"}`}>{c}</button>
    ))}
    </div>
    <div className="ml-auto flex items-center gap-2">
    <form onSubmit={(e) => { e.preventDefault(); onSearch(); }} className="relative flex gap-1">
        <input value={apiQuery} onChange={e=>setApiQuery(e.target.value)} placeholder="Topic Search (Enter)…" className="w-[180px] md:w-[220px] rounded-xl border border-zinc-300 bg-white px-3 py-1.5 text-sm outline-none ring-0 placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 transition" />
        <button type="submit" disabled={loading} className="rounded-xl bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50">
        Search
        </button>
    </form>
    <div className="relative hidden md:block">
        <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Filter results…" className="w-[140px] rounded-xl border border-zinc-300 bg-white px-3 py-1.5 text-sm outline-none ring-0 placeholder:text-zinc-400 focus:border-zinc-400" />
        <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2"/><path d="M21 21l-3.8-3.8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
        </span>
    </div>
    <div className="flex items-center gap-1 rounded-xl bg-zinc-100 p-1">
        {([
        {k:"opportunity",l:"Opportunity"},
        {k:"velocity",l:"Velocity"},
        {k:"volume",l:"Volume"},
        {k:"lowcomp",l:"Low-comp"},
        ] as {k:SortKey,l:string}[]).map(s => (
        <button key={s.k} onClick={()=>setSort(s.k)} className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${sort===s.k ? "bg-white shadow-sm ring-1 ring-zinc-200" : "text-zinc-600 hover:text-zinc-900"}`}>{s.l}</button>
        ))}
    </div>
    </div>
</div>
);
});