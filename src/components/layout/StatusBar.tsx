import { useMapStore } from '@/store/useMapStore';
import { formatDMS, toWebMercator } from '@/utils/geo';

/** Baris status: koordinat kursor (EPSG:4326 & EPSG:3857), zoom, tanggal data. */
export function StatusBar() {
  const cursor = useMapStore((s) => s.cursor);
  const zoom = useMapStore((s) => s.zoom);
  const date = useMapStore((s) => s.date);
  const merc = cursor ? toWebMercator(cursor.lat, cursor.lng) : null;

  return (
    <div className="pointer-events-none absolute bottom-0 left-0 z-[1000] flex max-w-[calc(100%-170px)] items-center gap-3 overflow-hidden whitespace-nowrap rounded-tr-md bg-white/90 px-3 py-1 text-[10.5px] text-slate-600 shadow-sm backdrop-blur">
      <span>
        <b className="text-slate-500">EPSG:4326</b>{' '}
        <span className="tabular-nums text-slate-800">
          {cursor ? `${cursor.lat.toFixed(5)}, ${cursor.lng.toFixed(5)}` : '—'}
        </span>
      </span>
      {cursor && (
        <span className="hidden tabular-nums lg:inline">
          {formatDMS(cursor.lat, true)} {formatDMS(cursor.lng, false)}
        </span>
      )}
      <span className="hidden md:inline">
        <b className="text-slate-500">EPSG:3857</b>{' '}
        <span className="tabular-nums text-slate-800">{merc ? `${merc.x.toFixed(0)}, ${merc.y.toFixed(0)}` : '—'}</span>
      </span>
      <span>
        <b className="text-slate-500">Z</b> <span className="tabular-nums text-slate-800">{zoom}</span>
      </span>
      <span className="hidden sm:inline">
        <b className="text-slate-500">GIBS</b> <span className="tabular-nums text-slate-800">{date}</span>
      </span>
    </div>
  );
}
