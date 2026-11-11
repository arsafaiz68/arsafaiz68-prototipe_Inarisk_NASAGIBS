import { useCallback, useEffect, useMemo, useState } from 'react';
import L from 'leaflet';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AlertCircle, MapPin, RefreshCw } from 'lucide-react';
import { EVENTS_LAYER_ID } from '@/config/layers';
import { categoryColor, fetchWeeklyEvents, type EventWithCenter } from '@/services/events';
import { useMapStore } from '@/store/useMapStore';
import { fmtNum } from '@/utils/geo';
import { eventPopupHtml } from '../map/EventsFeatureLayer';
import { getMapInstance } from '../map/mapInstance';

function Stat({ label, value, tone = 'default' }: { label: string; value: number; tone?: 'default' | 'alert' }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white px-2.5 py-2">
      <div className="text-[10px] uppercase tracking-wide text-slate-500">{label}</div>
      <div className={`text-lg font-semibold tabular-nums leading-tight ${tone === 'alert' && value > 0 ? 'text-red-700' : 'text-navy-900'}`}>
        {fmtNum(value)}
      </div>
    </div>
  );
}

/** Ringkasan kejadian bencana mingguan BNPB (data langsung dari FeatureServer). */
export function EventsPanel() {
  const [events, setEvents] = useState<EventWithCenter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updated, setUpdated] = useState<Date | null>(null);
  const toggleLayer = useMapStore((s) => s.toggleLayer);

  const load = useCallback((signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    fetchWeeklyEvents(signal)
      .then((ev) => {
        setEvents(ev);
        setUpdated(new Date());
      })
      .catch((e: Error) => {
        if (e.name !== 'AbortError') setError(e.message);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const ac = new AbortController();
    load(ac.signal);
    return () => ac.abort();
  }, [load]);

  const totals = useMemo(
    () =>
      events.reduce(
        (t, e) => ({
          kejadian: t.kejadian + e.jumlah,
          meninggal: t.meninggal + e.meninggal,
          hilang: t.hilang + e.hilang,
          luka: t.luka + e.lukaSakit,
          mengungsi: t.mengungsi + e.mengungsi,
          rumah: t.rumah + e.rumahRusak,
        }),
        { kejadian: 0, meninggal: 0, hilang: 0, luka: 0, mengungsi: 0, rumah: 0 },
      ),
    [events],
  );

  const byCategory = useMemo(() => {
    const m = new Map<string, number>();
    for (const e of events) m.set(e.kategori || 'Lainnya', (m.get(e.kategori || 'Lainnya') ?? 0) + e.jumlah);
    return [...m.entries()].map(([kategori, jumlah]) => ({ kategori, jumlah })).sort((a, b) => b.jumlah - a.jumlah);
  }, [events]);

  const week = events[0] ? `Minggu ke-${events[0].minggu} · ${events[0].tahun}` : '';

  const focus = (ev: EventWithCenter) => {
    const map = getMapInstance();
    if (!map || !ev.center) return;
    toggleLayer(EVENTS_LAYER_ID, true);
    map.flyTo(ev.center, 9, { duration: 0.9 });
    map.once('moveend', () => {
      L.popup({ maxWidth: 340, className: 'event-popup' }).setLatLng(ev.center!).setContent(eventPopupHtml(ev)).openOn(map);
    });
  };

  return (
    <div className="scroll-thin h-full overflow-y-auto px-4 py-3">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <h3 className="text-[13px] font-semibold text-navy-900">Kejadian Bencana Mingguan</h3>
          <p className="text-[11px] text-slate-500">
            {week || 'BNPB'}
            {updated && ` · dimuat ${format(updated, 'HH:mm')}`}
          </p>
        </div>
        <button
          onClick={() => load()}
          disabled={loading}
          className="rounded-md border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-50 hover:text-navy-700 disabled:opacity-50"
          title="Muat ulang"
          aria-label="Muat ulang data kejadian"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {error && (
        <div className="mb-3 flex items-start gap-2 rounded-md bg-red-50 p-2.5 text-[11.5px] text-red-800">
          <AlertCircle size={14} className="mt-px shrink-0" />
          <span>Gagal memuat data BNPB: {error}</span>
        </div>
      )}

      {loading && !events.length ? (
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-[52px] animate-pulse rounded-md bg-slate-100" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-2">
            <Stat label="Kejadian" value={totals.kejadian} />
            <Stat label="Meninggal" value={totals.meninggal} tone="alert" />
            <Stat label="Hilang" value={totals.hilang} tone="alert" />
            <Stat label="Luka/Sakit" value={totals.luka} />
            <Stat label="Mengungsi" value={totals.mengungsi} />
            <Stat label="Rumah Rusak" value={totals.rumah} />
          </div>

          {byCategory.length > 0 && (
            <div className="mt-4">
              <h4 className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Jumlah kejadian per jenis bencana
              </h4>
              <div style={{ height: Math.max(80, byCategory.length * 30 + 16) }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={byCategory} layout="vertical" margin={{ top: 4, right: 24, bottom: 0, left: 0 }} barCategoryGap={6}>
                    <XAxis type="number" hide allowDecimals={false} />
                    <YAxis
                      type="category"
                      dataKey="kategori"
                      width={110}
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 11, fill: '#334155' }}
                    />
                    <Tooltip
                      cursor={{ fill: 'rgba(31,70,137,0.06)' }}
                      contentStyle={{ fontSize: 12, borderRadius: 6, borderColor: '#e2e8f0' }}
                      formatter={(v: number) => [fmtNum(v), 'Kejadian']}
                    />
                    <Bar
                      dataKey="jumlah"
                      fill="#1f4689"
                      radius={[0, 4, 4, 0]}
                      maxBarSize={18}
                      label={{ position: 'right', fontSize: 11, fill: '#334155' }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          <h4 className="mb-1.5 mt-4 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Daftar kejadian ({events.length})
          </h4>
          <ul className="space-y-1.5">
            {events.map((ev) => (
              <li key={ev.id}>
                <button
                  onClick={() => focus(ev)}
                  className="w-full rounded-md border border-slate-200 bg-white p-2.5 text-left transition-colors hover:border-navy-200 hover:bg-navy-50/50"
                >
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: categoryColor(ev.kategori) }} />
                    <span className="flex-1 truncate text-[12.5px] font-medium text-navy-900">{ev.kabupaten}</span>
                    <MapPin size={13} className="shrink-0 text-slate-400" />
                  </div>
                  <div className="mt-0.5 pl-[18px] text-[11px] text-slate-500">
                    {ev.kategori} · {ev.date ? format(new Date(ev.date), 'd MMM yyyy', { locale: localeId }) : '-'}
                  </div>
                  {(ev.meninggal > 0 || ev.mengungsi > 0 || ev.rumahRusak > 0) && (
                    <div className="mt-1 flex flex-wrap gap-x-3 pl-[18px] text-[10.5px] text-slate-600">
                      {ev.meninggal > 0 && <span>Meninggal <b>{fmtNum(ev.meninggal)}</b></span>}
                      {ev.mengungsi > 0 && <span>Mengungsi <b>{fmtNum(ev.mengungsi)}</b></span>}
                      {ev.rumahRusak > 0 && <span>Rumah rusak <b>{fmtNum(ev.rumahRusak)}</b></span>}
                    </div>
                  )}
                </button>
              </li>
            ))}
            {!loading && !events.length && !error && (
              <li className="py-6 text-center text-[12px] text-slate-400">Belum ada kejadian tercatat minggu ini.</li>
            )}
          </ul>
          <p className="mt-3 text-[10.5px] text-slate-400">
            Sumber: BNPB — layanan Kejadian_Bencana_Mingguan (gis.bnpb.go.id). Klik kejadian untuk memperbesar ke lokasi.
          </p>
        </>
      )}
    </div>
  );
}
