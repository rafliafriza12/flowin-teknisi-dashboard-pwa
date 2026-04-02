import { NextResponse } from "next/server";
import { fetchVisitorLocations } from "@/libs/analytics/googleAnalytics";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await fetchVisitorLocations(10);
    console.log("[GA] /api/analytics/locations data:", data);
    return NextResponse.json(data);
  } catch (error) {
    console.error("[GA] /api/analytics/locations error:", error);
    return NextResponse.json(
      { error: "Failed to fetch visitor locations" },
      { status: 500 }
    );
  }
}
