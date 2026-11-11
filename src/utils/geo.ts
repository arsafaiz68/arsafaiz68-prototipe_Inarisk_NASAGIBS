/** Konversi EPSG:4326 (lat, lng) ke EPSG:3857 (x, y) dalam meter. */
export function toWebMercator(lat: number, lng: number): { x: number; y: number } {
  const R = 6378137;
  const clamped = Math.max(Math.min(lat, 85.05112878), -85.05112878);
  const x = (R * lng * Math.PI) / 180;
  const y = R * Math.log(Math.tan(Math.PI / 4 + (clamped * Math.PI) / 360));
  return { x, y };
}

export function formatDMS(value: number, isLat: boolean): string {
  const hemi = isLat ? (value >= 0 ? 'LU' : 'LS') : value >= 0 ? 'BT' : 'BB';
  const abs = Math.abs(value);
  const d = Math.floor(abs);
  const mFloat = (abs - d) * 60;
  const m = Math.floor(mFloat);
  const s = (mFloat - m) * 60;
  return `${d}°${String(m).padStart(2, '0')}′${s.toFixed(1).padStart(4, '0')}″ ${hemi}`;
}

export const fmtNum = (n: number, digits = 0) =>
  n.toLocaleString('id-ID', { minimumFractionDigits: digits, maximumFractionDigits: digits });

export const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
