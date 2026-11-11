import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { useMap, useMapEvents } from 'react-leaflet';
import { LAYER_INDEX, type InariskLayer } from '@/config/layers';
import { identifyPixel } from '@/services/inarisk';
import { useMapStore } from '@/store/useMapStore';
import { escapeHtml, formatDMS } from '@/utils/geo';
import { FEATURE_CLICK_FLAG } from './EventsFeatureLayer';
import { setMapInstance } from './mapInstance';

/**
 * - Melacak koordinat kursor & zoom untuk status bar.
 * - Klik peta → identify nilai indeks semua layer InaRISK aktif.
 */
export function MapEventsHandler() {
  const map = useMap();
  const setCursor = useMapStore((s) => s.setCursor);
  const setZoom = useMapStore((s) => s.setZoom);
  const abortRef = useRef<AbortController | null>(null);
  const sidebarOpen = useMapStore((s) => s.sidebarOpen);

  useEffect(() => {
    setMapInstance(map);
    setZoom(map.getZoom());
    const scale = L.control.scale({ position: 'bottomright', imperial: false, maxWidth: 140 }).addTo(map);
    return () => {
      scale.remove();
      setMapInstance(null);
    };
  }, [map, setZoom]);

  // Sesuaikan ukuran peta ketika sidebar dibuka/ditutup.
  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize({ pan: false }), 320);
    return () => clearTimeout(t);
  }, [map, sidebarOpen]);

  useMapEvents({
    mousemove: (e) => setCursor({ lat: e.latlng.lat, lng: e.latlng.lng }),
    mouseout: () => setCursor(null),
    zoomend: () => setZoom(map.getZoom()),
    click: async (e) => {
      if ((e.originalEvent as unknown as Record<string, boolean>)[FEATURE_CLICK_FLAG]) return;
      const { identifyEnabled, layers, date } = useMapStore.getState();
      if (!identifyEnabled) return;

      const inarisk = Object.entries(layers)
        .filter(([id, st]) => st.visible && LAYER_INDEX[id]?.source === 'inarisk')
        .map(([id]) => LAYER_INDEX[id] as InariskLayer);
      const gibsActive = Object.entries(layers)
        .filter(([id, st]) => st.visible && LAYER_INDEX[id]?.source === 'gibs')
        .map(([id]) => LAYER_INDEX[id].title);

      const { lat, lng } = e.latlng;
      const header = `
        <div class="id-head">
          <div class="id-title">Informasi Lokasi</div>
          <div class="id-coord">${lat.toFixed(5)}, ${lng.toFixed(5)}</div>
          <div class="id-coord-sub">${formatDMS(lat, true)} · ${formatDMS(lng, false)}</div>
        </div>`;
      const gibsHtml = gibsActive.length
        ? `<div class="id-section"><div class="id-section-title">Citra NASA GIBS · ${date}</div>${gibsActive
            .map((t) => `<div class="id-gibs">${escapeHtml(t)}</div>`)
            .join('')}</div>`
        : '';

      if (!inarisk.length) {
        L.popup({ maxWidth: 300, className: 'identify-popup' })
          .setLatLng(e.latlng)
          .setContent(
            header +
              gibsHtml +
              `<div class="id-hint">Aktifkan layer InaRISK untuk membaca nilai indeks bahaya/risiko di titik ini.</div>`,
          )
          .openOn(map);
        return;
      }

      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;

      const popup = L.popup({ maxWidth: 320, className: 'identify-popup' })
        .setLatLng(e.latlng)
        .setContent(header + `<div class="id-loading"><span class="spinner"></span>Membaca nilai indeks InaRISK…</div>`)
        .openOn(map);

      const results = await Promise.allSettled(inarisk.map((l) => identifyPixel(l, lat, lng, ac.signal)));
      if (ac.signal.aborted) return;

      const rows = results
        .map((r, i) => {
          const title = escapeHtml(inarisk[i].title);
          if (r.status === 'rejected')
            return `<tr><td>${title}</td><td colspan="2" class="id-err">Gagal memuat</td></tr>`;
          const v = r.value;
          return `<tr>
            <td>${title}</td>
            <td class="id-val">${v.value === null ? '–' : v.value.toFixed(3)}</td>
            <td><span class="id-class" style="background:${v.color}">${v.className}</span></td>
          </tr>`;
        })
        .join('');

      popup.setContent(
        header +
          `<div class="id-section"><div class="id-section-title">Indeks InaRISK (0–1)</div>
            <table class="id-table"><thead><tr><th>Layer</th><th>Nilai</th><th>Kelas</th></tr></thead><tbody>${rows}</tbody></table>
          </div>` +
          gibsHtml +
          `<div class="id-src">Sumber: ImageServer/identify · gis.bnpb.go.id</div>`,
      );
    },
  });

  return null;
}
