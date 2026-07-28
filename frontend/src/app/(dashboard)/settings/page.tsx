"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Cpu, Eye, Save, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { useAuth } from "@/context/auth-context";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

const COLOR_SPACES = [
  "YCbCr + HSV (Dual Consensus)",
  "Lab + RGB (Illumination Adaptive)",
  "YCbCr + Lab + HSV (Triple Multi-Space)",
  "Standard RGB (High Speed / Low CPU)",
];

export default function SettingsPage() {
  const { token } = useAuth();

  // Optimal defaults — overwritten on mount with user's saved prefs
  const [confidence, setConfidence] = useState(30);
  const [nms, setNms] = useState(40);
  const [gpuEnabled, setGpuEnabled] = useState(true);
  const [colorSpace, setColorSpace] = useState("YCbCr + HSV (Dual Consensus)");

  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // On mount: fetch the user's last saved preferences from backend
  useEffect(() => {
    if (!token) { setLoading(false); return; }

    fetch(`${API_BASE}/settings/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to load settings.");
        const data = await res.json();
        // Restore saved slider positions from DB
        if (data.settings_confidence != null) setConfidence(Math.round(data.settings_confidence * 100));
        if (data.settings_nms_iou != null) setNms(Math.round(data.settings_nms_iou * 100));
        if (data.settings_gpu_enabled != null) setGpuEnabled(data.settings_gpu_enabled);
        if (data.settings_color_space != null) setColorSpace(data.settings_color_space);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  const handleSave = async () => {
    if (!token) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/settings/sync`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          confidence: confidence / 100,
          nms_iou: nms / 100,
          gpu_enabled: gpuEnabled,
          color_space: colorSpace,
        }),
      });

      if (!res.ok) {
        const detail = await res.json();
        throw new Error(detail?.detail || "Save failed.");
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-white">System &amp; Engine Settings</h1>
          <p className="text-slate-500 dark:text-muted-foreground mt-1 text-sm">
            Configure deep neural network thresholds and adaptive background modeling pipelines.
            {loading && (
              <span className="ml-2 text-blue-500 inline-flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" /> Restoring your saved preferences...
              </span>
            )}
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving || loading}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-sm flex items-center gap-2 shadow-md shadow-blue-500/20 transition-all active:scale-95 shrink-0"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : saved ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-300" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          <span>{saving ? "Saving..." : saved ? "Settings Saved!" : "Save Preferences"}</span>
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Success banner */}
      {saved && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>Your preferences have been saved and applied to the live AI engine instantly!</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Neural Inference Tuning */}
        <Card className="bg-white dark:bg-white/5 border border-slate-200/80 dark:border-white/10 backdrop-blur-md rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] dark:shadow-none p-6 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-200/70 dark:border-white/5">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-800 dark:text-white">Neural Inference Engine</h3>
              <p className="text-xs text-slate-500 dark:text-muted-foreground">YOLOv11 hyperparameter tuning</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                <span>Confidence Threshold</span>
                <span className="font-mono text-blue-600 dark:text-blue-400">{confidence}%</span>
              </div>
              <input
                type="range"
                min="5"
                max="95"
                value={confidence}
                onChange={(e) => setConfidence(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <p className="text-[11px] text-slate-500 dark:text-muted-foreground">
                Minimum AI certainty required before flagging forensic target detections.{" "}
                <span className="text-blue-500 font-semibold">Optimal: 30%</span>
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                <span>NMS (Non-Maximum Suppression) IOU</span>
                <span className="font-mono text-indigo-600 dark:text-indigo-400">{nms}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="90"
                value={nms}
                onChange={(e) => setNms(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-white/10 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
              <p className="text-[11px] text-slate-500 dark:text-muted-foreground">
                Controls bounding box merging across overlapping frame annotations.{" "}
                <span className="text-indigo-500 font-semibold">Optimal: 40%</span>
              </p>
            </div>

            <div className="pt-2 border-t border-slate-200/70 dark:border-white/5 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-white">Hardware Acceleration (CUDA / DirectML)</p>
                <p className="text-xs text-slate-500 dark:text-muted-foreground">Utilize GPU tensor cores for real-time inference</p>
              </div>
              <button
                type="button"
                onClick={() => setGpuEnabled(!gpuEnabled)}
                className={`w-12 h-6.5 rounded-full p-1 transition-colors duration-200 ease-in-out flex ${
                  gpuEnabled ? "bg-blue-600 justify-end" : "bg-slate-300 dark:bg-white/15 justify-start"
                }`}
              >
                <span className="w-4.5 h-4.5 rounded-full bg-white shadow-md block transition-transform" />
              </button>
            </div>
          </div>
        </Card>

        {/* Card 2: Adaptive Background Modeling */}
        <Card className="bg-white dark:bg-white/5 border border-slate-200/80 dark:border-white/10 backdrop-blur-md rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] dark:shadow-none p-6 space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-200/70 dark:border-white/5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-800 dark:text-white">Adaptive Background Subtraction</h3>
              <p className="text-xs text-slate-500 dark:text-muted-foreground">Multi-color space dynamic lighting compensation</p>
            </div>
          </div>

          <div className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">
                Primary Color Space Consensus
              </label>
              <select
                value={colorSpace}
                onChange={(e) => setColorSpace(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/15 text-slate-800 dark:text-foreground text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              >
                {COLOR_SPACES.map((cs) => (
                  <option key={cs}>{cs}</option>
                ))}
              </select>
              <p className="text-[11px] text-slate-500 dark:text-muted-foreground">
                Prevents shadow artifacts and sudden daylight shifting from triggering false positive motion alerts.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
