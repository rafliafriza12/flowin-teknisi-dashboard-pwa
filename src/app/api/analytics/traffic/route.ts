import { NextRequest, NextResponse } from "next/server";
import { fetchMonthlyTraffic } from "@/libs/analytics/googleAnalytics";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const months = parseInt(searchParams.get("months") ?? "7", 10);
    const data = await fetchMonthlyTraffic(months);
    console
    return NextResponse.json(data);
  } catch (error) {
    console.error("[GA] /api/analytics/traffic error:", error);
    return NextResponse.json(
      { error: "Failed to fetch traffic data" },
      { status: 500 }
    );
  }
}
