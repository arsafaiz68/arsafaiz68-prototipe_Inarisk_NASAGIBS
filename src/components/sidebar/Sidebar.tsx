import { Layers, Siren, X } from 'lucide-react';
import { useMapStore, type SidebarTab } from '@/store/useMapStore';
import { EventsPanel } from './EventsPanel';
import { LayerPanel } from './LayerPanel';

const TABS: { id: SidebarTab; label: string; icon: typeof Layers }[] = [
  { id: 'layers', label: 'Layer', icon: Layers },
  { id: 'events', label: 'Kejadian Bencana', icon: Siren },
];

export function Sidebar() {
  const open = useMapStore((s) => s.sidebarOpen);
  const tab = useMapStore((s) => s.sidebarTab);
  const setTab = useMapStore((s) => s.setSidebarTab);
  const setOpen = useMapStore((s) => s.setSidebarOpen);

  return (
    <>
      {/* Latar gelap untuk tablet/ponsel ketika sidebar menimpa peta */}
      {open && (
        <div className="absolute inset-0 z-[1090] bg-navy-900/30 md:hidden" onClick={() => setOpen(false)} aria-hidden />
      )}
      <aside
        className={`absolute inset-y-0 left-0 z-[1100] flex w-[320px] max-w-[88vw] flex-col border-r border-slate-200 bg-white shadow-panel transition-transform duration-300 md:relative md:z-auto md:shadow-none ${
          open ? 'translate-x-0' : '-translate-x-full md:-ml-[320px]'
        }`}
        aria-label="Panel layer"
        aria-hidden={!open}
      >
        <div className="flex items-center border-b border-slate-200">
          {TABS.map((t) => {
            const Icon = t.icon;
            const on = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex flex-1 items-center justify-center gap-1.5 border-b-2 px-3 py-2.5 text-[12px] font-medium transition-colors ${
                  on ? 'border-navy-700 text-navy-800' : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icon size={14} />
                {t.label}
              </button>
            );
          })}
          <button onClick={() => setOpen(false)} className="px-3 text-slate-400 hover:text-slate-700 md:hidden" aria-label="Tutup panel">
            <X size={16} />
          </button>
        </div>
        <div className="min-h-0 flex-1">{tab === 'layers' ? <LayerPanel /> : <EventsPanel />}</div>
      </aside>
    </>
  );
}
