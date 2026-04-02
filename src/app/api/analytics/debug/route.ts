import { BetaAnalyticsDataClient } from "@google-analytics/data";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Diagnostic endpoint — visit /api/analytics/debug to verify the full
 * GA4 integration status: credentials, property access, and data availability.
 *
 * REMOVE or protect this endpoint before going to production.
 */
export async function GET() {
  const propertyId = process.env.GA_PROPERTY_ID;
  const clientEmail = process.env.GA_CLIENT_EMAIL;
  const hasPrivateKey = !!process.env.GA_PRIVATE_KEY;

  const envCheck = {
    GA_PROPERTY_ID: propertyId ? `✅ Set (${propertyId})` : "❌ Missing",
    GA_CLIENT_EMAIL: clientEmail ? `✅ Set (${clientEmail})` : "❌ Missing",
    GA_PRIVATE_KEY: hasPrivateKey ? "✅ Set" : "❌ Missing",
  };

  if (!propertyId || !clientEmail || !hasPrivateKey) {
    return NextResponse.json({
      status: "❌ MISSING ENV VARS",
      envCheck,
      action:
        "Fill GA_PROPERTY_ID, GA_CLIENT_EMAIL and GA_PRIVATE_KEY in .env",
    });
  }

  try {
    const client = new BetaAnalyticsDataClient({
      credentials: {
        client_email: clientEmail,
        private_key: process.env.GA_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      },
    });

    // 1. Check property metadata (confirms auth + property access)
    const [metadata] = await client.getMetadata({
      name: `properties/${propertyId}/metadata`,
    });

    // 2. Run a broad 90-day report to see if ANY data exists at all
    const [broadReport] = await client.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate: "90daysAgo", endDate: "today" }],
      metrics: [{ name: "sessions" }, { name: "activeUsers" }],
    });

    // 3. Run a realtime report to see current active users
    const [realtimeReport] = await client.runRealtimeReport({
      property: `properties/${propertyId}`,
      metrics: [{ name: "activeUsers" }],
    });

    const totalSessions = parseInt(
      broadReport.rows?.[0]?.metricValues?.[0]?.value ?? "0",
      10
    );
    const totalUsers = parseInt(
      broadReport.rows?.[0]?.metricValues?.[1]?.value ?? "0",
      10
    );
    const activeNow = parseInt(
      realtimeReport.rows?.[0]?.metricValues?.[0]?.value ?? "0",
      10
    );

    const dataStatus =
      totalSessions === 0
        ? "⚠️  NO DATA — GA4 tracking tag is likely NOT installed on the frontpage"
        : `✅ Data found — ${totalSessions} sessions / ${totalUsers} users in the last 90 days`;

    return NextResponse.json({
      status: "✅ GA4 API Connection OK",
      envCheck,
      propertyMetadata: {
        dimensionCount: metadata.dimensions?.length ?? 0,
        metricCount: metadata.metrics?.length ?? 0,
      },
      dataCheck: {
        status: dataStatus,
        last90Days: { sessions: totalSessions, activeUsers: totalUsers },
        activeUsersRightNow: activeNow,
        rawRowCount: broadReport.rows?.length ?? 0,
      },
      nextSteps:
        totalSessions === 0
          ? [
              "1. Install the GA4 tracking tag (G-XXXXXXXXXX) on bumi-resource-frontpage",
              "2. Add it to src/app/layout.tsx using next/script or @next/third-parties/google",
              "3. Visit the frontpage, then re-check this endpoint — activeUsersRightNow should become > 0",
              "4. Historical data will populate within 24-48 hours of tag installation",
            ]
          : ["Integration is working correctly ✅"],
    });
  } catch (err: any) {
    return NextResponse.json({
      status: "❌ GA4 API ERROR",
      envCheck,
      error: {
        message: err.message,
        code: err.code,
        details: err.details,
      },
      commonFixes: {
        "code 7 PERMISSION_DENIED":
          "Service account not added to GA4 property. Go to GA4 → Admin → Property Access Management → Add user with Viewer role.",
        "code 5 NOT_FOUND":
          "GA_PROPERTY_ID is wrong. Check GA4 → Admin → Property Settings → Property ID (numbers only, no 'properties/' prefix).",
        "DECODER routines::unsupported":
          "GA_PRIVATE_KEY format is wrong. Make sure \\n is used for newlines and the key includes -----BEGIN/END PRIVATE KEY----- headers.",
      },
    });
  }
}
