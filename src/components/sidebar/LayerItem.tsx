import { AlertTriangle, CalendarX2, Info, Loader2 } from 'lucide-react';
import type { GibsLayer, LayerConfig } from '@/config/layers';
import { useGibsAvailability } from '@/hooks/useGibsAvailability';
import { isDateAvailable } from '@/services/gibs';
import { useMapStore } from '@/store/useMapStore';
import { Legend } from './Legend';

function GibsDateBadge({ layer }: { layer: GibsLayer }) {
  const date = useMapStore((s) => s.date);
  const { data } = useGibsAvailability(layer);
  if (!data || isDateAvailable(data, date)) return null;
  return (
    <div className="mt-2 flex items-start gap-1.5 rounded bg-amber-50 px-2 py-1.5 text-[10.5px] leading-snug text-amber-800">
      <CalendarX2 size={12} className="mt-px shrink-0" />
      <span>
        Data tidak tersedia pada {date}. Terbaru: <b>{data.latest}</b>
      </span>
    </div>
  );
}

export function LayerItem({ layer }: { layer: LayerConfig }) {
  const st = useMapStore((s) => s.layers[layer.id]);
  const toggle = useMapStore((s) => s.toggleLayer);
  const setOpacity = useMapStore((s) => s.setOpacity);
  const openInfo = useMapStore((s) => s.openInfo);
  const infoId = useMapStore((s) => s.infoLayerId);

  return (
    <li className={`rounded-md border transition-colors ${st.visible ? 'border-navy-100 bg-navy-50/60' : 'border-transparent hover:bg-slate-50'}`}>
      <div className="flex items-center gap-2 px-2 py-1.5">
        <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={st.visible}
            onChange={() => toggle(layer.id)}
            className="h-3.5 w-3.5 shrink-0 cursor-pointer rounded border-slate-300 accent-navy-700"
          />
          <span className={`truncate text-[12.5px] ${st.visible ? 'font-medium text-navy-900' : 'text-slate-700'}`} title={layer.title}>
            {layer.title}
          </span>
        </label>
        {st.visible && st.status === 'loading' && <Loader2 size={13} className="shrink-0 animate-spin text-navy-500" aria-label="Memuat" />}
        {st.visible && st.status === 'error' && (
          <span title="Sebagian data gagal dimuat (mungkin tidak tersedia pada tanggal/area ini)">
            <AlertTriangle size={13} className="shrink-0 text-amber-500" />
          </span>
        )}
        <button
          type="button"
          onClick={() => openInfo(infoId === layer.id ? null : layer.id)}
          className={`shrink-0 rounded p-1 transition-colors ${infoId === layer.id ? 'bg-navy-700 text-white' : 'text-slate-400 hover:bg-white hover:text-navy-700'}`}
          title="Informasi layer"
          aria-label={`Informasi ${layer.title}`}
        >
          <Info size={14} />
        </button>
      </div>

      {st.visible && (
        <div className="space-y-2 px-2 pb-2.5 pl-[30px]">
          <div className="flex items-center gap-2">
            <span className="w-14 shrink-0 text-[10.5px] text-slate-500">Opasitas</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={st.opacity}
              onChange={(e) => setOpacity(layer.id, Number(e.target.value))}
              className="h-1 flex-1 cursor-pointer accent-navy-700"
              aria-label={`Opasitas ${layer.title}`}
            />
            <span className="w-8 text-right text-[10.5px] tabular-nums text-slate-600">{Math.round(st.opacity * 100)}%</span>
          </div>
          <Legend spec={layer.legend} />
          {layer.source === 'gibs' && <GibsDateBadge layer={layer} />}
        </div>
      )}
    </li>
  );
}
