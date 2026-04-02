import { useQuery } from "@tanstack/react-query";

// ==================== TYPES ====================

export interface AnalyticsStats {
  visitorsToday: number;
  visitorsTodayChange: number;
  visitorsThisMonth: number;
  visitorsThisMonthChange: number;
}

export interface MonthlyTrafficPoint {
  month: string;
  visitors: number;
}

export interface VisitorCountryData {
  country: string;
  visitors: number;
}

export interface BrowserUsageData {
  browser: string;
  sessions: number;
  percentage: number;
}

// ==================== FETCHERS ====================

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Analytics API error: ${res.statusText}`);
  return res.json();
}

// ==================== QUERY KEYS ====================

export const analyticsKeys = {
  all: ["analytics"] as const,
  stats: () => [...analyticsKeys.all, "stats"] as const,
  traffic: (months: number) =>
    [...analyticsKeys.all, "traffic", months] as const,
  locations: () => [...analyticsKeys.all, "locations"] as const,
  browsers: () => [...analyticsKeys.all, "browsers"] as const,
};

// ==================== HOOKS ====================

/**
 * Fetches key visitor stats (today, this month, with % changes).
 * Refreshes every 5 minutes.
 */
export function useAnalyticsStats() {
  return useQuery<AnalyticsStats>({
    queryKey: analyticsKeys.stats(),
    queryFn: () => fetchJson<AnalyticsStats>("/api/analytics/stats"),
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
    retry: 2,
  });
}

/**
 * Fetches monthly traffic data for the area chart.
 * @param months - number of past months to include (default 7)
 */
export function useMonthlyTraffic(months: number = 7) {
  return useQuery<MonthlyTrafficPoint[]>({
    queryKey: analyticsKeys.traffic(months),
    queryFn: () =>
      fetchJson<MonthlyTrafficPoint[]>(
        `/api/analytics/traffic?months=${months}`
      ),
    staleTime: 10 * 60 * 1000,
    retry: 2,
  });
}

/**
 * Fetches top visitor countries for the map.
 */
export function useVisitorLocations() {
  return useQuery<VisitorCountryData[]>({
    queryKey: analyticsKeys.locations(),
    queryFn: () => fetchJson<VisitorCountryData[]>("/api/analytics/locations"),
    staleTime: 10 * 60 * 1000,
    retry: 2,
  });
}

/**
 * Fetches browser usage distribution.
 */
export function useBrowserUsage() {
  return useQuery<BrowserUsageData[]>({
    queryKey: analyticsKeys.browsers(),
    queryFn: () => fetchJson<BrowserUsageData[]>("/api/analytics/browsers"),
    staleTime: 10 * 60 * 1000,
    retry: 2,
  });
}
