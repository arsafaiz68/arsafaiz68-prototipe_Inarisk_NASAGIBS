import { useState } from 'react';
import type { LegendSpec } from '@/config/layers';

export function Legend({ spec }: { spec?: LegendSpec }) {
  const [imgError, setImgError] = useState(false);
  if (!spec) return null;

  if (spec.kind === 'image') {
    if (imgError) return <p className="text-[11px] text-slate-400">Legenda tidak tersedia.</p>;
    return (
      <div className="rounded border border-slate-200 bg-white p-1.5">
        <img
          src={spec.url}
          alt="Legenda"
          loading="lazy"
          className="h-auto w-full"
          onError={() => setImgError(true)}
        />
      </div>
    );
  }

  if (spec.kind === 'classes') {
    return (
      <ul className="space-y-1">
        {spec.items.map((it) => (
          <li key={it.label} className="flex items-center gap-2 text-[11px] text-slate-600">
            <span className="h-3 w-3 shrink-0 rounded-full ring-1 ring-black/10" style={{ background: it.color }} />
            {it.label}
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div>
      <div
        className="h-2.5 w-full rounded-sm ring-1 ring-black/10"
        style={{ background: `linear-gradient(to right, ${spec.colors.join(',')})` }}
      />
      <div className="mt-1 flex justify-between text-[10px] text-slate-500">
        <span>{spec.min}</span>
        {spec.unit && <span className="italic">{spec.unit}</span>}
        <span>{spec.max}</span>
      </div>
    </div>
  );
}
