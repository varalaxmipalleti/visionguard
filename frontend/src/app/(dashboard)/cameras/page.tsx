"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Smartphone, Laptop, Power, VideoOff, Activity, Sliders } from "lucide-react";
import { getApiBaseUrl } from "@/lib/utils";

export default function LiveCameras() {
  const [streamMode, setStreamMode] = useState<"droidcam" | "webcam">("webcam");
  const [droidcamIp, setDroidcamIp] = useState("192.168.1.6");
  const [activeStream, setActiveStream] = useState<string | null>(null);
  const [streamKey, setStreamKey] = useState(0);
  const [isStreamLoading, setIsStreamLoading] = useState(false);

  // Dynamically generated real-time streaming target URL
  const targetStreamUrl = streamMode === "webcam" ? "0" : `http://${droidcamIp.trim()}:4747/video`;

  const stopRemoteStream = useCallback(async (targetUrl: string) => {
    try {
      const baseUrl = getApiBaseUrl();
      await fetch(`${baseUrl}/cameras/stop-ip-stream?url=${encodeURIComponent(targetUrl)}`, {
        method: "POST",
      });
    } catch (err) {
      console.error("Failed to notify backend camera shutdown:", err);
    }
  }, []);

  const handleConnect = () => {
    setIsStreamLoading(true);
    setActiveStream(targetStreamUrl);
    setStreamKey(Date.now());
  };

  const handleDisconnect = () => {
    if (activeStream) {
      stopRemoteStream(activeStream);
    }
    setIsStreamLoading(false);
    setActiveStream(null);
  };

  // Turn off hardware camera sensor indicator light when leaving page
  useEffect(() => {
    return () => {
      if (activeStream) {
        stopRemoteStream(activeStream);
      }
    };
  }, [activeStream, stopRemoteStream]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Page Header section matching exact Varam Dashboard project style */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-white">Live Cameras</h1>
          <p className="text-slate-500 dark:text-muted-foreground mt-1 text-sm">Real-time object tracking over wireless DroidCam and local webcam feeds.</p>
        </div>
      </div>

      {/* Horizontal Side-by-Side Responsive Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* Left Column: Stream Configuration Console (4 Cols) */}
        <div className="lg:col-span-4 w-full">
          <Card className="bg-white dark:bg-white/5 border border-slate-200/80 dark:border-white/10 backdrop-blur-md overflow-hidden hover:border-blue-500/30 dark:hover:border-primary/50 transition-colors shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] dark:shadow-none p-6 space-y-6 rounded-2xl">
            <div className="text-base font-semibold text-slate-800 dark:text-white flex items-center gap-2.5">
              <Sliders className="w-4 h-4 text-blue-600 dark:text-primary shrink-0" />
              <span>Stream Configuration</span>
            </div>

            <div className="space-y-6">
              {/* Step 1: Device Select */}
              <div className="space-y-2.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-muted-foreground block">
                  1. Source Device Mode
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={activeStream !== null}
                    onClick={() => setStreamMode("droidcam")}
                    className={`py-2.5 px-3 rounded-xl text-xs transition-all flex items-center justify-center gap-2 ${streamMode === "droidcam"
                        ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold shadow-md shadow-blue-500/20 ring-1 ring-white/20"
                        : "bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-muted-foreground hover:bg-slate-200/70 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-foreground border border-slate-200/70 dark:border-white/10 font-medium"
                      }`}
                  >
                    <Smartphone className="w-3.5 h-3.5 shrink-0" />
                    <span>DroidCam</span>
                  </button>

                  <button
                    type="button"
                    disabled={activeStream !== null}
                    onClick={() => setStreamMode("webcam")}
                    className={`py-2.5 px-3 rounded-xl text-xs transition-all flex items-center justify-center gap-2 ${streamMode === "webcam"
                        ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold shadow-md shadow-blue-500/20 ring-1 ring-white/20"
                        : "bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-muted-foreground hover:bg-slate-200/70 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-foreground border border-slate-200/70 dark:border-white/10 font-medium"
                      }`}
                  >
                    <Laptop className="w-3.5 h-3.5 shrink-0" />
                    <span>Webcam</span>
                  </button>
                </div>
              </div>

              {/* Step 2: Connection Parameters */}
              <div className="space-y-2.5 pt-1 border-t border-slate-200/70 dark:border-white/5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-muted-foreground block">
                  2. Connection Parameters
                </label>
                {streamMode === "droidcam" ? (
                  <div className="space-y-2.5">
                    <div className="flex rounded-xl border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-black/40 overflow-hidden focus-within:border-blue-600 transition-all">
                      <input
                        type="text"
                        value={droidcamIp}
                        onChange={(e) => setDroidcamIp(e.target.value)}
                        disabled={activeStream !== null}
                        placeholder="192.168.1.6"
                        className="flex-1 px-4 py-2.5 bg-transparent text-slate-800 dark:text-foreground font-medium text-sm focus:outline-none disabled:opacity-50 min-w-0"
                      />
                      <span className="text-xs font-mono font-medium text-slate-500 dark:text-muted-foreground bg-slate-200/60 dark:bg-white/5 border-l border-slate-200 dark:border-white/10 px-3.5 py-2.5 flex items-center select-none whitespace-nowrap">
                        Port :4747
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-muted-foreground leading-relaxed font-medium">
                      Ensure both your phone and computer share the same WiFi network router.
                    </p>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/70 dark:border-white/5 text-xs text-slate-500 dark:text-muted-foreground space-y-1.5 font-medium">
                    <div className="font-semibold text-sm text-slate-800 dark:text-foreground flex items-center gap-2">
                      <Laptop className="w-4 h-4 text-blue-600 dark:text-primary shrink-0" />
                      <span>DirectShow Local Webcam (0)</span>
                    </div>
                    <p className="leading-relaxed">
                      Zero-latency native hardware capture enabled. Ready for high-speed real-time tracking.
                    </p>
                  </div>
                )}
              </div>

              {/* Step 3: Action Trigger Button */}
              <div className="pt-2 border-t border-slate-200/70 dark:border-white/5">
                {!activeStream ? (
                  <button
                    onClick={handleConnect}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-sm flex items-center justify-center gap-2.5 shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98]"
                  >
                    <Power className="w-4 h-4 shrink-0" />
                    <span>Connect Live Stream</span>
                  </button>
                ) : (
                  <button
                    onClick={handleDisconnect}
                    className="w-full py-3 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-sm flex items-center justify-center gap-2.5 shadow-lg shadow-red-500/20 transition-all active:scale-[0.98]"
                  >
                    <Power className="w-4 h-4 shrink-0 animate-pulse" />
                    <span>Disconnect Stream</span>
                  </button>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Live Surveillance Viewport (8 Cols) */}
        <div className="lg:col-span-8 w-full">
          <Card className="bg-white dark:bg-white/5 border border-slate-200/80 dark:border-white/10 backdrop-blur-md p-2.5 rounded-2xl overflow-hidden shadow-[0_4px_25px_-4px_rgba(0,0,0,0.06)] dark:shadow-none w-full">
            <div className="w-full bg-slate-950 dark:bg-black/95 text-white rounded-xl overflow-hidden flex flex-col items-center justify-center relative min-h-[440px] md:min-h-[480px] border border-slate-800/80 dark:border-white/10 shadow-inner">

              {/* Standby Idle State */}
              {!activeStream && (
                <div className="text-center max-w-md p-8 relative z-10">
                  <div className="w-16 h-16 rounded-full bg-slate-900 dark:bg-white/5 border border-slate-800 dark:border-white/10 flex items-center justify-center mx-auto mb-4 shadow-inner">
                    <VideoOff className="w-8 h-8 text-slate-400 dark:text-muted-foreground opacity-80" />
                  </div>
                  <h3 className="text-base font-semibold text-white">Surveillance Monitor Offline</h3>
                  <p className="text-sm text-slate-400 dark:text-muted-foreground mt-2 leading-relaxed font-normal">
                    Select your camera source on the left and press <strong className="text-white font-semibold">Connect Live Stream</strong> to activate real-time artificial intelligence object tracking.
                  </p>
                </div>
              )}

              {/* Active Stream & Loading Overlays */}
              {activeStream && (
                <div className="w-full flex-1 flex items-center justify-center relative bg-black">

                  {/* Clean loading spinner */}
                  {isStreamLoading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/95 z-20 space-y-4">
                      <div className="w-12 h-12 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
                      <p className="text-sm font-medium text-muted-foreground">
                        Engaging high-speed YOLOv11 stream...
                      </p>
                    </div>
                  )}

                  {/* High definition video stage without clunky overlapping tags */}
                  <img
                    src={`${getApiBaseUrl()}/cameras/live-ip-stream?url=${encodeURIComponent(activeStream)}&t=${streamKey}`}
                    alt="Live AI Surveillance Stream"
                    onLoad={() => setIsStreamLoading(false)}
                    onError={() => setIsStreamLoading(false)}
                    className={`w-auto h-auto max-h-[520px] max-w-full object-contain block mx-auto transition-opacity duration-300 ${isStreamLoading ? "opacity-0" : "opacity-100"}`}
                  />

                  {/* Subtle status caption positioned cleanly in bottom-right corner without overlapping DroidCam date/time timestamp! */}
                  {!isStreamLoading && (
                    <div className="absolute bottom-3.5 right-3.5 z-10 flex items-center gap-2 bg-black/80 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-lg text-xs font-medium text-white shadow-lg pointer-events-none">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                      <span>{streamMode === "droidcam" ? `DroidCam Stream (${droidcamIp}:4747)` : "Laptop HD Webcam Stream (0)"}</span>
                      <span className="text-emerald-400 font-mono pl-1 border-l border-white/20">30.0 FPS</span>
                    </div>
                  )}

                </div>
              )}

            </div>
          </Card>
        </div>

      </div>
    </div>
  );
}
