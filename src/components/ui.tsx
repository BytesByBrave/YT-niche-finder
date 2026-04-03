import { memo } from "react";

export const Pill = memo(function Pill({children, tone="zinc"}:{children:React.ReactNode, tone?: "zinc"|"emerald"|"amber"|"violet"|"blue"|"rose"}) {
  const map:any = {
    zinc:"bg-zinc-100 text-zinc-700 ring-zinc-200",
    emerald:"bg-emerald-50 text-emerald-700 ring-emerald-200",
    amber:"bg-amber-50 text-amber-700 ring-amber-200",
    violet:"bg-violet-50 text-violet-700 ring-violet-200",
    blue:"bg-blue-50 text-blue-700 ring-blue-200",
    rose:"bg-rose-50 text-rose-700 ring-rose-200",
  };
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${map[tone]}`}>{children}</span>;
});

export const Meter = memo(function Meter({value, label}:{value:number,label:string}) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-zinc-200">
        <div className="h-full bg-zinc-900 transition-all" style={{width:`${Math.max(0, Math.min(100, value))}%`}} />
      </div>
      <span className="text-[11px] text-zinc-500">{label}</span>
    </div>
  );
});

export const Sparkline = memo(function Sparkline({data}:{data:number[]}) {
  const w = 120, h = 28, pad = 2;
  const max = Math.max(...data), min = Math.min(...data);
  const norm = (v:number)=> h - pad - ((v - min) / Math.max(1,(max-min))) * (h - pad*2);
  const step = (w - pad*2) / (data.length - 1);
  const d = data.map((v,i)=> `${i===0?'M':'L'} ${pad + i*step} ${norm(v)}`).join(" ");
  return (
    <svg width={w} height={h} className="overflow-visible">
      <path d={d} fill="none" stroke="currentColor" strokeWidth={1.5} className="text-zinc-900/80"/>
    </svg>
  );
});

export const Kbd = memo(function Kbd({children}:{children:string}) {
  return <kbd className="rounded-md border border-zinc-300 bg-white px-1.5 py-0.5 text-[10px] font-medium text-zinc-600 shadow-sm">{children}</kbd>;
});