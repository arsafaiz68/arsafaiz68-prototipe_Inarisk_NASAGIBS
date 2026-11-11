import { INARISK_CLASSES, type InariskLayer } from '@/config/layers';

export interface IdentifyResult {
  layer: InariskLayer;
  value: number | null;
  className: string;
  color: string;
}

export function classifyIndex(v: number | null) {
  if (v === null || Number.isNaN(v)) return { label: 'Tidak ada data', color: '#9ca3af' };
  return INARISK_CLASSES.find((c) => v >= c.min && v < c.max) ?? { label: '—', color: '#9ca3af' };
}

/**
 * Membaca nilai piksel indeks InaRISK pada koordinat (EPSG:4326)
 * melalui operasi ImageServer/identify.
 */
export async function identifyPixel(
  layer: InariskLayer,
  lat: number,
  lng: number,
  signal?: AbortSignal,
): Promise<IdentifyResult> {
  if (layer.serviceType !== 'ImageServer') {
    return identifyMapServer(layer, lat, lng, signal);
  }
  const geometry = JSON.stringify({ x: lng, y: lat, spatialReference: { wkid: 4326 } });
  const params = new URLSearchParams({
    geometry,
    geometryType: 'esriGeometryPoint',
    returnGeometry: 'false',
    returnCatalogItems: 'false',
    f: 'json',
  });
  const res = await fetch(`${layer.url}/identify?${params}`, { signal });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  const raw = json?.value;
  const value = raw === undefined || raw === null || raw === 'NoData' ? null : Number(raw);
  const cls = classifyIndex(value);
  return { layer, value: Number.isFinite(value) ? value : null, className: cls.label, color: cls.color };
}

async function identifyMapServer(
  layer: InariskLayer,
  lat: number,
  lng: number,
  signal?: AbortSignal,
): Promise<IdentifyResult> {
  const d = 0.05;
  const params = new URLSearchParams({
    geometry: `${lng},${lat}`,
    geometryType: 'esriGeometryPoint',
    sr: '4326',
    layers: 'all',
    tolerance: '2',
    mapExtent: `${lng - d},${lat - d},${lng + d},${lat + d}`,
    imageDisplay: '400,400,96',
    returnGeometry: 'false',
    f: 'json',
  });
  const res = await fetch(`${layer.url}/identify?${params}`, { signal });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  const attrs: Record<string, unknown> = json?.results?.[0]?.attributes ?? {};
  // Contoh kunci: "Stretch.Pixel Value", "Pixel Value"
  const key = Object.keys(attrs).find((k) => /pixel\s*value/i.test(k));
  const rawPixel = key ? attrs[key] : null;
  const value = rawPixel === null || rawPixel === 'NoData' ? null : Number(rawPixel);
  const cls = classifyIndex(Number.isFinite(value) ? value : null);
  return { layer, value: Number.isFinite(value) ? value : null, className: cls.label, color: cls.color };
}
