export default function GlobalLoading() {
  return (
    <div className="min-h-[60vh] w-full p-6 sm:p-8 animate-pulse font-thai">
      {/* Top Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200/80 dark:border-white/10">
        <div className="space-y-2.5">
          <div className="h-7 w-56 rounded-lg bg-slate-200 dark:bg-white/10" />
          <div className="h-4 w-72 rounded-md bg-slate-100 dark:bg-white/5" />
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-24 rounded-lg bg-slate-200 dark:bg-white/10" />
          <div className="h-9 w-32 rounded-lg bg-slate-200 dark:bg-white/10" />
        </div>
      </div>

      {/* Main Bento Cards Skeleton */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="h-36 rounded-2xl border border-slate-200/70 dark:border-white/10 bg-white/60 dark:bg-[#121215]/80 p-5 space-y-3">
          <div className="h-4 w-28 rounded bg-slate-200 dark:bg-white/10" />
          <div className="h-8 w-20 rounded bg-slate-200 dark:bg-white/10" />
          <div className="h-3 w-40 rounded bg-slate-100 dark:bg-white/5" />
        </div>
        <div className="h-36 rounded-2xl border border-slate-200/70 dark:border-white/10 bg-white/60 dark:bg-[#121215]/80 p-5 space-y-3">
          <div className="h-4 w-28 rounded bg-slate-200 dark:bg-white/10" />
          <div className="h-8 w-20 rounded bg-slate-200 dark:bg-white/10" />
          <div className="h-3 w-40 rounded bg-slate-100 dark:bg-white/5" />
        </div>
        <div className="h-36 rounded-2xl border border-slate-200/70 dark:border-white/10 bg-white/60 dark:bg-[#121215]/80 p-5 space-y-3">
          <div className="h-4 w-28 rounded bg-slate-200 dark:bg-white/10" />
          <div className="h-8 w-20 rounded bg-slate-200 dark:bg-white/10" />
          <div className="h-3 w-40 rounded bg-slate-100 dark:bg-white/5" />
        </div>
      </div>

      {/* Content Area Skeleton */}
      <div className="mt-6 rounded-2xl border border-slate-200/70 dark:border-white/10 bg-white/80 dark:bg-[#121215] p-6 space-y-4">
        <div className="h-5 w-48 rounded bg-slate-200 dark:bg-white/10" />
        <div className="space-y-3 pt-2">
          <div className="h-10 w-full rounded-lg bg-slate-100 dark:bg-white/5" />
          <div className="h-10 w-full rounded-lg bg-slate-100 dark:bg-white/5" />
          <div className="h-10 w-full rounded-lg bg-slate-100 dark:bg-white/5" />
          <div className="h-10 w-full rounded-lg bg-slate-100 dark:bg-white/5" />
        </div>
      </div>
    </div>
  );
}
