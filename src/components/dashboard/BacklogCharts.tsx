type Bucket = { label: string; count: number };
export type RegistryAccent = "teal" | "blue";

const number = new Intl.NumberFormat("th-TH");
const percent = new Intl.NumberFormat("th-TH", { maximumFractionDigits: 1 });
const colors = { teal: "#0f766e", blue: "#1d4ed8" };
const barClasses = { teal: "bg-teal-700", blue: "bg-blue-700" };

export function CompletionRing({ total, pending, accent }: { total: number; pending: number; accent: RegistryAccent }) {
  const completed = total - pending;
  const share = total > 0 ? completed / total : 0;
  return <figure className="flex min-w-0 flex-wrap items-center gap-5">
    <div className="relative h-36 w-36 shrink-0">
      <svg viewBox="0 0 144 144" className="h-full w-full" aria-hidden="true">
        <circle cx="72" cy="72" r="59" fill="none" stroke="#e2e8f0" strokeWidth="12" />
        {total > 0 && <circle cx="72" cy="72" r="59" fill="none" stroke={colors[accent]} strokeWidth="12" pathLength="100"
          strokeDasharray={`${share * 100} 100`} transform="rotate(-90 72 72)" />}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <strong className="text-2xl font-bold tabular-nums text-slate-950">{total ? `${percent.format(share * 100)}%` : "—"}</strong>
        <span className="mt-1 text-xs text-slate-500">{total ? "เสร็จสิ้น" : "ยังไม่มีข้อมูล"}</span>
      </div>
    </div>
    <figcaption className="min-w-0 space-y-3 text-sm text-slate-600">
      <p className="font-semibold text-slate-800">สัดส่วนของทะเบียนทั้งหมด</p>
      <p className="flex items-center gap-2"><span aria-hidden="true" className={`h-2.5 w-2.5 rounded-full ${barClasses[accent]}`} />เสร็จสิ้น <strong className="text-slate-950">{number.format(completed)} เรื่อง</strong></p>
      <p className="flex items-center gap-2"><span aria-hidden="true" className="h-2.5 w-2.5 rounded-full border border-slate-400 bg-slate-200" />ค้าง <strong className="text-slate-950">{number.format(pending)} เรื่อง</strong></p>
      <p className="text-xs">ฐาน: {number.format(total)} เรื่อง · ไม่ใช่อัตราการทำงานรายเดือน</p>
    </figcaption>
  </figure>;
}

export function YearColumns({ data, scaleMax, accent }: { data: Bucket[]; scaleMax: number; accent: RegistryAccent }) {
  const max = Math.max(scaleMax, 1);
  return <figure className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
    <figcaption><h3 className="text-lg font-bold text-slate-950">เรื่องค้างแยกตามปี</h3><p className="mt-1 text-xs leading-5 text-slate-500">หน่วย: เรื่อง · อ่านปีจากท้ายเลขดำ เช่น 123/68 = 2568</p></figcaption>
    {data.length ? <>
      <div className="mt-6 flex gap-3">
        <div aria-hidden="true" className="mt-6 flex h-48 shrink-0 flex-col justify-between pb-0 text-[11px] tabular-nums text-slate-500"><span>{number.format(max)}</span><span>{number.format(max / 2)}</span><span>0</span></div>
        <div className="min-w-0 flex-1 overflow-x-auto pb-2 pt-6">
          <div className="relative flex gap-3" style={{ minWidth: data.length * 56 }}>
            <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-48 border-b border-slate-300"><div className="absolute inset-x-0 top-0 border-t border-dashed border-slate-200" /><div className="absolute inset-x-0 top-1/2 border-t border-dashed border-slate-200" /></div>
            {data.map(item => <div key={item.label} className="relative min-w-12 flex-1 text-center">
              <div className="flex h-48 items-end justify-center">
                <div className={`relative w-full max-w-16 rounded-t-md ${barClasses[accent]}`} style={{ height: `${item.count / max * 100}%` }}>
                  <strong className="absolute -top-6 inset-x-0 text-sm tabular-nums text-slate-950">{number.format(item.count)}</strong>
                </div>
              </div>
              <p className="mt-3 break-words text-xs font-semibold leading-5 text-slate-600">{item.label.replace("พ.ศ. ", "")}</p>
            </div>)}
          </div>
        </div>
      </div>
      <p className="mt-3 text-xs leading-5 text-slate-500">ปีของเรื่อง ไม่ใช่ปีที่รับเข้า · เรียงจากปีเก่าไปปีใหม่</p>
    </> : <EmptyChart />}
  </figure>;
}

export function RankedBars({ title, note, data, total, scaleMax, accent }: {
  title: string; note: string; data: Bucket[]; total: number; scaleMax: number; accent: RegistryAccent;
}) {
  const max = Math.max(scaleMax, 1);
  return <figure className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
    <figcaption><h3 className="text-lg font-bold text-slate-950">{title}</h3><p className="mt-1 text-xs leading-5 text-slate-500">{note}</p></figcaption>
    {data.length ? <ol className="mt-6 space-y-5">{data.map((item, index) => <li key={item.label}>
      <div className="mb-2 flex flex-col items-start gap-2 sm:flex-row sm:justify-between sm:gap-3">
        <div className="flex min-w-0 items-start gap-2"><span aria-hidden="true" className="mt-0.5 shrink-0 text-[11px] font-semibold tabular-nums text-slate-400">{String(index + 1).padStart(2, "0")}</span>
          <span className="min-w-0 whitespace-pre-wrap break-words text-sm font-medium leading-6 text-slate-700 [overflow-wrap:anywhere]">{item.label}</span></div>
        <div className="flex shrink-0 items-baseline gap-2 sm:block sm:text-right"><strong className="block text-sm tabular-nums text-slate-950">{number.format(item.count)} เรื่อง</strong><span className="text-[11px] tabular-nums text-slate-500">{percent.format(total ? item.count / total * 100 : 0)}% ของเรื่องค้าง</span></div>
      </div>
      <div aria-hidden="true" className="h-3.5 overflow-hidden rounded bg-slate-100"><div className={`h-full rounded-r ${barClasses[accent]}`} style={{ width: `${item.count / max * 100}%` }} /></div>
    </li>)}</ol> : <EmptyChart />}
  </figure>;
}

function EmptyChart() {
  return <p className="mt-6 rounded-xl bg-slate-50 p-6 text-center text-sm text-slate-500">ไม่มีเรื่องค้างให้แสดงกราฟ</p>;
}
