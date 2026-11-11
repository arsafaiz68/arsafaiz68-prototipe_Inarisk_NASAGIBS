/**
 * Endpoint layanan resmi yang digunakan aplikasi.
 * Semua URL diverifikasi aktif & mengizinkan CORS (Nov 2026).
 */
export const SERVICES = {
  /** NASA GIBS WMTS REST, proyeksi Web Mercator (EPSG:3857). */
  gibsWmts: 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best',
  /** NASA GIBS WMS — dipakai untuk layer vektor (hotspot) yang dirender server menjadi PNG. */
  gibsWms: 'https://gibs.earthdata.nasa.gov/wms/epsg3857/best/wms.cgi',
  /** ArcGIS Enterprise BNPB yang melayani data InaRISK. */
  bnpbRest: 'https://gis.bnpb.go.id/server/rest/services',
  /** Portal publik InaRISK (untuk tautan referensi). */
  inariskPortal: 'https://inarisk.bnpb.go.id',
  gibsPortal: 'https://www.earthdata.nasa.gov/engage/open-data-services-software/earthdata-developer-portal/gibs-api',
} as const;

/** Batas wilayah Indonesia dalam EPSG:4326 [lat, lng]. */
export const INDONESIA_BOUNDS: [[number, number], [number, number]] = [
  [-11.2, 94.7],
  [6.4, 141.3],
];

export const INDONESIA_CENTER: [number, number] = [-2.5, 118];
export const DEFAULT_ZOOM = 5;
export const MIN_ZOOM = 3;
export const MAX_ZOOM = 18;
