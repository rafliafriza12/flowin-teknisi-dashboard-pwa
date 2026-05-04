"use client";

/**
 * MapRuteTeknisi — Leaflet map yang menampilkan:
 * 1. Posisi teknisi saat ini (via Geolocation API)
 * 2. Marker lokasi pekerjaan (koordinatLokasi dari WorkOrder)
 * 3. Rute dari teknisi ke lokasi pekerjaan (via OSRM public API)
 * 4. Estimasi jarak & waktu tempuh
 *
 * Komponen ini harus di-import menggunakan dynamic() dengan ssr: false
 * karena Leaflet tidak kompatibel dengan SSR.
 */

import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { IKoordinatLokasi } from "@/types/workOrder";

// Fix Leaflet default icon paths (broken di bundler)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface RouteInfo {
  distanceKm: number;
  durationMin: number;
}

interface MapRuteTeknisiProps {
  koordinatTujuan: IKoordinatLokasi;
}

const MapRuteTeknisi: React.FC<MapRuteTeknisiProps> = ({ koordinatTujuan }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const routeLayerRef = useRef<L.Polyline | null>(null);

  const [geoStatus, setGeoStatus] = useState<
    "loading" | "success" | "error" | "unsupported"
  >("loading");
  const [geoError, setGeoError] = useState<string | null>(null);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [teknisiPos, setTeknisiPos] = useState<L.LatLng | null>(null);

  const tujuanLatLng = L.latLng(
    koordinatTujuan.latitude,
    koordinatTujuan.longitude,
  );

  // Inisialisasi peta
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      zoomControl: true,
      attributionControl: true,
    }).setView(tujuanLatLng, 14);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    // Marker tujuan (merah)
    const tujuanIcon = L.divIcon({
      html: `<div style="
        width: 32px; height: 32px;
        background: #ef4444;
        border: 3px solid white;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      "></div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      className: "",
    });

    L.marker(tujuanLatLng, { icon: tujuanIcon })
      .addTo(map)
      .bindPopup(
        `<strong>Lokasi Pekerjaan</strong><br>
        Lat: ${koordinatTujuan.latitude.toFixed(6)}<br>
        Lng: ${koordinatTujuan.longitude.toFixed(6)}`,
      );

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Ambil posisi teknisi & gambar rute
  useEffect(() => {
    if (!mapRef.current) return;

    if (!navigator.geolocation) {
      setGeoStatus("unsupported");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const teknisiLatLng = L.latLng(
          position.coords.latitude,
          position.coords.longitude,
        );
        setTeknisiPos(teknisiLatLng);
        setGeoStatus("success");

        const map = mapRef.current!;

        // Marker teknisi (biru)
        const teknisiIcon = L.divIcon({
          html: `<div style="
            width: 28px; height: 28px;
            background: #3b82f6;
            border: 3px solid white;
            border-radius: 50%;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            display: flex; align-items: center; justify-content: center;
            font-size: 14px; color: white; font-weight: bold;
          ">T</div>`,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
          className: "",
        });

        L.marker(teknisiLatLng, { icon: teknisiIcon })
          .addTo(map)
          .bindPopup("<strong>Posisi Anda</strong>");

        // Fit bounds agar kedua marker terlihat
        const bounds = L.latLngBounds([teknisiLatLng, tujuanLatLng]);
        map.fitBounds(bounds, { padding: [40, 40] });

        // Ambil rute dari OSRM
        try {
          const url = `https://router.project-osrm.org/route/v1/driving/${teknisiLatLng.lng},${teknisiLatLng.lat};${tujuanLatLng.lng},${tujuanLatLng.lat}?overview=full&geometries=geojson`;
          const res = await fetch(url);
          if (!res.ok) throw new Error("OSRM gagal");
          const data = await res.json();
          const route = data.routes?.[0];
          if (!route) throw new Error("Rute tidak ditemukan");

          const coords: L.LatLng[] = route.geometry.coordinates.map(
            ([lng, lat]: [number, number]) => L.latLng(lat, lng),
          );

          // Hapus rute sebelumnya jika ada
          if (routeLayerRef.current) {
            map.removeLayer(routeLayerRef.current);
          }

          const polyline = L.polyline(coords, {
            color: "#3b82f6",
            weight: 4,
            opacity: 0.8,
          }).addTo(map);

          routeLayerRef.current = polyline;

          setRouteInfo({
            distanceKm: route.distance / 1000,
            durationMin: Math.round(route.duration / 60),
          });
        } catch {
          // Gagal ambil rute — gambar garis lurus sebagai fallback
          if (routeLayerRef.current) {
            mapRef.current?.removeLayer(routeLayerRef.current);
          }
          const line = L.polyline([teknisiLatLng, tujuanLatLng], {
            color: "#94a3b8",
            weight: 3,
            dashArray: "8, 8",
            opacity: 0.7,
          }).addTo(map);
          routeLayerRef.current = line;

          // Hitung jarak haversine sebagai fallback
          const distM = teknisiLatLng.distanceTo(tujuanLatLng);
          setRouteInfo({
            distanceKm: distM / 1000,
            durationMin: Math.round((distM / 1000 / 40) * 60), // asumsi 40 km/h
          });
        }
      },
      (err) => {
        setGeoStatus("error");
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setGeoError("Izin lokasi ditolak. Aktifkan GPS di browser Anda.");
            break;
          case err.POSITION_UNAVAILABLE:
            setGeoError("Informasi lokasi tidak tersedia.");
            break;
          case err.TIMEOUT:
            setGeoError("Permintaan lokasi timeout.");
            break;
          default:
            setGeoError("Gagal mendapatkan lokasi.");
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-2">
      {/* Info bar */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <span className="text-xs text-neutral-03">Posisi Anda</span>
          <div className="w-3 h-3 rounded-full bg-red-500 ml-2" />
          <span className="text-xs text-neutral-03">Lokasi Pekerjaan</span>
        </div>
        {geoStatus === "loading" && (
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-grey">Mencari lokasi Anda...</span>
          </div>
        )}
        {geoStatus === "error" && (
          <span className="text-xs text-red-500">{geoError}</span>
        )}
        {geoStatus === "unsupported" && (
          <span className="text-xs text-grey">GPS tidak didukung</span>
        )}
      </div>

      {/* Peta */}
      <div
        ref={mapContainerRef}
        className="w-full rounded-xl border border-grey-stroke overflow-hidden"
        style={{ height: "280px" }}
      />

      {/* Informasi rute */}
      {routeInfo && (
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col items-center p-2.5 rounded-lg bg-blue-50 border border-blue-100">
            <p className="text-[10px] text-blue-600 uppercase tracking-wide font-medium">
              Jarak
            </p>
            <p className="text-base font-bold text-blue-800 mt-0.5">
              {routeInfo.distanceKm < 1
                ? `${Math.round(routeInfo.distanceKm * 1000)} m`
                : `${routeInfo.distanceKm.toFixed(1)} km`}
            </p>
          </div>
          <div className="flex flex-col items-center p-2.5 rounded-lg bg-green-50 border border-green-100">
            <p className="text-[10px] text-green-600 uppercase tracking-wide font-medium">
              Est. Waktu
            </p>
            <p className="text-base font-bold text-green-800 mt-0.5">
              {routeInfo.durationMin < 60
                ? `${routeInfo.durationMin} mnt`
                : `${Math.floor(routeInfo.durationMin / 60)}j ${routeInfo.durationMin % 60}m`}
            </p>
          </div>
        </div>
      )}

      {/* Koordinat tujuan */}
      <p className="text-[10px] text-grey text-center">
        Tujuan: {koordinatTujuan.latitude.toFixed(6)},{" "}
        {koordinatTujuan.longitude.toFixed(6)}
        {teknisiPos &&
          ` · Anda: ${teknisiPos.lat.toFixed(6)}, ${teknisiPos.lng.toFixed(6)}`}
      </p>
    </div>
  );
};

export default MapRuteTeknisi;
