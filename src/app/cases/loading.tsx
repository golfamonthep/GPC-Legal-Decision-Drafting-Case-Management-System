export default function CasesLoading() {
  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8 space-y-6 font-thai animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="h-7 w-48 rounded-lg bg-slate-200 dark:bg-white/10" />
          <div className="h-4 w-64 rounded-md bg-slate-100 dark:bg-white/5 mt-2" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-9 w-28 rounded-lg bg-slate-200 dark:bg-white/10" />
          <div className="h-9 w-32 rounded-lg bg-slate-200 dark:bg-white/10" />
        </div>
      </div>

      {/* Filter Chips Bar Skeleton */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/60 dark:bg-[#121215]/80 p-4 space-y-3">
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-8 w-24 rounded-full bg-slate-200 dark:bg-white/10" />
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div className="h-9 rounded-lg bg-slate-100 dark:bg-white/5" />
          <div className="h-9 rounded-lg bg-slate-100 dark:bg-white/5" />
          <div className="h-9 rounded-lg bg-slate-100 dark:bg-white/5" />
        </div>
      </div>

      {/* Case Table Skeleton */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#121215] overflow-hidden shadow-sm">
        {/* Table Header */}
        <div className="border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] px-6 py-4 grid grid-cols-12 gap-4">
          <div className="col-span-2 h-4 rounded bg-slate-200 dark:bg-white/10" />
          <div className="col-span-3 h-4 rounded bg-slate-200 dark:bg-white/10" />
          <div className="col-span-3 h-4 rounded bg-slate-200 dark:bg-white/10" />
          <div className="col-span-2 h-4 rounded bg-slate-200 dark:bg-white/10" />
          <div className="col-span-2 h-4 rounded bg-slate-200 dark:bg-white/10" />
        </div>

        {/* Rows */}
        <div className="divide-y divide-slate-100 dark:divide-white/[0.06] p-2 space-y-2">
          {[1, 2, 3, 4, 5, 6, 7].map((row) => (
            <div key={row} className="px-4 py-3.5 grid grid-cols-12 gap-4 items-center">
              <div className="col-span-2 space-y-1.5">
                <div className="h-4 w-20 rounded bg-slate-200 dark:bg-white/10" />
                <div className="h-3 w-16 rounded bg-slate-100 dark:bg-white/5" />
              </div>
              <div className="col-span-3 space-y-1.5">
                <div className="h-4 w-36 rounded bg-slate-200 dark:bg-white/10" />
                <div className="h-3 w-28 rounded bg-slate-100 dark:bg-white/5" />
              </div>
              <div className="col-span-3 space-y-1.5">
                <div className="h-4 w-44 rounded bg-slate-200 dark:bg-white/10" />
                <div className="h-3 w-24 rounded bg-slate-100 dark:bg-white/5" />
              </div>
              <div className="col-span-2">
                <div className="h-6 w-24 rounded-full bg-slate-200 dark:bg-white/10" />
              </div>
              <div className="col-span-2">
                <div className="h-4 w-16 rounded bg-slate-200 dark:bg-white/10" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
