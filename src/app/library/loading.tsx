export default function LibraryLoading() {
  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8 space-y-6 font-thai animate-pulse">
      {/* Banner Skeleton */}
      <div className="rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#121215] p-6 sm:p-8 space-y-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-slate-200 dark:bg-white/10" />
          <div className="space-y-1.5">
            <div className="h-6 w-64 rounded-lg bg-slate-200 dark:bg-white/10" />
            <div className="h-4 w-96 rounded-md bg-slate-100 dark:bg-white/5" />
          </div>
        </div>
        {/* Search Bar Placeholder */}
        <div className="pt-2">
          <div className="h-12 w-full rounded-2xl bg-slate-100 dark:bg-white/5" />
        </div>
      </div>

      {/* Tabs Skeleton */}
      <div className="flex gap-4 border-b border-slate-200 dark:border-white/10 pb-2">
        <div className="h-8 w-36 rounded-lg bg-slate-200 dark:bg-white/10" />
        <div className="h-8 w-36 rounded-lg bg-slate-100 dark:bg-white/5" />
        <div className="h-8 w-36 rounded-lg bg-slate-100 dark:bg-white/5" />
        <div className="h-8 w-36 rounded-lg bg-slate-100 dark:bg-white/5" />
      </div>

      {/* Law Cards Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#121215] p-5 space-y-3.5 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div className="h-5 w-24 rounded bg-slate-200 dark:bg-white/10" />
              <div className="h-5 w-16 rounded-full bg-slate-100 dark:bg-white/5" />
            </div>
            <div className="h-4 w-full rounded bg-slate-200 dark:bg-white/10" />
            <div className="h-4 w-3/4 rounded bg-slate-100 dark:bg-white/5" />
            <div className="pt-2 flex items-center justify-between">
              <div className="h-4 w-20 rounded bg-slate-100 dark:bg-white/5" />
              <div className="h-4 w-12 rounded bg-slate-200 dark:bg-white/10" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
