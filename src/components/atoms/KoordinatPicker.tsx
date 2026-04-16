"use client";

import "leaflet/dist/leaflet.css";
import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";

// Fix default marker icon Leaflet
// eslint-disable-next-line @typescript-eslint/no-require-imports
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface KoordinatPickerProps {
  value: { longitude: string; latitude: string };
  onChange: (coords: { longitude: string; latitude: string }) => void;
}

const KoordinatPicker: React.FC<KoordinatPickerProps> = ({
  value,
  onChange,
}) => {
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [locating, setLocating] = useState(false);
  const [hint, setHint] = useState(
    value.latitude && value.longitude
      ? "Tekan peta untuk ubah lokasi"
      : "Tekan peta untuk pilih lokasi",
  );

  // Inisialisasi map sekali saja
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const initLat =
      value.latitude && !isNaN(parseFloat(value.latitude))
        ? parseFloat(value.latitude)
        : 5.5502;
    const initLng =
      value.longitude && !isNaN(parseFloat(value.longitude))
        ? parseFloat(value.longitude)
        : 95.3232;

    const map = L.map(containerRef.current, { zoomControl: true }).setView(
      [initLat, initLng],
      value.latitude ? 16 : 13,
    );

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(map);

    // Pasang marker awal jika sudah ada nilai
    if (
      value.latitude &&
      value.longitude &&
      !isNaN(parseFloat(value.latitude)) &&
      !isNaN(parseFloat(value.longitude))
    ) {
      const marker = L.marker([
        parseFloat(value.latitude),
        parseFloat(value.longitude),
      ])
        .addTo(map)
        .bindPopup("Lokasi dipilih")
        .openPopup();
      markerRef.current = marker;
    }

    // Klik peta → set koordinat
    map.on("click", (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;

      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
      } else {
        markerRef.current = L.marker([lat, lng])
          .addTo(map)
          .bindPopup("Lokasi dipilih")
          .openPopup();
      }

      markerRef.current.openPopup();
      onChange({
        latitude: lat.toFixed(7),
        longitude: lng.toFixed(7),
      });
      setHint("Tekan peta untuk ubah lokasi");
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Lokasi GPS pengguna
  const handleGPS = () => {
    if (!mapRef.current) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        const map = mapRef.current!;
        map.setView([lat, lng], 17);

        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
        } else {
          markerRef.current = L.marker([lat, lng])
            .addTo(map)
            .bindPopup("Lokasi Anda")
            .openPopup();
        }
        markerRef.current.openPopup();
        onChange({
          latitude: lat.toFixed(7),
          longitude: lng.toFixed(7),
        });
        setHint("Tekan peta untuk ubah lokasi");
        setLocating(false);
      },
      () => {
        setLocating(false);
        setHint("Gagal mendapatkan lokasi GPS. Tekan peta secara manual.");
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const hasValue = !!(value.latitude && value.longitude);

  return (
    <div className="flex flex-col gap-2">
      {/* Kontrol atas */}
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] text-grey">{hint}</p>
        <button
          type="button"
          onClick={handleGPS}
          disabled={locating}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-moss-stone text-white text-xs font-medium hover:bg-moss-stone/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
        >
          {locating ? (
            <>
              <span className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
              Mencari...
            </>
          ) : (
            <>Gunakan GPS</>
          )}
        </button>
      </div>

      {/* Peta */}
      <div
        ref={containerRef}
        className="w-full h-64 rounded-xl overflow-hidden border border-grey-stroke z-0"
      />

      {/* Nilai koordinat terpilih */}
      {hasValue ? (
        <div className="flex gap-3 text-xs text-grey bg-gray-50 border border-grey-stroke rounded-lg px-3 py-2">
          <span>
            <span className="font-medium text-neutral-03">Lat:</span>{" "}
            {value.latitude}
          </span>
          <span>
            <span className="font-medium text-neutral-03">Lng:</span>{" "}
            {value.longitude}
          </span>
          <button
            type="button"
            onClick={() => {
              onChange({ latitude: "", longitude: "" });
              if (markerRef.current && mapRef.current) {
                markerRef.current.remove();
                markerRef.current = null;
              }
              setHint("Tekan peta untuk pilih lokasi");
            }}
            className="ml-auto text-red-400 hover:text-red-600 text-[10px]"
          >
            ✕ Reset
          </button>
        </div>
      ) : (
        <p className="text-[11px] text-grey italic">
          Belum ada koordinat dipilih
        </p>
      )}
    </div>
  );
};

export default KoordinatPicker;
