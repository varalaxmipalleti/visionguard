"use client";

import { useEffect, useState } from "react";

export function ApiStatus() {
  const [isConnected, setIsConnected] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    const checkHealth = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2500);

        const baseUrl = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1").replace("/api/v1", "");
        const res = await fetch(`${baseUrl}/`, {
          method: "GET",
          signal: controller.signal,
          headers: {
            "Accept": "application/json"
          }
        });

        clearTimeout(timeoutId);

        if (isMounted) {
          // If server responded (even 404/200), backend is alive
          setIsConnected(true);
        }
      } catch (error) {
        if (isMounted) {
          setIsConnected(false);
        }
      }
    };

    checkHealth();
    // Re-check every 30 seconds to keep terminal clean without redundant log polling
    const interval = setInterval(checkHealth, 30000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="flex items-center gap-2 px-2 py-1 text-xs font-medium text-slate-600 dark:text-muted-foreground">
      {isConnected ? (
        <>
          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
          <span className="font-sans">Engine Connected</span>
        </>
      ) : (
        <>
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0 shadow-[0_0_8px_rgba(239,68,68,0.4)]" />
          <span className="font-sans">Engine Disconnected</span>
        </>
      )}
    </div>
  );
}
