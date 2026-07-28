import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getApiBaseUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!envUrl) return "http://127.0.0.1:8000/api/v1";
  const clean = envUrl.replace(/\/$/, "");
  return clean.endsWith("/api/v1") ? clean : `${clean}/api/v1`;
}
