import { SERVICES } from '@/config/services';
import type { GibsLayer } from '@/config/layers';

/** URL template ubin WMTS REST GIBS untuk tanggal tertentu. */
export function gibsTileUrl(layer: GibsLayer, date: string): string {
  return `${SERVICES.gibsWmts}/${layer.gibsId}/default/${date}/${layer.tileMatrixSet}/{z}/{y}/{x}.${layer.format}`;
}

export interface DateRange {
  start: string;
  end: string;
}

export interface Availability {
  ranges: DateRange[];
  first: string;
  latest: string;
}

const cache = new Map<string, Promise<Availability>>();

/**
 * Mengambil rentang tanggal yang tersedia untuk sebuah layer melalui
 * operasi WMTS DescribeDomains GIBS (ringan, ±400 byte; vs. GetCapabilities ±6 MB).
 */
export function fetchAvailability(layer: GibsLayer): Promise<Availability> {
  const key = `${layer.gibsId}|${layer.tileMatrixSet}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const url = `${SERVICES.gibsWmts}/1.0.0/${layer.gibsId}/default/${layer.tileMatrixSet}/all/all.xml`;
  const p = fetch(url)
    .then((r) => {
      if (!r.ok) throw new Error(`DescribeDomains HTTP ${r.status}`);
      return r.text();
    })
    .then((xml) => {
      const m = xml.match(/<Domain>([^<]+)<\/Domain>/);
      if (!m) throw new Error('Domain waktu tidak ditemukan');
      const ranges = m[1]
        .split(',')
        .map((seg) => seg.trim().split('/'))
        .filter((p) => p.length >= 2)
        .map(([start, end]) => ({ start: start.slice(0, 10), end: end.slice(0, 10) }));
      if (!ranges.length) throw new Error('Rentang tanggal kosong');
      return { ranges, first: ranges[0].start, latest: ranges[ranges.length - 1].end };
    });
  p.catch(() => cache.delete(key));
  cache.set(key, p);
  return p;
}

/** Apakah tanggal (YYYY-MM-DD) tercakup oleh salah satu rentang. */
export function isDateAvailable(av: Availability, date: string): boolean {
  return av.ranges.some((r) => date >= r.start && date <= r.end);
}
