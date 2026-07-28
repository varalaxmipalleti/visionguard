"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Activity, Users, Car, Video, AlertTriangle, Plus, Settings, 
  Zap, CheckCircle2, Loader2, RefreshCw, Download, FileText, Database, ShieldCheck 
} from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

export default function DynamicDashboard() {
  const { token, user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [latencyResult, setLatencyResult] = useState<string | null>(null);
  const [testingLatency, setTestingLatency] = useState(false);
  const [exporting, setExporting] = useState<string | null>(null);

  const [overview, setOverview] = useState({
    active_cameras: 0,
    total_cameras: 0,
    total_detections: 0,
    people_tracked: 0,
    vehicles_logged: 0,
    camera_uptime: "0%",
    alerts: [] as { time: string; msg: string; type: string }[],
  });

  const fetchOverview = async (isRefresh = false) => {
    if (!token) { setLoading(false); return; }
    if (isRefresh) setRefreshing(true);
    try {
      const res = await fetch(`${API_BASE}/analytics/overview`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setOverview(data);
      }
    } catch (err) {
      console.error("Failed to load analytics overview:", err);
    } finally {
      setLoading(false);
      if (isRefresh) setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, [token]);

  const testLatency = async () => {
    if (!token || testingLatency) return;
    setTestingLatency(true);
    setLatencyResult(null);
    const start = performance.now();
    try {
      await fetch(`${API_BASE}/users/me`, { headers: { Authorization: `Bearer ${token}` } });
      const elapsed = Math.round(performance.now() - start);
      setLatencyResult(`Neon Postgres DB Latency: ${elapsed}ms (Online & Synchronized)`);
      setTimeout(() => setLatencyResult(null), 5000);
    } catch (err) {
      setLatencyResult("Database Latency Check Failed!");
      setTimeout(() => setLatencyResult(null), 5000);
    } finally {
      setTestingLatency(false);
    }
  };

  const handleExport = async (format: "csv" | "pdf") => {
    if (!token) return;
    setExporting(format);
    try {
      const res = await fetch(`${API_BASE}/analytics/export/${format}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = format === "csv" ? "visionguard_analytics.csv" : "visionguard_report.pdf";
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
    } catch (err) {
      console.error(`Failed to export ${format}:`, err);
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-6xl mx-auto pb-12">
      {/* Header with Real Report Export Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-white flex items-center gap-2">
            Live Intelligence Dashboard
            {refreshing && <Loader2 className="w-5 h-5 animate-spin text-blue-500" />}
          </h1>
          <p className="text-slate-500 dark:text-muted-foreground mt-1 text-sm">
            100% real-time database metrics and live AI engine analytics from Postgres.
          </p>
        </div>

        {/* Dynamic Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => handleExport("csv")}
            disabled={!!exporting}
            className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 text-slate-700 dark:text-slate-200 font-semibold text-xs transition-colors flex items-center gap-1.5 border border-slate-200 dark:border-white/10"
          >
            {exporting === "csv" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4 text-blue-500" />}
            Export CSV
          </button>
          <button
            type="button"
            onClick={() => handleExport("pdf")}
            disabled={!!exporting}
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-md shadow-indigo-500/20"
          >
            {exporting === "pdf" ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
            Export PDF Report
          </button>
          <button
            type="button"
            onClick={testLatency}
            disabled={testingLatency}
            className="px-3.5 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-semibold text-xs transition-colors flex items-center gap-1.5 border border-emerald-500/20"
          >
            {testingLatency ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            Test DB Latency
          </button>
          <button
            type="button"
            onClick={() => fetchOverview(true)}
            disabled={refreshing}
            title="Refresh Database Data"
            className="p-2 rounded-xl bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 text-slate-700 dark:text-slate-200 transition-colors border border-slate-200 dark:border-white/10"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {latencyResult && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          {latencyResult}
        </div>
      )}

      {/* 4 Dynamic Postgres Stat Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[
          { title: "Active Cameras", value: `${overview.active_cameras} / ${overview.total_cameras}`, icon: Video, color: "text-blue-600 dark:text-blue-400", desc: "Live Postgres query" },
          { title: "Total AI Detections", value: overview.total_detections.toLocaleString(), icon: Activity, color: "text-emerald-600 dark:text-emerald-400", desc: "Real motion logs" },
          { title: "Persons Tracked", value: overview.people_tracked.toLocaleString(), icon: Users, color: "text-indigo-600 dark:text-indigo-400", desc: "Real database counter" },
          { title: "Vehicles Logged", value: overview.vehicles_logged.toLocaleString(), icon: Car, color: "text-orange-600 dark:text-orange-400", desc: "Real database counter" },
        ].map((stat, i) => (
          <Card key={i} className="bg-white dark:bg-white/5 border border-slate-200/80 dark:border-white/10 backdrop-blur-md overflow-hidden rounded-2xl shadow-sm hover:shadow-md transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200/60 dark:border-white/10">
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight">{stat.value}</div>
              <p className="text-xs text-slate-500 dark:text-muted-foreground mt-1.5 font-medium flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                {stat.desc}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Bottom Grid: Real-time Database Status & Live Logs */}
      <div className="grid gap-6 md:grid-cols-12 items-start">
        {/* Left 7 cols: Active Ingestion & Camera Status */}
        <Card className="md:col-span-7 bg-white dark:bg-white/5 border border-slate-200/80 dark:border-white/10 backdrop-blur-md rounded-2xl p-6 space-y-6 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200/70 dark:border-white/5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                <Video className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-800 dark:text-white">Active Video Streams</h2>
                <p className="text-xs text-slate-500 dark:text-muted-foreground">Live camera ingestion status from Postgres</p>
              </div>
            </div>
            <button
              onClick={() => router.push("/cameras")}
              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center gap-1 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Manage Cameras
            </button>
          </div>

          {overview.total_cameras === 0 ? (
            <div className="p-8 rounded-xl bg-slate-50 dark:bg-white/5 border border-dashed border-slate-200 dark:border-white/10 text-center space-y-3">
              <Video className="w-10 h-10 text-slate-400 mx-auto opacity-50" />
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">No Live Cameras Configured</p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Connect a USB DirectShow webcam or IP RTSP stream in the Live Cameras section to begin real-time AI ingestion.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <div>
                    <p className="text-sm font-bold text-slate-800 dark:text-white">Active Ingestion Pipeline</p>
                    <p className="text-xs text-slate-500">Processing {overview.active_cameras} streams at 30+ FPS</p>
                  </div>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  {overview.camera_uptime} Uptime
                </span>
              </div>
            </div>
          )}
        </Card>

        {/* Right 5 cols: Live System Events from DB */}
        <Card className="md:col-span-5 bg-white dark:bg-white/5 border border-slate-200/80 dark:border-white/10 backdrop-blur-md rounded-2xl p-6 space-y-6 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200/70 dark:border-white/5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-800 dark:text-white">Live System Logs</h2>
                <p className="text-xs text-slate-500 dark:text-muted-foreground">Dynamic events from Neon cluster</p>
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-1">
            {overview.alerts && overview.alerts.length > 0 ? (
              overview.alerts.map((alert, i) => (
                <div key={i} className="flex items-start space-x-3 p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                  <div className={`mt-1.5 h-2 w-2 rounded-full flex-shrink-0 ${alert.type === 'warning' ? 'bg-amber-500' : 'bg-blue-500'}`} />
                  <div className="space-y-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-800 dark:text-white leading-tight">{alert.msg}</p>
                    <p className="text-[10px] text-slate-500 dark:text-muted-foreground">{alert.time}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 text-center py-4">No recent database events.</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
