import Link from 'next/link';

type Bucket = { label: string; count: number };
export type RegistryAccent = "teal" | "blue";

const number = new Intl.NumberFormat("th-TH");
const percent = new Intl.NumberFormat("th-TH", { maximumFractionDigits: 1 });
const colors = { teal: "#d62839", blue: "#c81e2b" };
const barClasses = {
  teal: "bg-gradient-to-r from-[#991b1b] to-[#d62839]",
  blue: "bg-gradient-to-r from-[#991b1b] to-[#d62839]",
};
const chartCard = "h-full min-w-0 rounded-[1.25rem] border border-white/[0.08] bg-[#131317] p-4 shadow-[0_12px_28px_-14px_rgba(0,0,0,0.75)] sm:p-5";

export function CompletionRing({ total, pending, accent, tone = "light" }: { total: number; pending: number; accent: RegistryAccent; tone?: "light" | "dark" }) {
  const completed = total - pending;
  const share = total > 0 ? completed / total : 0;
  const dark = tone === "dark";
  return <figure className={`flex h-full min-w-0 flex-col items-center gap-4 ${dark ? "text-zinc-300" : "text-zinc-400"}`}>
    <figcaption className="w-full text-base font-bold text-white">สัดส่วนของทะเบียนทั้งหมด</figcaption>
    <div className="relative h-36 w-36 shrink-0">
      <svg viewBox="0 0 144 144" className="h-full w-full" aria-hidden="true">
        <circle cx="72" cy="72" r="59" fill="none" className="cyber-gauge-track" strokeWidth="14" />
        {total > 0 && <circle cx="72" cy="72" r="59" fill="none" stroke={colors[accent]} strokeWidth="14" pathLength="100"
          strokeDasharray={`${share * 100} 100`} transform="rotate(-90 72 72)" />}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <strong className="text-3xl font-bold tabular-nums text-white">{total ? `${percent.format(share * 100)}%` : "—"}</strong>
        <span className="mt-1 text-xs text-zinc-400">{total ? "เสร็จสิ้น" : "ยังไม่มีข้อมูล"}</span>
      </div>
    </div>
    <div className="w-full min-w-0 space-y-2 text-sm">
      <p className="flex flex-wrap items-center gap-2 text-zinc-300"><span aria-hidden="true" className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#d62839]" />เสร็จสิ้นแล้ว <strong className="text-white">{number.format(completed)} เรื่อง</strong></p>
      <p className="flex flex-wrap items-center gap-2 text-zinc-300"><span aria-hidden="true" className="cyber-legend-secondary h-2.5 w-2.5 shrink-0 rounded-full" />ยังไม่เสร็จสิ้น <strong className="text-white">{number.format(pending)} เรื่อง</strong></p>
      <p className="border-t border-white/[0.08] pt-3 text-xs leading-5 text-zinc-400">ฐาน: {number.format(total)} เรื่อง · ไม่ใช่อัตราการทำงานรายเดือน</p>
    </div>
  </figure>;
}

export function YearOutcomeBars({ data, scaleMax, type }: { data: Array<{ label: string; pending: number; completed: number }>; scaleMax: number; type: string }) {
  const max = Math.max(scaleMax, 1);
  return <figure className={chartCard}>
    <figcaption><h3 className="text-base font-bold text-white">สถานะเรื่องตามปีเลขดำ</h3><p className="mt-1 text-xs leading-5 text-zinc-400">ปีจากเลขดำ · สีแดงตำรวจเสร็จแล้ว สีเทาจางยังดำเนินการ</p></figcaption>
    {data.length ? <div className="mt-4 space-y-3">{data.map(item => {
      const year = item.label.replace('พ.ศ. ', '');
      const href = (completionStatus: string) => `/cases?${new URLSearchParams({ type, year, completionStatus })}`;
      return <div key={item.label} className="min-w-0">
        <div className="mb-1 flex flex-wrap items-baseline justify-between gap-x-2 text-sm"><span className="font-semibold text-white">{item.label}</span><strong className="tabular-nums text-white">{number.format(item.pending + item.completed)} เรื่อง</strong></div>
        <div aria-hidden="true" className="cyber-chart-track flex h-2.5 overflow-hidden rounded-full" style={{ width: `${(item.pending + item.completed) / max * 100}%` }}><span className="bg-[#d62839]" style={{ width: `${item.completed / (item.pending + item.completed) * 100}%` }} /><span className="cyber-bar-secondary" style={{ width: `${item.pending / (item.pending + item.completed) * 100}%` }} /></div>
        <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs"><Link href={href('completed')} className="font-semibold text-white underline-offset-2 hover:underline">เสร็จแล้ว {number.format(item.completed)}</Link><Link href={href('open')} className="font-medium text-zinc-400 underline-offset-2 hover:text-white hover:underline">ค้าง {number.format(item.pending)}</Link></div>
      </div>;
    })}</div> : <EmptyChart />}
    <p className="mt-3 text-xs leading-5 text-zinc-500">สถานะปัจจุบันของเรื่องแต่ละปี ไม่ใช่ปีที่ดำเนินการเสร็จ</p>
  </figure>;
}

export function YearColumns({ data, scaleMax, accent }: { data: Bucket[]; scaleMax: number; accent: RegistryAccent }) {
  const max = Math.max(scaleMax, 1);
  return <figure className={chartCard}>
    <figcaption><h3 className="text-base font-bold text-white">เรื่องค้างแยกตามปี</h3><p className="mt-1 text-xs leading-5 text-zinc-400">หน่วย: เรื่อง · อ่านปีจากท้ายเลขดำ เช่น 123/68 = 2568</p></figcaption>
    {data.length ? <>
      <div className="mt-4 flex gap-3">
        <div aria-hidden="true" className="mt-6 flex h-40 shrink-0 flex-col justify-between pb-0 text-xs tabular-nums text-zinc-500"><span>{number.format(max)}</span><span>{number.format(max / 2)}</span><span>0</span></div>
        <div className="min-w-0 flex-1 overflow-x-auto pb-2 pt-6">
          <div className="relative flex gap-3" style={{ minWidth: data.length * 56 }}>
            <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-40 border-b border-white/10"><div className="absolute inset-x-0 top-0 border-t border-dashed border-white/[0.06]" /><div className="absolute inset-x-0 top-1/2 border-t border-dashed border-white/[0.06]" /></div>
            {data.map((item, idx) => <div key={item.label} className="relative min-w-12 flex-1 text-center">
              <div className="flex h-40 items-end justify-center">
                <div className={`relative w-full max-w-12 rounded-t ${idx === data.length - 1 ? barClasses[accent] : "cyber-bar-secondary"}`} style={{ height: `${item.count / max * 100}%` }}>
                  <strong className="absolute -top-6 inset-x-0 text-sm tabular-nums text-white">{number.format(item.count)}</strong>
                </div>
              </div>
              <p className="mt-3 break-words text-xs font-semibold leading-5 text-zinc-400">{item.label.replace("พ.ศ. ", "")}</p>
            </div>)}
          </div>
        </div>
      </div>
      <p className="mt-3 text-xs leading-5 text-zinc-500">ปีของเรื่อง ไม่ใช่ปีที่รับเข้า · เรียงจากปีเก่าไปปีใหม่</p>
    </> : <EmptyChart />}
  </figure>;
}

export function RankedBars({ title, note, data, total, scaleMax, accent }: {
  title: string; note: string; data: Bucket[]; total: number; scaleMax: number; accent: RegistryAccent;
}) {
  const max = Math.max(scaleMax, 1);
  return <figure className={chartCard}>
    <figcaption><h3 className="text-base font-bold text-white">{title}</h3><p className="mt-1 text-xs leading-5 text-zinc-400">{note}</p></figcaption>
    {data.length ? <ol className="mt-4 space-y-3">{data.map((item, index) => <li key={item.label}>
      <div className="mb-1.5 flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
        <div className="flex min-w-0 items-start gap-2"><span aria-hidden="true" className="mt-0.5 shrink-0 text-[11px] font-semibold tabular-nums text-zinc-500">{String(index + 1).padStart(2, "0")}</span>
          <span className="min-w-0 whitespace-pre-wrap break-words text-sm font-normal leading-6 text-zinc-300 [overflow-wrap:anywhere]">{item.label}</span></div>
        <div className="flex shrink-0 items-baseline gap-2 text-right"><strong className="block text-sm tabular-nums text-white">{number.format(item.count)} เรื่อง</strong><span className="text-[11px] tabular-nums text-zinc-400">{percent.format(total ? item.count / total * 100 : 0)}% ของเรื่องค้าง</span></div>
      </div>
      <div aria-hidden="true" className="cyber-chart-track h-2 overflow-hidden rounded-full"><div className={`h-full rounded-full ${barClasses[accent]}`} style={{ width: `${item.count / max * 100}%` }} /></div>
    </li>)}</ol> : <EmptyChart />}
  </figure>;
}

function EmptyChart() {
  return <p className="mt-6 rounded-xl bg-[#16161b] p-6 text-center text-sm text-zinc-500">ไม่มีเรื่องค้างให้แสดงกราฟ</p>;
}
