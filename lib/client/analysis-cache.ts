import type { Analysis } from "@/lib/types/analysis";

export function analysisCacheKey(id: string) {
  return `optibuild:analysis:${id}`;
}

export function cacheAnalysis(analysis: Analysis) {
  try {
    sessionStorage.setItem(analysisCacheKey(analysis.id), JSON.stringify(analysis));
    sessionStorage.setItem("optibuild:latest", analysis.id);
  } catch {
    /* quota / private mode */
  }
}

export function readCachedAnalysis(id: string): Analysis | null {
  try {
    const raw = sessionStorage.getItem(analysisCacheKey(id));
    return raw ? (JSON.parse(raw) as Analysis) : null;
  } catch {
    return null;
  }
}
