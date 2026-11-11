import { LAYER_INDEX, EVENTS_LAYER_ID, type BnpbFeatureLayer } from '@/config/layers';

export interface DisasterEvent {
  id: string;
  date: number;
  kabupaten: string;
  kategori: string;
  jumlah: number;
  meninggal: number;
  hilang: number;
  lukaSakit: number;
  mengungsi: number;
  menderita: number;
  rumahRusak: number;
  rumahTerendam: number;
  kronologis: string;
  kondisi: string;
  upaya: string;
  minggu: number;
  tahun: number;
}

/** Warna per kategori bencana (kunci huruf kecil). */
export const CATEGORY_COLORS: Record<string, string> = {
  banjir: '#2563eb',
  'banjir bandang': '#1e3a8a',
  'tanah longsor': '#92400e',
  'cuaca ekstrem': '#7c3aed',
  'kebakaran hutan dan lahan': '#ea580c',
  karhutla: '#ea580c',
  kekeringan: '#ca8a04',
  gempabumi: '#be123c',
  'gelombang pasang dan abrasi': '#0891b2',
  'gelombang pasang / abrasi': '#0891b2',
  'erupsi gunung api': '#dc2626',
  tsunami: '#0e7490',
};

export const categoryColor = (k?: string) => CATEGORY_COLORS[(k ?? '').toLowerCase().trim()] ?? '#475569';

const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : 0);
const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');

export function toEvent(a: Record<string, unknown>): DisasterEvent {
  return {
    id: str(a.id) || String(a.objectid ?? a.ESRI_OID),
    date: num(a.dt),
    kabupaten: str(a.kabupaten),
    kategori: str(a.kategori_bencana),
    jumlah: num(a.jumlah_kejadian),
    meninggal: num(a.meninggal),
    hilang: num(a.hilang),
    lukaSakit: num(a.luka_sakit),
    mengungsi: num(a.mengungsi),
    menderita: num(a.menderita),
    rumahRusak: num(a.rumah_rusak),
    rumahTerendam: num(a.rumah_terendam),
    kronologis: str(a.kronologis),
    kondisi: str(a.kondisi_mutakhir),
    upaya: str(a.upaya_),
    minggu: num(a.minggu),
    tahun: num(a.tahun),
  };
}

export interface EventWithCenter extends DisasterEvent {
  center: [number, number] | null;
}

/** Mengambil atribut + titik tengah poligon kejadian bencana mingguan. */
export async function fetchWeeklyEvents(signal?: AbortSignal): Promise<EventWithCenter[]> {
  const layer = LAYER_INDEX[EVENTS_LAYER_ID] as BnpbFeatureLayer;
  const params = new URLSearchParams({
    where: '1=1',
    outFields: '*',
    returnGeometry: 'true',
    returnCentroid: 'true',
    outSR: '4326',
    geometryPrecision: '3',
    maxAllowableOffset: '0.05',
    orderByFields: 'dt DESC',
    f: 'json',
  });
  const res = await fetch(`${layer.url}/query?${params}`, { signal });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  if (json.error) throw new Error(json.error.message ?? 'Kesalahan layanan');
  return (json.features ?? []).map((f: any) => ({
    ...toEvent(f.attributes ?? {}),
    center: centerOf(f),
  }));
}

function centerOf(f: any): [number, number] | null {
  if (f.centroid && Number.isFinite(f.centroid.x)) return [f.centroid.y, f.centroid.x];
  const rings: number[][][] | undefined = f.geometry?.rings;
  if (!rings?.length) return null;
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const ring of rings)
    for (const [x, y] of ring) {
      minX = Math.min(minX, x); maxX = Math.max(maxX, x);
      minY = Math.min(minY, y); maxY = Math.max(maxY, y);
    }
  return [(minY + maxY) / 2, (minX + maxX) / 2];
}
