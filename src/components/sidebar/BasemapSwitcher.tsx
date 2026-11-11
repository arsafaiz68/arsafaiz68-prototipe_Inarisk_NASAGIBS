import { Check } from 'lucide-react';
import { BASEMAPS } from '@/config/basemaps';
import { useMapStore } from '@/store/useMapStore';

interface Props {
  compact?: boolean;
  onSelect?: () => void;
}

/** Pemilih basemap dengan pratinjau thumbnail; tidak me-reload peta. */
export function BasemapSwitcher({ compact, onSelect }: Props) {
  const active = useMapStore((s) => s.basemap);
  const setBasemap = useMapStore((s) => s.setBasemap);

  return (
    <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Pilih basemap">
      {BASEMAPS.map((b) => {
        const on = b.id === active;
        return (
          <button
            key={b.id}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => {
              setBasemap(b.id);
              onSelect?.();
            }}
            className={`group relative overflow-hidden rounded-lg border-2 text-left transition-all ${
              on ? 'border-navy-600 ring-2 ring-navy-200' : 'border-slate-200 hover:border-navy-200'
            }`}
          >
            <div className={`${compact ? 'h-14' : 'h-16'} w-full overflow-hidden bg-slate-100`}>
              <img
                src={b.thumbnail}
                alt={`Pratinjau ${b.name}`}
                loading="lazy"
                className="h-full w-full scale-150 object-cover transition-transform group-hover:scale-[1.6]"
              />
            </div>
            <div className={`px-2 py-1.5 ${on ? 'bg-navy-700 text-white' : 'bg-white text-slate-700'}`}>
              <div className="truncate text-[11px] font-semibold">{b.name}</div>
              {!compact && (
                <div className={`truncate text-[10px] ${on ? 'text-navy-100' : 'text-slate-400'}`}>{b.description}</div>
              )}
            </div>
            {on && (
              <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-navy-700 text-white shadow">
                <Check size={12} strokeWidth={3} />
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
