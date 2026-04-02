"use client";

import DownloadIcon from "@/components/atoms/icons/DownloadIcon";
import { Heading5 } from "@/components/atoms/Typography";
import { useVisitorLocations } from "@/services/analyticsService";
import { useState } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
} from "react-simple-maps";

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

/**
 * Maps Google Analytics country names → ISO 3166-1 numeric codes
 * (used by world-atlas TopoJSON `id` field).
 */
const COUNTRY_CODE_MAP: Record<string, string> = {
  Afghanistan: "004",
  Albania: "008",
  Algeria: "012",
  Argentina: "032",
  Australia: "036",
  Austria: "040",
  Bangladesh: "050",
  Belgium: "056",
  Brazil: "076",
  Canada: "124",
  Chile: "152",
  China: "156",
  Colombia: "170",
  Croatia: "191",
  "Czech Republic": "203",
  Denmark: "208",
  Egypt: "818",
  Finland: "246",
  France: "250",
  Germany: "276",
  Ghana: "288",
  Greece: "300",
  "Hong Kong": "344",
  Hungary: "348",
  India: "356",
  Indonesia: "360",
  Iran: "364",
  Iraq: "368",
  Ireland: "372",
  Israel: "376",
  Italy: "380",
  Japan: "392",
  Jordan: "400",
  Kenya: "404",
  "South Korea": "410",
  Kuwait: "414",
  Lebanon: "422",
  Libya: "434",
  Malaysia: "458",
  Mexico: "484",
  Morocco: "504",
  Myanmar: "104",
  Netherlands: "528",
  "New Zealand": "554",
  Nigeria: "566",
  Norway: "578",
  Pakistan: "586",
  Peru: "604",
  Philippines: "608",
  Poland: "616",
  Portugal: "620",
  Qatar: "634",
  Romania: "642",
  Russia: "643",
  "Saudi Arabia": "682",
  Singapore: "702",
  "South Africa": "710",
  Spain: "724",
  Sweden: "752",
  Switzerland: "756",
  Taiwan: "158",
  Thailand: "764",
  Turkey: "792",
  Ukraine: "804",
  "United Arab Emirates": "784",
  "United Kingdom": "826",
  "United States": "840",
  Vietnam: "704",
};

// Map skeleton
const MapSkeleton = () => (
  <div className="w-full h-full flex flex-col gap-3 animate-pulse">
    <div className="flex justify-between">
      <div className="h-5 w-36 bg-grey/20 rounded" />
      <div className="h-8 w-8 bg-grey/20 rounded-lg" />
    </div>
    <div className="flex-1 bg-grey/10 rounded-lg" />
  </div>
);

export const VisitorLocation = () => {
  const { data: locationData, isLoading } = useVisitorLocations();

  const [tooltipContent, setTooltipContent] = useState<{
    country: string;
    visitors: number;
  } | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  if (isLoading) return <MapSkeleton />;

  // Build a lookup: numericCode → { visitors }
  const countryMap = new Map<string, number>(
    (locationData ?? []).map((d) => [
      COUNTRY_CODE_MAP[d.country] ?? "",
      d.visitors,
    ])
  );

  // Max visitors for relative colour intensity
  const maxVisitors = Math.max(...(locationData ?? []).map((d) => d.visitors), 1);

  const getCountryColor = (numericId: string) => {
    const visitors = countryMap.get(numericId);
    if (!visitors) return "#E5E7EB";
    const intensity = visitors / maxVisitors;
    // moss-stone palette: lighter → darker green
    if (intensity > 0.7) return "#225442";
    if (intensity > 0.4) return "#A0AC67";
    return "#CAD4BA";
  };

  return (
    <>
      <div className="w-full flex justify-between">
        <Heading5>Visitors Location</Heading5>
        <div className="flex">
          <button className="rounded-lg border border-grey-stroke p-2">
            <DownloadIcon />
          </button>
        </div>
      </div>

      <div className="relative w-full flex-1">
        <ComposableMap
          width={600}
          height={300}
          projectionConfig={{ scale: 136 }}
          className="w-full h-full py-0 cursor-grab active:cursor-grabbing"
        >
          <ZoomableGroup
            center={[0, 0]}
            zoom={1}
            minZoom={0.8}
            maxZoom={4}
            translateExtent={[
              [-30, -30],
              [630, 330],
            ]}
          >
            <Geographies geography={geoUrl}>
              {({ geographies }: any) =>
                geographies.map((geo: any) => {
                  const numericId = geo.id;
                  const hasData = countryMap.has(numericId);
                  const visitors = countryMap.get(numericId) ?? 0;
                  const countryName =
                    Object.entries(COUNTRY_CODE_MAP).find(
                      ([, code]) => code === numericId
                    )?.[0] ?? geo.properties?.name ?? "";

                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill={getCountryColor(numericId)}
                      stroke="#FFFFFF"
                      strokeWidth={0.5}
                      style={{
                        default: { outline: "none" },
                        hover: {
                          fill: hasData ? "#a0ac67" : "#D1D5DB",
                          outline: "none",
                          cursor: hasData ? "pointer" : "default",
                        },
                        pressed: { outline: "none" },
                      }}
                      onMouseEnter={(evt: any) => {
                        if (hasData) {
                          setTooltipContent({ country: countryName, visitors });
                          setTooltipPosition({ x: evt.clientX, y: evt.clientY });
                        }
                      }}
                      onMouseMove={(evt: any) => {
                        if (hasData) {
                          setTooltipPosition({ x: evt.clientX, y: evt.clientY });
                        }
                      }}
                      onMouseLeave={() => setTooltipContent(null)}
                    />
                  );
                })
              }
            </Geographies>
          </ZoomableGroup>
        </ComposableMap>

        {tooltipContent && (
          <div
            className="fixed bg-white rounded-lg shadow-xl border border-gray-200 p-3 pointer-events-none z-50"
            style={{
              left: `${tooltipPosition.x}px`,
              top: `${tooltipPosition.y}px`,
              transform: "translate(-50%, -120%)",
            }}
          >
            <p className="text-xs text-grey mb-1 whitespace-nowrap">
              {tooltipContent.country}
            </p>
            <p className="text-xs font-medium whitespace-nowrap">
              <span className="text-moss-stone">
                {tooltipContent.visitors.toLocaleString()}
              </span>{" "}
              <span className="text-neutral-02">Visitors</span>
            </p>
          </div>
        )}
      </div>

      {/* Top countries legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-auto">
        {(locationData ?? []).slice(0, 5).map((d, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <div
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: getCountryColor(COUNTRY_CODE_MAP[d.country] ?? "") }}
            />
            <span className="text-[10px] text-neutral-02">
              {d.country}: {d.visitors.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    </>
  );
};
