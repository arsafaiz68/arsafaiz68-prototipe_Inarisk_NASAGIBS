import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { useMap } from 'react-leaflet';
import {
  CalendarDays, Crosshair, Expand, Home, Layers, LocateFixed, Minimize, Minus, MousePointerClick, Plus,
} from 'lucide-react';
import { INDONESIA_BOUNDS } from '@/config/services';
import { useMapStore } from '@/store/useMapStore';
import { BasemapSwitcher } from '../sidebar/BasemapSwitcher';

function ControlButton({
  title, onClick, active, children,
}: { title: string; onClick: () => void; active?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      className={`flex h-9 w-9 items-center justify-center transition-colors ${
        active ? 'bg-navy-700 text-white' : 'bg-white text-slate-700 hover:bg-navy-50 hover:text-navy-700'
      }`}
    >
      {children}
    </button>
  );
}

/** Kontrol peta mengambang di sisi kanan. */
export function MapControls() {
  const map = useMap();
  const ref = useRef<HTMLDivElement>(null);
  const [basemapOpen, setBasemapOpen] = useState(false);
  const [isFullscreen, setFullscreen] = useState(false);
  const [locating, setLocating] = useState(false);
  const identifyEnabled = useMapStore((s) => s.identifyEnabled);
  const setIdentifyEnabled = useMapStore((s) => s.setIdentifyEnabled);
  const datePanelOpen = useMapStore((s) => s.datePanelOpen);
  const setDatePanelOpen = useMapStore((s) => s.setDatePanelOpen);
  const locRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    L.DomEvent.disableClickPropagation(ref.current);
    L.DomEvent.disableScrollPropagation(ref.current);
  }, []);

  useEffect(() => {
    const onFs = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen?.();
  };

  const locate = () => {
    setLocating(true);
    map
      .locate({ setView: true, maxZoom: 13 })
      .once('locationfound', (e: L.LocationEvent) => {
        setLocating(false);
        locRef.current?.remove();
        locRef.current = L.layerGroup([
          L.circle(e.latlng, { radius: e.accuracy, color: '#1f4689', weight: 1, fillOpacity: 0.1 }),
          L.circleMarker(e.latlng, { radius: 7, color: '#fff', weight: 2, fillColor: '#1f4689', fillOpacity: 1 }),
        ]).addTo(map);
      })
      .once('locationerror', () => {
        setLocating(false);
        alert('Lokasi tidak dapat ditentukan. Pastikan izin lokasi browser diaktifkan.');
      });
  };

  return (
    <div ref={ref} className="pointer-events-auto absolute right-3 top-3 z-[1000] flex flex-col items-end gap-2">
      <div className="flex flex-col divide-y divide-slate-200 overflow-hidden rounded-lg border border-slate-200 shadow-panel">
        <ControlButton title="Perbesar" onClick={() => map.zoomIn()}><Plus size={18} /></ControlButton>
        <ControlButton title="Perkecil" onClick={() => map.zoomOut()}><Minus size={18} /></ControlButton>
      </div>

      <div className="flex flex-col divide-y divide-slate-200 overflow-hidden rounded-lg border border-slate-200 shadow-panel">
        <ControlButton title="Tampilkan seluruh Indonesia" onClick={() => map.flyToBounds(INDONESIA_BOUNDS, { duration: 0.8 })}>
          <Home size={17} />
        </ControlButton>
        <ControlButton title="Lokasi saya" onClick={locate} active={locating}>
          {locating ? <Crosshair size={17} className="animate-spin" /> : <LocateFixed size={17} />}
        </ControlButton>
        <ControlButton title={isFullscreen ? 'Keluar layar penuh' : 'Layar penuh'} onClick={toggleFullscreen}>
          {isFullscreen ? <Minimize size={17} /> : <Expand size={17} />}
        </ControlButton>
      </div>

      <div className="flex flex-col divide-y divide-slate-200 overflow-hidden rounded-lg border border-slate-200 shadow-panel">
        <ControlButton
          title={identifyEnabled ? 'Identifikasi klik: aktif' : 'Identifikasi klik: nonaktif'}
          onClick={() => setIdentifyEnabled(!identifyEnabled)}
          active={identifyEnabled}
        >
          <MousePointerClick size={17} />
        </ControlButton>
        <ControlButton title="Pengaturan tanggal data" onClick={() => setDatePanelOpen(!datePanelOpen)} active={datePanelOpen}>
          <CalendarDays size={17} />
        </ControlButton>
        <ControlButton title="Ganti basemap" onClick={() => setBasemapOpen((v) => !v)} active={basemapOpen}>
          <Layers size={17} />
        </ControlButton>
      </div>

      {basemapOpen && (
        <div className="w-60 rounded-lg border border-slate-200 bg-white p-3 shadow-panel">
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Basemap</div>
          <BasemapSwitcher compact onSelect={() => setBasemapOpen(false)} />
        </div>
      )}
    </div>
  );
}
