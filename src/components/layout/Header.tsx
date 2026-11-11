import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { Globe2, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useMapStore } from '@/store/useMapStore';

export function Header() {
  const open = useMapStore((s) => s.sidebarOpen);
  const setOpen = useMapStore((s) => s.setSidebarOpen);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  return (
    <header className="relative z-[1200] flex h-14 shrink-0 items-center gap-3 border-b border-navy-800 bg-navy-900 px-3 text-white">
      <button
        onClick={() => setOpen(!open)}
        className="rounded-md p-1.5 text-navy-100 hover:bg-white/10 hover:text-white"
        title={open ? 'Sembunyikan panel' : 'Tampilkan panel'}
        aria-label={open ? 'Sembunyikan panel' : 'Tampilkan panel'}
      >
        {open ? <PanelLeftClose size={19} /> : <PanelLeftOpen size={19} />}
      </button>
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/15">
        <Globe2 size={20} />
      </div>
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-[13px] font-bold tracking-wide sm:text-[15px]">WEBGIS MONITORING KEBENCANAAN INDONESIA</h1>
        <p className="hidden truncate text-[11px] text-navy-200 sm:block">
          Integrasi Citra Satelit NASA GIBS dan Data Spasial InaRISK BNPB
        </p>
      </div>
      <div className="hidden items-center gap-4 text-[11px] text-navy-200 lg:flex">
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
          </span>
          Layanan daring
        </div>
        <div className="border-l border-white/15 pl-4 text-right leading-tight">
          <div className="font-medium text-white">{format(now, 'EEEE, d MMM yyyy', { locale: localeId })}</div>
          <div>{format(now, 'HH:mm')} WIB/lokal · EPSG:3857</div>
        </div>
      </div>
    </header>
  );
}
