import { BetaAnalyticsDataClient } from "@google-analytics/data";

/**
 * Creates and returns a GA4 Data API client.
 * Uses service account credentials from environment variables.
 */
function getAnalyticsClient(): BetaAnalyticsDataClient {
  const credentials = {
    client_email: process.env.GA_CLIENT_EMAIL,
    private_key: process.env.GA_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  };

  return new BetaAnalyticsDataClient({ credentials });
}

const GA_PROPERTY_ID = process.env.GA_PROPERTY_ID!;

/**
 * Extracts the bare hostname from NEXT_PUBLIC_FRONTPAGE_URL.
 * e.g. "https://bumiresource.gutechdeveloper.site" → "bumiresource.gutechdeveloper.site"
 *
 * This is used as a dimensionFilter on every GA4 query so that data is always
 * scoped to exactly this one website — even if the GA4 property has multiple
 * data streams (multiple websites) attached to it.
 */
const FRONTPAGE_HOSTNAME = new URL(
  process.env.NEXT_PUBLIC_FRONTPAGE_URL ?? "https://localhost"
).hostname;

/**
 * Reusable hostname dimension filter.
 * Passes this to every runReport call to scope results to the frontpage only.
 */
const hostnameFilter = {
  filter: {
    fieldName: "hostName",
    stringFilter: {
      matchType: "EXACT" as const,
      value: FRONTPAGE_HOSTNAME,
    },
  },
};

// ==================== STATS ====================

export interface AnalyticsStats {
  visitorsToday: number;
  visitorsTodayChange: number;
  visitorsThisMonth: number;
  visitorsThisMonthChange: number;
}

/**
 * Fetches today's and this month's visitor counts with percentage changes.
 */
export async function fetchVisitorStats(): Promise<AnalyticsStats> {
  const client = getAnalyticsClient();

  const [todayRes, yesterdayRes, thisMonthRes, lastMonthRes] =
    await Promise.all([
      // Today's sessions
      client.runReport({
        property: `properties/${GA_PROPERTY_ID}`,
        dateRanges: [{ startDate: "today", endDate: "today" }],
        metrics: [{ name: "sessions" }],
        dimensionFilter: hostnameFilter,
      }),
      // Yesterday's sessions
      client.runReport({
        property: `properties/${GA_PROPERTY_ID}`,
        dateRanges: [{ startDate: "yesterday", endDate: "yesterday" }],
        metrics: [{ name: "sessions" }],
        dimensionFilter: hostnameFilter,
      }),
      // This month's sessions
      client.runReport({
        property: `properties/${GA_PROPERTY_ID}`,
        dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
        metrics: [{ name: "sessions" }],
        dimensionFilter: hostnameFilter,
      }),
      // Last month's sessions
      client.runReport({
        property: `properties/${GA_PROPERTY_ID}`,
        dateRanges: [{ startDate: "60daysAgo", endDate: "31daysAgo" }],
        metrics: [{ name: "sessions" }],
        dimensionFilter: hostnameFilter,
      }),
    ]);

  const getVal = (res: any) =>
    parseInt(res[0]?.rows?.[0]?.metricValues?.[0]?.value ?? "0", 10);

  const visitorsToday = getVal(todayRes);
  const visitorsYesterday = getVal(yesterdayRes);
  const visitorsThisMonth = getVal(thisMonthRes);
  const visitorsLastMonth = getVal(lastMonthRes);

  const calcChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return parseFloat(
      (((current - previous) / previous) * 100).toFixed(1)
    );
  };

  return {
    visitorsToday,
    visitorsTodayChange: calcChange(visitorsToday, visitorsYesterday),
    visitorsThisMonth,
    visitorsThisMonthChange: calcChange(visitorsThisMonth, visitorsLastMonth),
  };
}

// ==================== MONTHLY TRAFFIC ====================

export interface MonthlyTrafficPoint {
  month: string;
  visitors: number;
}

/**
 * Returns the first day of the month that is `monthsBack` months before today,
 * formatted as YYYY-MM-DD — which is the only date format GA4 Data API accepts
 * besides `NdaysAgo`, `yesterday`, and `today`.
 */
function firstDayOfMonthsAgo(monthsBack: number): string {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - monthsBack);
  return d.toISOString().split("T")[0];
}

/**
 * Fetches monthly visitor (session) counts for the last N months.
 */
export async function fetchMonthlyTraffic(
  months: number = 7
): Promise<MonthlyTrafficPoint[]> {
  const client = getAnalyticsClient();

  // GA4 Data API does NOT support NMonthsAgo — must use YYYY-MM-DD
  const startDate = firstDayOfMonthsAgo(months - 1);

  const [res] = await client.runReport({
    property: `properties/${GA_PROPERTY_ID}`,
    dateRanges: [{ startDate, endDate: "today" }],
    dimensions: [{ name: "yearMonth" }],
    metrics: [{ name: "sessions" }],
    orderBys: [{ dimension: { dimensionName: "yearMonth" }, desc: false }],
    dimensionFilter: hostnameFilter,
  });

  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  return (res.rows ?? []).map((row) => {
    const ym = row.dimensionValues?.[0]?.value ?? "";
    const year = ym.slice(0, 4);
    const monthIndex = parseInt(ym.slice(4, 6), 10) - 1;
    return {
      month: `${monthNames[monthIndex]} ${year}`,
      visitors: parseInt(row.metricValues?.[0]?.value ?? "0", 10),
    };
  });
}

// ==================== VISITOR LOCATIONS ====================

export interface VisitorCountryData {
  country: string;
  visitors: number;
}

/**
 * Fetches top countries by session count for the last 30 days.
 */
export async function fetchVisitorLocations(
  limit: number = 10
): Promise<VisitorCountryData[]> {
  const client = getAnalyticsClient();

  const [res] = await client.runReport({
    property: `properties/${GA_PROPERTY_ID}`,
    dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
    dimensions: [{ name: "country" }],
    metrics: [{ name: "sessions" }],
    orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
    dimensionFilter: hostnameFilter,
    limit,
  });

  return (res.rows ?? []).map((row) => ({
    country: row.dimensionValues?.[0]?.value ?? "",
    visitors: parseInt(row.metricValues?.[0]?.value ?? "0", 10),
  }));
}

// ==================== BROWSER USAGE ====================

export interface BrowserUsageData {
  browser: string;
  sessions: number;
  percentage: number;
}

/**
 * Fetches browser usage distribution for the last 30 days.
 */
export async function fetchBrowserUsage(): Promise<BrowserUsageData[]> {
  const client = getAnalyticsClient();

  const [res] = await client.runReport({
    property: `properties/${GA_PROPERTY_ID}`,
    dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
    dimensions: [{ name: "browser" }],
    metrics: [{ name: "sessions" }],
    orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
    dimensionFilter: hostnameFilter,
    limit: 10,
  });

  const rows = res.rows ?? [];
  const total = rows.reduce(
    (sum, row) => sum + parseInt(row.metricValues?.[0]?.value ?? "0", 10),
    0
  );

  // Group small browsers into "Others"
  const TOP_BROWSERS = ["Chrome", "Safari", "Edge", "Firefox", "Opera"];
  const grouped: Record<string, number> = {};

  for (const row of rows) {
    const browser = row.dimensionValues?.[0]?.value ?? "Unknown";
    const sessions = parseInt(row.metricValues?.[0]?.value ?? "0", 10);
    const key = TOP_BROWSERS.includes(browser) ? browser : "Others";
    grouped[key] = (grouped[key] ?? 0) + sessions;
  }

  return Object.entries(grouped)
    .sort((a, b) => b[1] - a[1])
    .map(([browser, sessions]) => ({
      browser,
      sessions,
      percentage:
        total > 0 ? parseFloat(((sessions / total) * 100).toFixed(1)) : 0,
    }));
}
