import { NextResponse } from "next/server";
import { fetchBrowserUsage } from "@/libs/analytics/googleAnalytics";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await fetchBrowserUsage();
    console.log("[GA] /api/analytics/browsers data:", data);
    return NextResponse.json(data);
  } catch (error) {
    console.error("[GA] /api/analytics/browsers error:", error);
    return NextResponse.json(
      { error: "Failed to fetch browser usage data" },
      { status: 500 }
    );
  }
}
