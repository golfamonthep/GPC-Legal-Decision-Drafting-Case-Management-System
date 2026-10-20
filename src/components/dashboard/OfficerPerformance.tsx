import type { DashboardSnapshot } from "@/lib/dashboard/types";
import type { RegistryAccent } from "./BacklogCharts";

const number = new Intl.NumberFormat("th-TH");
const percent = new Intl.NumberFormat("th-TH", { maximumFractionDigits: 1 });
const fills = {
  teal: "bg-[#d62839]",
  blue: "bg-[#d62839]",
};

/** Absolute stacked bars: completed + pending = total, with a common zero scale. */
export function OfficerPerformance({ title, snapshot, accent, scaleMax }: {
  title: string; snapshot: DashboardSnapshot; accent: RegistryAccent; scaleMax: number;
}) {
  const max = Math.max(scaleMax, 1);
  return <figure className="min-w-0 rounded-2xl border border-white/[0.08] bg-[#131317] p-4">
    <figcaption className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
      <h3 className="text-lg font-bold text-white">{title}</h3>
      <p className="text-xs text-zinc-400">ทั้งหมด <strong className="text-white">{number.format(snapshot.totalCases)}</strong> · ค้าง <strong className="text-white">{number.format(snapshot.kpis.active)}</strong> เรื่อง</p>
    </figcaption>
    <p className="mb-2 text-xs leading-5 text-zinc-400">อันดับตามจำนวนรับผิดชอบทั้งหมด · จำนวนเท่ากันได้อันดับร่วม</p>
    {snapshot.officerPerformance.length ? <ol className="divide-y divide-white/[0.06]">
      {snapshot.officerPerformance.map(item => <li key={item.name} className="grid min-w-0 gap-2 py-2 sm:grid-cols-[minmax(0,1fr)_14rem] sm:items-center sm:py-1.5">
        <div className="min-w-0">
          <p className="flex items-start gap-2 text-sm font-normal text-white">
            <span className="shrink-0 tabular-nums text-zinc-500">{item.rank === null ? "—" : `#${item.rank}`}</span>
            <span className="min-w-0 break-words [overflow-wrap:anywhere]">{item.name}</span>
          </p>
          <div aria-hidden="true" className="mt-1 flex h-2 overflow-hidden rounded bg-white/[0.06]">
            <span className={fills[accent]} style={{ width: `${item.completed / max * 100}%` }} />
            <span className="bg-white/25" style={{ width: `${item.pending / max * 100}%` }} />
          </div>
        </div>
        <dl className="grid grid-cols-4 gap-1 text-center tabular-nums">
          <div><dt className="text-[11px] text-zinc-500">รับทั้งหมด</dt><dd className="mt-0.5 text-sm font-bold text-white">{number.format(item.total)}</dd></div>
          <div><dt className="text-[11px] text-zinc-500">เสร็จแล้ว</dt><dd className="mt-0.5 text-sm font-semibold text-zinc-300">{number.format(item.completed)}</dd></div>
          <div><dt className="text-[11px] text-zinc-500">ค้าง</dt><dd className="mt-0.5 text-sm font-semibold text-zinc-300">{number.format(item.pending)}</dd></div>
          <div><dt className="text-[11px] text-zinc-500">% สำเร็จ</dt><dd className="mt-0.5 text-sm font-bold text-white">{percent.format(item.completionPercent)}%</dd></div>
        </dl>
      </li>)}
    </ol> : <p className="rounded-lg bg-[#16161b] p-4 text-sm text-zinc-500">ยังไม่มีข้อมูลความรับผิดชอบในทะเบียนนี้</p>}
    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-zinc-400">
      <span className="flex items-center gap-1.5"><span aria-hidden="true" className={`h-2 w-2 ${fills[accent]}`} />เสร็จแล้ว</span>
      <span className="flex items-center gap-1.5"><span aria-hidden="true" className="h-2 w-2 rounded-sm bg-slate-400 dark:bg-white/30" />ค้าง</span>
      <span>แท่งรวม = จำนวนรับทั้งหมด · เริ่มที่ 0</span>
    </div>
  </figure>;
}
