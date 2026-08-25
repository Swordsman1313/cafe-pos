export default function Loading() {
  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto w-full">
      <div className="space-y-2">
        <div className="skeleton h-7 w-56 rounded-xl" />
        <div className="skeleton h-3.5 w-36 rounded-lg" />
      </div>
      <div className="skeleton h-64 w-full rounded-3xl" />
    </div>
  );
}
