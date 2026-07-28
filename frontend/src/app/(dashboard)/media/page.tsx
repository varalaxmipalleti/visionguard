"use client";

import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  UploadCloud,
  FileImage,
  FileVideo,
  ScanSearch,
  AlertTriangle,
  RefreshCw,
  Eye,
  Crosshair,
  ShieldCheck
} from "lucide-react";

interface DetectionItem {
  id?: number | null;
  class_name: string;
  class_id: number;
  confidence: number;
  bbox: [number, number, number, number];
}

interface AnalysisResult {
  status: string;
  type: "image" | "video";
  filename: string;
  annotated_url?: string;
  stream_url?: string;
  detection_count?: number;
  class_breakdown?: Record<string, number>;
  average_confidence?: number;
  detections?: DetectionItem[];
  message?: string;
}

export default function MediaAnalysisPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    setError(null);
    setResult(null);
    uploadAndAnalyze(selectedFile);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const uploadAndAnalyze = async (fileToProcess: File) => {
    setLoading(true);
    setError(null);
    const formData = new FormData();
    formData.append("file", fileToProcess);

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
      const response = await fetch(`${baseUrl}/media/inspect`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || "Failed to analyze media file.");
      }

      const data: AnalysisResult = await response.json();
      setResult(data);
    } catch (err: unknown) {
      setError((err as Error).message || "Network error. Is your local Python backend running on port 8000?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-full flex flex-col space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto pb-12">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-1.5 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white shadow-lg shadow-blue-500/20">
              <ScanSearch className="w-5 h-5 animate-pulse" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-white">
              AI Forensic Media Analysis
            </h1>
          </div>
          <p className="text-slate-500 dark:text-muted-foreground mt-2 text-sm max-w-3xl leading-relaxed">
            Upload custom surveillance photographs or video recordings to perform instant deep forensic object recognition using our neural <span className="font-semibold text-slate-700 dark:text-white">YOLOv11</span> engine with real-time multi-space adaptive background modeling.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-transparent backdrop-blur-md px-3 py-1.5 text-xs font-medium uppercase tracking-wider flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
            Neural Engine Active
          </Badge>
        </div>
      </div>

      {/* Main Content Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Left Interactive Drop Zone / Controller (4 Cols) */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="bg-white dark:bg-zinc-950/70 border border-slate-200/80 dark:border-white/10 backdrop-blur-2xl overflow-hidden rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] dark:shadow-none transition-all duration-300 hover:border-blue-500/30">

            <CardHeader className="pb-4 border-b border-slate-200/70 dark:border-white/5">
              <CardTitle className="text-base font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                Upload Target File
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 dark:text-muted-foreground">
                Supports images (.jpg, .png, .jfif, .webp) and videos (.mp4, .avi, .mov, .mkv)
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-6">
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 flex flex-col items-center justify-center relative overflow-hidden ${loading
                    ? "border-blue-600 bg-blue-500/5 animate-pulse cursor-wait"
                    : "border-slate-300 dark:border-white/15 hover:border-blue-500 hover:bg-slate-50 dark:hover:border-white/30 dark:hover:bg-white/5"
                  }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                  accept=".jpg,.jpeg,.png,.bmp,.webp,.jfif,.tiff,.tif,.mp4,.avi,.mov,.mkv,.webm,.m4v,.3gp"
                  className="hidden"
                />

                {loading ? (
                  <div className="space-y-4 py-4">
                    <RefreshCw className="w-12 h-12 text-blue-600 dark:text-primary mx-auto animate-spin" />
                    <div>
                      <p className="text-sm font-semibold text-slate-800 dark:text-white">Running Neural Inference...</p>
                      <p className="text-xs text-slate-500 dark:text-muted-foreground mt-1">Processing frames & trajectories</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 py-2">
                    <div className="w-16 h-16 rounded-full bg-slate-100/80 dark:bg-white/5 flex items-center justify-center mx-auto border border-slate-200/80 dark:border-white/10 shadow-inner hover:scale-105 transition-all duration-300">
                      <UploadCloud className="w-8 h-8 text-slate-500 dark:text-muted-foreground hover:text-blue-600 dark:hover:text-foreground transition-colors" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800 dark:text-white">Drag & drop your file here</p>
                      <p className="text-xs text-slate-500 dark:text-muted-foreground mt-1">or click to browse from computer</p>
                    </div>
                    <div className="flex items-center justify-center gap-2 pt-2 text-xs text-slate-500 dark:text-muted-foreground">
                      <span className="bg-slate-100 dark:bg-white/5 px-2.5 py-1 rounded-md border border-slate-200/70 dark:border-white/10 flex items-center gap-1"><FileImage className="w-3.5 h-3.5 text-blue-500" /> Images</span>
                      <span className="bg-slate-100 dark:bg-white/5 px-2.5 py-1 rounded-md border border-slate-200/70 dark:border-white/10 flex items-center gap-1"><FileVideo className="w-3.5 h-3.5 text-indigo-500" /> Videos</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Selected File Badge */}
              {file && !loading && (
                <div className="mt-4 p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/70 dark:border-white/10 flex items-center justify-between text-xs text-slate-800 dark:text-foreground font-medium">
                  <span className="truncate max-w-[200px] font-mono">{file.name}</span>
                  <span className="text-slate-500 dark:text-muted-foreground">{(file.size / (1024 * 1024)).toFixed(2)} MB</span>
                </div>
              )}

              {/* Error Alert */}
              {error && (
                <div className="mt-4 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs flex items-start gap-2.5 animate-in slide-in-from-bottom-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
                  <div>
                    <p className="font-semibold text-slate-800 dark:text-white">Inspection Failed</p>
                    <p className="opacity-90 mt-0.5">{error}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Statistical Breakdown Card (Only visible when image results exist) */}
          {result && result.type === "image" && (
            <Card className="bg-white dark:bg-zinc-950/70 border border-slate-200/80 dark:border-white/10 backdrop-blur-2xl rounded-2xl overflow-hidden shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] dark:shadow-none animate-in fade-in slide-in-from-bottom-4 duration-500">
              <CardHeader className="pb-3 border-b border-slate-200/70 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02]">
                <CardTitle className="text-base font-semibold text-slate-800 dark:text-white flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Crosshair className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    Detection Stats
                  </span>
                  <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-transparent text-xs font-medium">
                    {result.detection_count} Objects
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                {/* Confidence Meter */}
                <div>
                  <div className="flex justify-between text-xs text-slate-500 dark:text-muted-foreground mb-1.5 font-medium">
                    <span>Mean AI Confidence</span>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{((result.average_confidence || 0) * 100).toFixed(0)}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-white/5 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full transition-all duration-1000"
                      style={{ width: `${(result.average_confidence || 0) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Class Breakdown Pills */}
                <div className="pt-2">
                  <p className="text-xs font-semibold text-slate-500 dark:text-muted-foreground mb-2.5 uppercase tracking-wider">Identified Classes</p>
                  <div className="flex flex-wrap gap-2">
                    {result.class_breakdown && Object.entries(result.class_breakdown).map(([cls, count]) => (
                      <div key={cls} className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/70 dark:border-white/10 text-xs">
                        <span className="font-semibold text-slate-800 dark:text-foreground capitalize">{cls}</span>
                        <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-500/20 text-blue-600 dark:text-blue-300 font-mono font-bold">{count}</span>
                      </div>
                    ))}
                    {(!result.class_breakdown || Object.keys(result.class_breakdown).length === 0) && (
                      <p className="text-xs text-slate-500 dark:text-muted-foreground italic">No targeted security objects identified.</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Stage / Viewport (8 Cols) */}
        <div className="lg:col-span-8 w-full">
          <Card className="bg-white dark:bg-white/5 border border-slate-200/80 dark:border-white/10 backdrop-blur-md p-2.5 rounded-2xl overflow-hidden shadow-[0_4px_25px_-4px_rgba(0,0,0,0.06)] dark:shadow-none w-full">
            <div className="w-full bg-slate-950 dark:bg-black/90 text-white rounded-xl overflow-hidden flex flex-col items-center justify-center relative min-h-[440px] md:min-h-[480px] border border-slate-800/80 dark:border-white/10 shadow-inner">

              {/* Standby Idle State matching exact Live Cameras style */}
              {!result && !loading && (
                <div className="text-center max-w-md p-8 relative z-10">
                  <div className="w-16 h-16 rounded-full bg-slate-900 dark:bg-white/5 border border-slate-800 dark:border-white/10 flex items-center justify-center mx-auto mb-4 shadow-inner">
                    <ScanSearch className="w-8 h-8 text-slate-400 dark:text-muted-foreground opacity-80" />
                  </div>
                  <h3 className="text-base font-semibold text-white">Inspection Monitor Offline</h3>
                  <p className="text-sm text-slate-400 dark:text-muted-foreground mt-2 leading-relaxed">
                    Upload an image or video recording on the left to activate real-time artificial intelligence forensic object tracking and analysis.
                  </p>
                </div>
              )}

              {/* Clean loading spinner */}
              {loading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/95 dark:bg-black/95 z-20 space-y-4">
                  <div className="w-12 h-12 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
                  <p className="text-sm font-medium text-muted-foreground">
                    Processing through VisionGuard AI Engine...
                  </p>
                </div>
              )}

              {/* Render Analyzed Image */}
              {!loading && result && result.type === "image" && result.annotated_url && (
                <div className="w-full flex-1 flex items-center justify-center p-2 relative bg-black">
                  <img
                    src={result.annotated_url}
                    alt="AI Annotated Output"
                    className="w-auto h-auto max-h-[520px] max-w-full object-contain block mx-auto transition-opacity duration-300"
                  />
                  <div className="absolute bottom-3.5 right-3.5 z-10 flex items-center gap-2 bg-black/80 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-lg text-xs font-medium text-white shadow-lg pointer-events-none">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>Forensic Image Analysis</span>
                    <span className="text-emerald-400 font-mono pl-1 border-l border-white/20">{result.detection_count} Objects</span>
                  </div>
                </div>
              )}

              {/* Render Analyzed Live Video Stream */}
              {!loading && result && result.type === "video" && result.stream_url && (
                <div className="w-full flex-1 flex items-center justify-center relative bg-black">
                  <img
                    src={result.stream_url}
                    alt="AI Annotated Video Stream"
                    className="w-auto h-auto max-h-[520px] max-w-full object-contain block mx-auto transition-opacity duration-300"
                  />
                  <div className="absolute bottom-3.5 right-3.5 z-10 flex items-center gap-2 bg-black/80 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-lg text-xs font-medium text-white shadow-lg pointer-events-none">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <span>Video Tracking Stream</span>
                    <span className="text-emerald-400 font-mono pl-1 border-l border-white/20">30.0 FPS</span>
                  </div>
                </div>
              )}

            </div>
          </Card>
        </div>

      </div>
    </div>
  );
}
