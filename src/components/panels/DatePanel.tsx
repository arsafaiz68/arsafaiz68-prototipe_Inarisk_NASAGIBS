import { useEffect, useMemo, useRef, useState } from 'react';
import { addDays, differenceInCalendarDays, format, parseISO, subDays } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, Clock, Pause, Play, Sparkles, X, XCircle } from 'lucide-react';
import { GIBS_LAYERS, type GibsLayer } from '@/config/layers';
import { fetchAvailability, isDateAvailable, type Availability } from '@/services/gibs';
import { useMapStore } from '@/store/useMapStore';

const today = () => format(new Date(), 'yyyy-MM-dd');
const SLIDER_DAYS = 60;

/** Panel pengaturan tanggal & waktu data NASA GIBS. */
export function DatePanel() {
  const date = useMapStore((s) => s.date);
  const setDate = useMapStore((s) => s.setDate);
  const open = useMapStore((s) => s.datePanelOpen);
  const setOpen = useMapStore((s) => s.setDatePanelOpen);
  const layers = useMapStore((s) => s.layers);
  const [avail, setAvail] = useState<Record<string, Availability | null>>({});
  const [playing, setPlaying] = useState(false);
  const timer = useRef<number | null>(null);

  const activeGibs = useMemo(() => GIBS_LAYERS.filter((l) => layers[l.id].visible), [layers]);

  useEffect(() => {
    activeGibs.forEach((l) => {
      if (l.id in avail) return;
      fetchAvailability(l)
        .then((a) => setAvail((s) => ({ ...s, [l.id]: a })))
        .catch(() => setAvail((s) => ({ ...s, [l.id]: null })));
    });
  }, [activeGibs, avail]);

  const shift = (days: number) => {
    const next = format(addDays(parseISO(date), days), 'yyyy-MM-dd');
    if (next <= today()) setDate(next);
  };

  /** Tanggal terbaru yang tersedia untuk SEMUA layer GIBS aktif. */
  const latestCommon = useMemo(() => {
    const vals = activeGibs.map((l) => avail[l.id]?.latest).filter(Boolean) as string[];
    return vals.length ? vals.sort()[0] : null;
  }, [activeGibs, avail]);

  // Animasi time-lapse harian
  useEffect(() => {
    if (!playing) return;
    timer.current = window.setInterval(() => {
      const { date: d, setDate: sd } = useMapStore.getState();
      const limit = latestCommon ?? today();
      const next = format(addDays(parseISO(d), 1), 'yyyy-MM-dd');
      sd(next > limit ? format(subDays(parseISO(limit), 13), 'yyyy-MM-dd') : next);
    }, 1800);
    return () => {
      if (timer.current) window.clearInterval(timer.current);
    };
  }, [playing, latestCommon]);

  const sliderEnd = today();
  const sliderValue = SLIDER_DAYS - differenceInCalendarDays(parseISO(sliderEnd), parseISO(date));
  const label = format(parseISO(date), 'EEEE, d MMMM yyyy', { locale: localeId });

  return (
    <div className="pointer-events-none absolute left-1/2 top-3 z-[1000] flex w-[min(560px,calc(100%-80px))] -translate-x-1/2 flex-col items-center gap-2">
      {/* Bar ringkas — selalu tampil */}
      <div className="pointer-events-auto flex items-center gap-1 rounded-full border border-slate-200 bg-white/95 py-1 pl-1 pr-1 shadow-panel backdrop-blur">
        <button onClick={() => shift(-1)} className="rounded-full p-1.5 text-slate-600 hover:bg-navy-50 hover:text-navy-700" title="Hari sebelumnya" aria-label="Hari sebelumnya">
          <ChevronLeft size={16} />
        </button>
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 rounded-full px-2.5 py-1 text-[12.5px] font-medium text-navy-900 hover:bg-navy-50"
          title="Pengaturan tanggal data"
        >
          <CalendarDays size={15} className="text-navy-600" />
          <span className="hidden sm:inline">{label}</span>
          <span className="sm:hidden">{date}</span>
          <span className="rounded bg-slate-100 px-1 text-[10px] font-semibold text-slate-500">UTC</span>
        </button>
        <button
          onClick={() => shift(1)}
          disabled={date >= today()}
          className="rounded-full p-1.5 text-slate-600 hover:bg-navy-50 hover:text-navy-700 disabled:opacity-30"
          title="Hari berikutnya"
          aria-label="Hari berikutnya"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {open && (
        <div className="pointer-events-auto w-full rounded-lg border border-slate-200 bg-white p-4 shadow-panel">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h3 className="text-[13px] font-semibold text-navy-900">Tanggal & Waktu Data</h3>
              <p className="text-[11px] text-slate-500">Berlaku untuk seluruh layer NASA GIBS (harian, UTC)</p>
            </div>
            <button onClick={() => setOpen(false)} className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Tutup panel tanggal">
              <X size={16} />
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <input
              type="date"
              value={date}
              max={today()}
              min="2000-02-24"
              onChange={(e) => e.target.value && setDate(e.target.value)}
              className="rounded-md border border-slate-200 px-2 py-1.5 text-[12.5px] text-slate-800 outline-none focus:border-navy-500 focus:ring-2 focus:ring-navy-100"
            />
            {latestCommon && (
              <button
                onClick={() => setDate(latestCommon)}
                className="flex items-center gap-1 rounded-md bg-navy-700 px-2.5 py-1.5 text-[11.5px] font-medium text-white hover:bg-navy-800"
              >
                <Sparkles size={12} /> Terbaru tersedia
              </button>
            )}
            {[
              ['Kemarin', 1],
              ['-3 hari', 3],
              ['-7 hari', 7],
              ['-30 hari', 30],
            ].map(([l, d]) => (
              <button
                key={l}
                onClick={() => setDate(format(subDays(new Date(), d as number), 'yyyy-MM-dd'))}
                className="rounded-md border border-slate-200 px-2.5 py-1.5 text-[11.5px] text-slate-700 hover:border-navy-200 hover:bg-navy-50"
              >
                {l}
              </button>
            ))}
          </div>

          <div className="mt-3 flex items-center gap-3">
            <button
              onClick={() => setPlaying((p) => !p)}
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${playing ? 'bg-red-600 text-white' : 'bg-navy-50 text-navy-700 hover:bg-navy-100'}`}
              title={playing ? 'Hentikan animasi' : 'Putar animasi harian'}
              aria-label={playing ? 'Hentikan animasi' : 'Putar animasi harian'}
            >
              {playing ? <Pause size={14} /> : <Play size={14} className="ml-0.5" />}
            </button>
            <div className="flex-1">
              <input
                type="range"
                min={0}
                max={SLIDER_DAYS}
                value={Math.max(0, Math.min(SLIDER_DAYS, sliderValue))}
                onChange={(e) =>
                  setDate(format(subDays(parseISO(sliderEnd), SLIDER_DAYS - Number(e.target.value)), 'yyyy-MM-dd'))
                }
                className="w-full cursor-pointer accent-navy-700"
                aria-label="Geser tanggal (60 hari terakhir)"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>{format(subDays(parseISO(sliderEnd), SLIDER_DAYS), 'd MMM', { locale: localeId })}</span>
                <span>60 hari terakhir</span>
                <span>Hari ini</span>
              </div>
            </div>
          </div>

          <div className="mt-3 border-t border-slate-100 pt-3">
            <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              <Clock size={12} /> Ketersediaan layer aktif
            </div>
            {activeGibs.length === 0 ? (
              <p className="text-[11.5px] text-slate-400">Belum ada layer NASA GIBS yang aktif.</p>
            ) : (
              <ul className="space-y-1">
                {activeGibs.map((l: GibsLayer) => {
                  const a = avail[l.id];
                  const ok = a ? isDateAvailable(a, date) : null;
                  return (
                    <li key={l.id} className="flex items-center gap-2 text-[11.5px]">
                      {ok === null ? (
                        <span className="h-3.5 w-3.5 shrink-0 animate-pulse rounded-full bg-slate-200" />
                      ) : ok ? (
                        <CheckCircle2 size={14} className="shrink-0 text-emerald-600" />
                      ) : (
                        <XCircle size={14} className="shrink-0 text-amber-500" />
                      )}
                      <span className="flex-1 truncate text-slate-700">{l.title}</span>
                      {a && (
                        <button onClick={() => setDate(a.latest)} className="shrink-0 tabular-nums text-slate-400 hover:text-navy-700" title="Gunakan tanggal terbaru layer ini">
                          s.d. {a.latest}
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
