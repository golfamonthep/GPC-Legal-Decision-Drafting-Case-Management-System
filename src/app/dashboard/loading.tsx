export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-[1600px] px-3 py-5 sm:px-6 sm:py-7 xl:px-10">
      <div className="animate-pulse">
        <div className="h-56 rounded-3xl bg-slate-800"></div>
        
        <div className="mt-6 grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 xl:grid-cols-5">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-white overflow-hidden shadow rounded-lg px-4 py-5 sm:p-6 h-32">
              <div className="h-4 bg-slate-200 rounded w-1/2 mb-4"></div>
              <div className="h-8 bg-slate-200 rounded w-1/3"></div>
            </div>
          ))}
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1.55fr_1fr]">
          <div className="h-80 rounded-2xl bg-white shadow-sm"></div>
          <div className="h-80 rounded-2xl bg-white shadow-sm"></div>
        </div>
      </div>
    </div>
  );
}
