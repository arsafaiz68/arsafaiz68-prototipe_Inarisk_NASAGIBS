import type { Map as LeafletMap } from 'leaflet';

/** Referensi instans peta untuk komponen di luar MapContainer (sidebar, panel). */
let instance: LeafletMap | null = null;

export const setMapInstance = (m: LeafletMap | null) => {
  instance = m;
};
export const getMapInstance = () => instance;
