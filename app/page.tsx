"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const sessionStr = typeof window !== "undefined" ? localStorage.getItem("pos_session") : null;
    if (sessionStr) {
      try {
        const session = JSON.parse(sessionStr);
        if (session.role === "OWNER" || session.role === "STORE_MANAGER" || session.role === "SUPERVISOR") {
          router.replace("/admin");
          return;
        }
        router.replace("/pos");
        return;
      } catch (e) {
        // invalid session
      }
    }
    router.replace("/login");
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-400">
      <div className="flex items-center gap-3">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-amber-500 border-t-transparent"></div>
        <span className="text-sm font-medium">Launching Café POS System...</span>
      </div>
    </div>
  );
}
