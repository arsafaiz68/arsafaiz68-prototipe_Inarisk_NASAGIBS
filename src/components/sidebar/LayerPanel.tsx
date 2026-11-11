import { useMemo, useState } from 'react';
import { ChevronDown, EyeOff, Search, Satellite, ShieldAlert, Siren, X } from 'lucide-react';
import { LAYER_GROUPS, type LayerSource } from '@/config/layers';
import { selectVisibleIds, useMapStore } from '@/store/useMapStore';
import { BasemapSwitcher } from './BasemapSwitcher';
import { LayerItem } from './LayerItem';

const SOURCE_ICON: Record<LayerSource, typeof Satellite> = {
  gibs: Satellite,
  inarisk: ShieldAlert,
  bnpb: Siren,
};
const SOURCE_LABEL: Record<LayerSource, string> = {
  gibs: 'NASA GIBS',
  inarisk: 'InaRISK',
  bnpb: 'BNPB',
};

export function LayerPanel() {
  const [query, setQuery] = useState('');
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({ 'InaRISK — Indeks Risiko': true });
  const layers = useMapStore((s) => s.layers);
  const hideAll = useMapStore((s) => s.hideAll);
  const visibleCount = useMapStore((s) => selectVisibleIds(s).length);

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return LAYER_GROUPS;
    return LAYER_GROUPS.map((g) => ({
      ...g,
      layers: g.layers.filter((l) => `${l.title} ${l.description}`.toLowerCase().includes(q)),
    })).filter((g) => g.layers.length);
  }, [query]);

  return (
    <div className="flex h-full flex-col">
      <section className="border-b border-slate-200 px-4 py-3">
        <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Basemap</h3>
        <BasemapSwitcher />
      </section>

      <section className="space-y-2 border-b border-slate-200 px-4 py-3">
        <div className="relative">
          <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari layer…"
            className="w-full rounded-md border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-7 text-[12.5px] outline-none placeholder:text-slate-400 focus:border-navy-500 focus:bg-white focus:ring-2 focus:ring-navy-100"
          />
          {query && (
            <button onClick={() => setQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600" aria-label="Hapus pencarian">
              <X size={14} />
            </button>
          )}
        </div>
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-slate-500">
            <b className="text-navy-700">{visibleCount}</b> layer aktif
          </span>
          {visibleCount > 0 && (
            <button onClick={hideAll} className="flex items-center gap-1 text-slate-500 hover:text-red-600">
              <EyeOff size={12} /> Matikan semua
            </button>
          )}
        </div>
      </section>

      <div className="scroll-thin flex-1 overflow-y-auto px-2 py-2">
        {groups.map((g) => {
          const Icon = SOURCE_ICON[g.source];
          const isCollapsed = collapsed[g.title] && !query;
          const active = g.layers.filter((l) => layers[l.id].visible).length;
          return (
            <section key={g.title} className="mb-1">
              <button
                type="button"
                onClick={() => setCollapsed((c) => ({ ...c, [g.title]: !c[g.title] }))}
                className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left hover:bg-slate-50"
                aria-expanded={!isCollapsed}
              >
                <Icon size={15} className="shrink-0 text-navy-600" />
                <span className="flex-1 truncate text-[12px] font-semibold text-slate-800">{g.title}</span>
                <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9.5px] font-medium uppercase tracking-wide text-slate-500">
                  {SOURCE_LABEL[g.source]}
                </span>
                {active > 0 && (
                  <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-navy-700 px-1 text-[10px] font-semibold text-white">
                    {active}
                  </span>
                )}
                <ChevronDown size={14} className={`shrink-0 text-slate-400 transition-transform ${isCollapsed ? '-rotate-90' : ''}`} />
              </button>
              {!isCollapsed && (
                <ul className="mt-0.5 space-y-0.5 pb-1">
                  {g.layers.map((l) => (
                    <LayerItem key={l.id} layer={l} />
                  ))}
                </ul>
              )}
            </section>
          );
        })}
        {!groups.length && <p className="px-3 py-6 text-center text-[12px] text-slate-400">Tidak ada layer yang cocok.</p>}
      </div>
    </div>
  );
}
