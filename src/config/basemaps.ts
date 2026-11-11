export type BasemapId = 'osm' | 'esri-satellite';

export interface BasemapConfig {
  id: BasemapId;
  name: string;
  description: string;
  url: string;
  attribution: string;
  subdomains?: string[];
  maxZoom: number;
  maxNativeZoom: number;
  /** Ubin z=4 yang menutupi Indonesia, dipakai sebagai thumbnail pratinjau. */
  thumbnail: string;
}

export const BASEMAPS: BasemapConfig[] = [
  {
    id: 'osm',
    name: 'OpenStreetMap',
    description: 'Peta jalan & toponimi',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors',
    subdomains: ['a', 'b', 'c'],
    maxZoom: 19,
    maxNativeZoom: 19,
    thumbnail: 'https://a.tile.openstreetmap.org/4/13/8.png',
  },
  {
    id: 'esri-satellite',
    name: 'Esri Satellite',
    description: 'Citra satelit resolusi tinggi',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri',
    maxZoom: 19,
    maxNativeZoom: 18,
    thumbnail: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/4/8/13',
  },
];

export const DEFAULT_BASEMAP: BasemapId = 'osm';
