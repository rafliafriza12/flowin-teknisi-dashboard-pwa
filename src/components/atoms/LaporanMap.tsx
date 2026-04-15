"use client";

import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import type { IKoordinatLaporan } from "@/types/workOrder";

interface LaporanMapProps {
  koordinat: IKoordinatLaporan;
  alamat: string;
}

/**
 * Peta Leaflet yang menampilkan lokasi laporan dan rute terdekat dari posisi pengguna.
 * Di-load secara dinamis karena Leaflet tidak kompatibel dengan SSR.
 */
export default function LaporanMap({ koordinat, alamat }: LaporanMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(
    null,
  );
  const [locError, setLocError] = useState<string | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const routeLayerRef = useRef<any>(null);

  const targetLat = koordinat.latitude;
  const targetLng = koordinat.longitude;

  // ─── Inisialisasi peta ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    let isMounted = true;

    const init = async () => {
      const L = (await import("leaflet")).default;

      // Fix missing default marker icons in Next.js/Webpack
      // @ts-ignore
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      if (!isMounted || !mapRef.current) return;

      const map = L.map(mapRef.current, { zoomControl: true }).setView(
        [targetLat, targetLng],
        15,
      );

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      // Marker lokasi laporan (merah)
      const targetIcon = L.divIcon({
        className: "",
        html: `<div style="
          background:#ef4444;
          width:14px;height:14px;
          border-radius:50%;
          border:3px solid white;
          box-shadow:0 1px 4px rgba(0,0,0,0.4);
        "></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      });

      L.marker([targetLat, targetLng], { icon: targetIcon })
        .addTo(map)
        .bindPopup(
          `<div style="font-size:12px;max-width:180px">
            <strong>Lokasi Laporan</strong><br/>
            ${alamat}
          </div>`,
        )
        .openPopup();

      mapInstanceRef.current = map;
    };

    init();
    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Tambah/perbarui marker user & rute saat userPos berubah ───────────────
  useEffect(() => {
    if (!userPos || !mapInstanceRef.current) return;

    const drawRoute = async () => {
      const L = (await import("leaflet")).default;
      const map = mapInstanceRef.current;

      // Marker posisi user (biru)
      const userIcon = L.divIcon({
        className: "",
        html: `<div style="
          background:#3b82f6;
          width:14px;height:14px;
          border-radius:50%;
          border:3px solid white;
          box-shadow:0 1px 4px rgba(0,0,0,0.4);
        "></div>`,
        iconSize: [14, 14],
        iconAnchor: [7, 7],
      });

      L.marker([userPos.lat, userPos.lng], { icon: userIcon })
        .addTo(map)
        .bindPopup('<div style="font-size:12px">📍 Lokasi Anda</div>');

      // Hapus rute lama jika ada
      if (routeLayerRef.current) {
        map.removeLayer(routeLayerRef.current);
        routeLayerRef.current = null;
      }

      setRouteLoading(true);

      try {
        // OSRM public routing API
        const res = await fetch(
          `https://router.project-osrm.org/route/v1/driving/` +
            `${userPos.lng},${userPos.lat};${targetLng},${targetLat}` +
            `?overview=full&geometries=geojson`,
        );
        const json = await res.json();

        if (json.code === "Ok" && json.routes?.[0]) {
          const geojson = json.routes[0].geometry;
          const layer = L.geoJSON(geojson, {
            style: {
              color: "#3b82f6",
              weight: 4,
              opacity: 0.8,
            },
          }).addTo(map);

          routeLayerRef.current = layer;

          // Fit bounds agar semua kelihatan
          const bounds = L.latLngBounds(
            [userPos.lat, userPos.lng],
            [targetLat, targetLng],
          );
          map.fitBounds(bounds, { padding: [48, 48] });

          const distM = json.routes[0].distance as number;
          const distKm = (distM / 1000).toFixed(1);
          const durMin = Math.round((json.routes[0].duration as number) / 60);

          // Info popup di tengah rute
          L.popup()
            .setLatLng([
              (userPos.lat + targetLat) / 2,
              (userPos.lng + targetLng) / 2,
            ])
            .setContent(
              `<div style="font-size:12px;text-align:center">
                🚗 <strong>${distKm} km</strong> · ${durMin} menit
              </div>`,
            )
            .openOn(map);
        }
      } catch {
        // Fallback: garis lurus jika OSRM gagal
        const L2 = (await import("leaflet")).default;
        const line = L2.polyline(
          [
            [userPos.lat, userPos.lng],
            [targetLat, targetLng],
          ],
          { color: "#3b82f6", weight: 3, dashArray: "6,6" },
        ).addTo(map);
        routeLayerRef.current = line;
        map.fitBounds(line.getBounds(), { padding: [48, 48] });
      } finally {
        setRouteLoading(false);
      }
    };

    drawRoute();
  }, [userPos, targetLat, targetLng]);

  // ─── Ambil lokasi user ──────────────────────────────────────────────────────
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setLocError("Browser tidak mendukung geolocation");
      return;
    }
    setLocError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => {
        setLocError("Izin lokasi ditolak atau tidak tersedia");
      },
    );
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Map container */}
      <div
        ref={mapRef}
        className="w-full rounded-xl overflow-hidden border border-grey-stroke"
        style={{ height: 280, zIndex: 0 }}
      />

      {/* Tombol rute */}
      <button
        onClick={handleGetLocation}
        disabled={routeLoading}
        className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg
          bg-blue-50 border border-blue-200 text-blue-700 text-xs font-medium
          hover:bg-blue-100 active:bg-blue-200 transition-colors
          disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {routeLoading ? (
          <>
            <span className="w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            Menghitung rute...
          </>
        ) : userPos ? (
          <>🔄 Perbarui Rute dari Lokasi Saya</>
        ) : (
          <>📍 Tampilkan Rute dari Lokasi Saya</>
        )}
      </button>

      {locError && (
        <p className="text-xs text-red-500 text-center">{locError}</p>
      )}
    </div>
  );
}
