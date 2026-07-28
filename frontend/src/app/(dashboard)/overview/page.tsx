"use client";

import { Card } from "@/components/ui/card";
import { 
  Play, Film, Video, Cpu, Database, Sparkles, ArrowRight, CheckCircle2 
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function OverviewPage() {
  const router = useRouter();

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-6xl mx-auto pb-12">
      {/* 1. Clean Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600/15 via-indigo-600/10 to-slate-900/5 dark:from-blue-950/50 dark:via-indigo-950/40 dark:to-black/60 border border-blue-500/20 dark:border-white/10 p-8 sm:p-12 shadow-lg backdrop-blur-md">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
        
        <div className="relative z-10 space-y-6 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 dark:bg-blue-500/20 border border-blue-500/30 text-blue-600 dark:text-blue-400 text-xs font-semibold tracking-wide uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            Computer Vision Platform
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
              Welcome to <span className="text-blue-600 dark:text-blue-400">VisionGuard AI</span>
            </h1>
            <p className="text-base sm:text-lg font-medium text-slate-700 dark:text-slate-200 leading-relaxed">
              Next-Generation Real-Time Video Surveillance & Forensic Analysis powered by YOLOv11 and DeepSORT neural tracking.
            </p>
          </div>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => router.push("/cameras")}
              className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-all shadow-md shadow-blue-500/20 hover:shadow-blue-500/30 flex items-center gap-2 group"
            >
              <Play className="w-4 h-4 fill-current" />
              Launch Live Cameras
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
            <button
              type="button"
              onClick={() => router.push("/media")}
              className="px-6 py-3 rounded-xl bg-slate-900/5 dark:bg-white/10 hover:bg-slate-900/10 dark:hover:bg-white/15 text-slate-800 dark:text-white font-semibold text-sm transition-all border border-slate-200 dark:border-white/10 flex items-center gap-2"
            >
              <Film className="w-4 h-4 text-indigo-500" />
              Open Media Lab
            </button>
          </div>
        </div>
      </div>

      {/* 2. How It Works (3 Simple Steps) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white">How It Works</h2>
          <span className="text-xs font-semibold text-slate-500 dark:text-muted-foreground">3-Step Autonomous Pipeline</span>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {[
            {
              step: "01",
              title: "Video Ingestion",
              desc: "Connect live USB webcams, wireless RTSP mobile phone streams, or upload offline MP4 video files.",
              icon: Video,
              color: "text-blue-600 dark:text-blue-400",
              bg: "bg-blue-500/10 border-blue-500/20"
            },
            {
              step: "02",
              title: "AI Inference & Tracking",
              desc: "YOLOv11 detects people, vehicles, and objects in real-time while DeepSORT assigns persistent tracking IDs.",
              icon: Cpu,
              color: "text-indigo-600 dark:text-indigo-400",
              bg: "bg-indigo-500/10 border-indigo-500/20"
            },
            {
              step: "03",
              title: "Forensic Reports & Logs",
              desc: "Export searchable metadata, downloadable PDF/CSV reports, and persistent detection logs in your cloud database.",
              icon: Database,
              color: "text-purple-600 dark:text-purple-400",
              bg: "bg-purple-500/10 border-purple-500/20"
            },
          ].map((item, i) => (
            <Card key={i} className="bg-white dark:bg-white/5 border border-slate-200/80 dark:border-white/10 backdrop-blur-md rounded-2xl p-6 shadow-sm hover:border-blue-500/30 transition-all flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-black font-mono text-slate-300 dark:text-white/20">{item.step}</span>
                  <div className={`p-2.5 rounded-xl border ${item.bg}`}>
                    <item.icon className={`w-5 h-5 ${item.color}`} />
                  </div>
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800 dark:text-white">{item.title}</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* 3. Simple Tech Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
        <div className="p-4 rounded-2xl bg-white dark:bg-white/5 border border-slate-200/80 dark:border-white/10 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0" />
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">YOLOv11 Object Detection Engine</span>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-white/5 border border-slate-200/80 dark:border-white/10 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-indigo-500 shrink-0" />
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">FastAPI & OpenCV 60 FPS Buffer</span>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-white/5 border border-slate-200/80 dark:border-white/10 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-purple-500 shrink-0" />
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">Neon Serverless Cloud Postgres</span>
        </div>
      </div>
    </div>
  );
}
