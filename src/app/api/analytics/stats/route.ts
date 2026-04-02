import { NextResponse } from "next/server";
import { fetchVisitorStats } from "@/libs/analytics/googleAnalytics";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await fetchVisitorStats();
    console.log("[GA] /api/analytics/stats data:", data);
    return NextResponse.json(data);
  } catch (error) {
    console.error("[GA] /api/analytics/stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics stats" },
      { status: 500 }
    );
  }
}
