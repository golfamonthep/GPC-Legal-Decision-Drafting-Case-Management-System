export default function DashboardLoading() {
  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8">
      <div className="animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-1/4 mb-2"></div>
        <div className="h-4 bg-slate-200 rounded w-1/3 mb-8"></div>
        
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white overflow-hidden shadow rounded-lg px-4 py-5 sm:p-6 h-32">
              <div className="h-4 bg-slate-200 rounded w-1/2 mb-4"></div>
              <div className="h-8 bg-slate-200 rounded w-1/3"></div>
            </div>
          ))}
        </div>

        <div className="mt-12">
          <div className="h-6 bg-slate-200 rounded w-1/3 mb-4"></div>
          <div className="bg-white shadow sm:rounded-lg h-64"></div>
        </div>
      </div>
    </div>
  );
}
