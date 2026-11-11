import { create } from 'zustand';
import { format, subDays } from 'date-fns';
import { DEFAULT_BASEMAP, type BasemapId } from '@/config/basemaps';
import { ALL_LAYERS, EVENTS_LAYER_ID } from '@/config/layers';

export interface LayerState {
  visible: boolean;
  opacity: number;
  /** Status pemuatan ubin/gambar terakhir. */
  status: 'idle' | 'loading' | 'ready' | 'error';
}

export interface Cursor {
  lat: number;
  lng: number;
}

export type SidebarTab = 'layers' | 'events';

interface MapState {
  basemap: BasemapId;
  /** Tanggal data NASA GIBS (YYYY-MM-DD, UTC). */
  date: string;
  layers: Record<string, LayerState>;
  /** Layer yang informasinya sedang ditampilkan di panel info. */
  infoLayerId: string | null;
  sidebarOpen: boolean;
  sidebarTab: SidebarTab;
  datePanelOpen: boolean;
  identifyEnabled: boolean;
  cursor: Cursor | null;
  zoom: number;

  setBasemap: (id: BasemapId) => void;
  setDate: (date: string) => void;
  toggleLayer: (id: string, visible?: boolean) => void;
  setOpacity: (id: string, opacity: number) => void;
  setStatus: (id: string, status: LayerState['status']) => void;
  hideAll: () => void;
  openInfo: (id: string | null) => void;
  setSidebarOpen: (open: boolean) => void;
  setSidebarTab: (tab: SidebarTab) => void;
  setDatePanelOpen: (open: boolean) => void;
  setIdentifyEnabled: (on: boolean) => void;
  setCursor: (c: Cursor | null) => void;
  setZoom: (z: number) => void;
}

/** Default: kemarin (UTC) — data GIBS hari ini sering belum lengkap. */
export const defaultDate = () => format(subDays(new Date(), 1), 'yyyy-MM-dd');

/**
 * State awal dapat diatur lewat parameter URL agar tampilan bisa dibagikan, mis.:
 * ?basemap=esri-satellite&date=2026-11-01&layers=gibs-modis-terra-truecolor,inarisk-bahaya-banjir
 */
const params = typeof window === 'undefined' ? new URLSearchParams() : new URLSearchParams(window.location.search);
const urlLayers = params.get('layers')?.split(',').filter(Boolean);
const INITIAL_VISIBLE = new Set(urlLayers ?? ['gibs-thermal-anomalies', EVENTS_LAYER_ID]);
const urlDate = params.get('date');
const urlBasemap = params.get('basemap') as BasemapId | null;

const initialLayers = (): Record<string, LayerState> =>
  Object.fromEntries(
    ALL_LAYERS.map((l) => [
      l.id,
      { visible: INITIAL_VISIBLE.has(l.id), opacity: l.defaultOpacity, status: 'idle' as const },
    ]),
  );

export const useMapStore = create<MapState>((set) => ({
  basemap: urlBasemap === 'osm' || urlBasemap === 'esri-satellite' ? urlBasemap : DEFAULT_BASEMAP,
  date: urlDate && /^\d{4}-\d{2}-\d{2}$/.test(urlDate) ? urlDate : defaultDate(),
  layers: initialLayers(),
  infoLayerId: null,
  sidebarOpen: typeof window === 'undefined' ? true : window.innerWidth >= 768,
  sidebarTab: 'layers',
  datePanelOpen: false,
  identifyEnabled: true,
  cursor: null,
  zoom: 5,

  setBasemap: (basemap) => set({ basemap }),
  setDate: (date) => set({ date }),
  toggleLayer: (id, visible) =>
    set((s) => ({
      layers: {
        ...s.layers,
        [id]: { ...s.layers[id], visible: visible ?? !s.layers[id].visible, status: 'idle' },
      },
    })),
  setOpacity: (id, opacity) =>
    set((s) => ({ layers: { ...s.layers, [id]: { ...s.layers[id], opacity } } })),
  setStatus: (id, status) =>
    set((s) =>
      s.layers[id]?.status === status ? s : { layers: { ...s.layers, [id]: { ...s.layers[id], status } } },
    ),
  hideAll: () =>
    set((s) => ({
      layers: Object.fromEntries(Object.entries(s.layers).map(([k, v]) => [k, { ...v, visible: false }])),
    })),
  openInfo: (infoLayerId) => set({ infoLayerId }),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  setSidebarTab: (sidebarTab) => set({ sidebarTab, sidebarOpen: true }),
  setDatePanelOpen: (datePanelOpen) => set({ datePanelOpen }),
  setIdentifyEnabled: (identifyEnabled) => set({ identifyEnabled }),
  setCursor: (cursor) => set({ cursor }),
  setZoom: (zoom) => set({ zoom }),
}));

/** Selector: daftar id layer yang aktif. */
export const selectVisibleIds = (s: MapState) =>
  Object.entries(s.layers)
    .filter(([, v]) => v.visible)
    .map(([k]) => k);
