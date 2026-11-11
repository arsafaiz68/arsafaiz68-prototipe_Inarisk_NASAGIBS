import { useState } from 'react';
import { Check, Copy, ExternalLink, Eye, EyeOff, X } from 'lucide-react';
import { LAYER_INDEX, type LayerConfig } from '@/config/layers';
import { SERVICES } from '@/config/services';
import { useGibsAvailability } from '@/hooks/useGibsAvailability';
import { gibsTileUrl } from '@/services/gibs';
import { useMapStore } from '@/store/useMapStore';
import { Legend } from '../sidebar/Legend';

const SOURCE_BADGE: Record<LayerConfig['source'], { label: string; cls: string }> = {
  gibs: { label: 'NASA GIBS', cls: 'bg-sky-50 text-sky-800 ring-sky-200' },
  inarisk: { label: 'InaRISK BNPB', cls: 'bg-orange-50 text-orange-800 ring-orange-200' },
  bnpb: { label: 'BNPB', cls: 'bg-red-50 text-red-800 ring-red-200' },
};

function endpointOf(layer: LayerConfig, date: string) {
  if (layer.source === 'gibs')
    return layer.protocol === 'wms' ? `${SERVICES.gibsWms}?LAYERS=${layer.gibsId}&TIME=${date}` : gibsTileUrl(layer, date);
  return layer.url;
}

function CopyField({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-stretch overflow-hidden rounded-md border border-slate-200 bg-slate-50">
      <code className="flex-1 break-all px-2 py-1.5 font-mono text-[10.5px] leading-snug text-slate-700">{value}</code>
      <button
        onClick={() => {
          navigator.clipboard?.writeText(value).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          });
        }}
        className="border-l border-slate-200 px-2 text-slate-500 hover:bg-white hover:text-navy-700"
        title="Salin"
        aria-label="Salin endpoint"
      >
        {copied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
      </button>
    </div>
  );
}

/** Panel informasi layer (metadata, legenda, endpoint, ketersediaan). */
export function LayerInfoPanel() {
  const id = useMapStore((s) => s.infoLayerId);
  const openInfo = useMapStore((s) => s.openInfo);
  const date = useMapStore((s) => s.date);
  const st = useMapStore((s) => (id ? s.layers[id] : null));
  const toggle = useMapStore((s) => s.toggleLayer);
  const layer = id ? LAYER_INDEX[id] : null;
  const gibsLayer = layer?.source === 'gibs' ? layer : null;
  const { data: avail, loading } = useGibsAvailability(gibsLayer);

  if (!layer || !st) return null;
  const badge = SOURCE_BADGE[layer.source];
  const restUrl = layer.source === 'gibs' ? null : `${layer.url}?f=pjson`;

  return (
    <aside
      className="absolute bottom-10 right-14 top-3 z-[1050] flex w-[340px] max-w-[calc(100%-72px)] flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-panel"
      aria-label="Informasi layer"
    >
      <header className="border-b border-slate-200 bg-navy-900 px-4 py-3 text-white">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <span className={`inline-block rounded px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-wide ring-1 ${badge.cls}`}>
              {badge.label}
            </span>
            <h2 className="mt-1.5 text-[14px] font-semibold leading-snug">{layer.title}</h2>
            <p className="text-[11px] text-navy-200">{layer.group}</p>
          </div>
          <button onClick={() => openInfo(null)} className="rounded p-1 text-navy-200 hover:bg-white/10 hover:text-white" aria-label="Tutup panel informasi">
            <X size={16} />
          </button>
        </div>
      </header>

      <div className="scroll-thin flex-1 space-y-4 overflow-y-auto px-4 py-3 text-[12px]">
        <button
          onClick={() => toggle(layer.id)}
          className={`flex w-full items-center justify-center gap-1.5 rounded-md py-1.5 text-[12px] font-medium ${
            st.visible ? 'border border-slate-200 text-slate-700 hover:bg-slate-50' : 'bg-navy-700 text-white hover:bg-navy-800'
          }`}
        >
          {st.visible ? <EyeOff size={14} /> : <Eye size={14} />}
          {st.visible ? 'Sembunyikan layer' : 'Tampilkan layer'}
        </button>

        <section>
          <h3 className="mb-1 text-[10.5px] font-semibold uppercase tracking-wider text-slate-500">Deskripsi</h3>
          <p className="leading-relaxed text-slate-700">{layer.description}</p>
        </section>

        {layer.legend && (
          <section>
            <h3 className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-wider text-slate-500">Legenda</h3>
            <Legend spec={layer.legend} />
          </section>
        )}

        {gibsLayer && (
          <section>
            <h3 className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-wider text-slate-500">Ketersediaan Temporal</h3>
            {loading && <p className="text-slate-400">Memeriksa DescribeDomains GIBS…</p>}
            {avail && (
              <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
                <dt className="text-slate-500">Data pertama</dt>
                <dd className="tabular-nums text-slate-800">{avail.first}</dd>
                <dt className="text-slate-500">Data terbaru</dt>
                <dd className="tabular-nums font-medium text-navy-800">{avail.latest}</dd>
                <dt className="text-slate-500">Tanggal aktif</dt>
                <dd className="tabular-nums text-slate-800">{date}</dd>
                <dt className="text-slate-500">Celah data</dt>
                <dd className="text-slate-800">{avail.ranges.length - 1} periode</dd>
              </dl>
            )}
          </section>
        )}

        <section>
          <h3 className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-wider text-slate-500">Metadata</h3>
          <dl className="divide-y divide-slate-100 rounded-md border border-slate-200">
            {Object.entries(layer.metadata).map(([k, v]) => (
              <div key={k} className="grid grid-cols-[110px_1fr] gap-2 px-2.5 py-1.5">
                <dt className="text-slate-500">{k}</dt>
                <dd className="break-words text-slate-800">{v}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section>
          <h3 className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-wider text-slate-500">Endpoint Layanan</h3>
          <CopyField value={endpointOf(layer, date)} />
          <div className="mt-2 flex flex-wrap gap-3 text-[11.5px]">
            {restUrl && (
              <a href={restUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-navy-600 hover:underline">
                <ExternalLink size={12} /> ArcGIS REST
              </a>
            )}
            <a
              href={layer.source === 'gibs' ? 'https://nasa-gibs.github.io/gibs-api-docs/' : SERVICES.inariskPortal}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-navy-600 hover:underline"
            >
              <ExternalLink size={12} /> {layer.source === 'gibs' ? 'Dokumentasi GIBS' : 'Portal InaRISK'}
            </a>
          </div>
        </section>
      </div>
    </aside>
  );
}
