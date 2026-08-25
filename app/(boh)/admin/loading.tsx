export default function Loading() {
  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto w-full animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="skeleton h-7 w-64 rounded-xl" />
          <div className="skeleton h-3.5 w-48 rounded-lg" />
        </div>
        <div className="skeleton h-9 w-24 rounded-xl" />
      </div>
      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="skeleton h-3.5 w-28 rounded" />
            <div className="skeleton h-8 w-20 rounded-lg" />
            <div className="skeleton h-3 w-32 rounded" />
          </div>
        ))}
      </div>
      {/* Chart placeholder */}
      <div className="skeleton h-56 w-full rounded-3xl" />
      {/* Bottom row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="skeleton h-44 rounded-3xl" />
        ))}
      </div>
    </div>
  );
}
