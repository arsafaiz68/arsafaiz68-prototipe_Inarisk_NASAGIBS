import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { useMap } from 'react-leaflet';
import * as esri from 'esri-leaflet';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { PANES, type BnpbFeatureLayer } from '@/config/layers';
import { categoryColor, toEvent, type DisasterEvent } from '@/services/events';
import { useMapStore } from '@/store/useMapStore';
import { escapeHtml, fmtNum } from '@/utils/geo';

/** Penanda bahwa klik sudah ditangani poligon kejadian (agar identify raster tidak ikut muncul). */
export const FEATURE_CLICK_FLAG = '__bnpbFeatureClick';

export function eventPopupHtml(ev: DisasterEvent): string {
  const color = categoryColor(ev.kategori);
  const tanggal = ev.date ? format(new Date(ev.date), 'EEEE, d MMMM yyyy', { locale: localeId }) : '-';
  const stat = (label: string, v: number) =>
    `<div class="ev-stat"><span>${label}</span><b>${fmtNum(v)}</b></div>`;
  const block = (title: string, text: string) =>
    text ? `<div class="ev-block"><div class="ev-block-title">${title}</div><p>${escapeHtml(text).replace(/\n/g, '<br/>')}</p></div>` : '';
  return `
    <div class="ev-popup">
      <div class="ev-head" style="border-left-color:${color}">
        <span class="ev-badge" style="background:${color}">${escapeHtml(ev.kategori || 'Bencana')}</span>
        <div class="ev-title">${escapeHtml(ev.kabupaten)}</div>
        <div class="ev-date">${tanggal} · Minggu ke-${ev.minggu} ${ev.tahun}</div>
      </div>
      <div class="ev-stats">
        ${stat('Kejadian', ev.jumlah)}${stat('Meninggal', ev.meninggal)}${stat('Hilang', ev.hilang)}
        ${stat('Luka/Sakit', ev.lukaSakit)}${stat('Mengungsi', ev.mengungsi)}${stat('Rumah Rusak', ev.rumahRusak)}
      </div>
      ${ev.rumahTerendam ? `<div class="ev-note">Rumah terendam: <b>${fmtNum(ev.rumahTerendam)}</b></div>` : ''}
      ${block('Kronologis', ev.kronologis)}
      ${block('Kondisi Mutakhir', ev.kondisi)}
      ${block('Upaya Penanganan', ev.upaya)}
      <div class="ev-src">Sumber: BNPB — Kejadian Bencana Mingguan</div>
    </div>`;
}

export function EventsFeatureLayer({ layer }: { layer: BnpbFeatureLayer }) {
  const map = useMap();
  const opacity = useMapStore((s) => s.layers[layer.id].opacity);
  const setStatus = useMapStore((s) => s.setStatus);
  const ref = useRef<esri.FeatureLayer | null>(null);

  useEffect(() => {
    const style = (f: GeoJSON.Feature): L.PathOptions => {
      const c = categoryColor(String(f.properties?.kategori_bencana ?? ''));
      return { color: c, weight: 2, fillColor: c, fillOpacity: opacity * 0.6, opacity: Math.min(1, opacity + 0.2) };
    };
    const fl = esri.featureLayer({ url: layer.url, pane: PANES.bnpb.name, simplifyFactor: 0.35, precision: 5, style });

    fl.bindPopup((l) => {
      const feature = (l as L.Layer & { feature?: GeoJSON.Feature }).feature;
      return eventPopupHtml(toEvent((feature?.properties ?? {}) as Record<string, unknown>));
    }, {
      maxWidth: 340,
      className: 'event-popup',
    });
    fl.on('click', (e) => {
      const oe = (e as L.LeafletMouseEvent).originalEvent as unknown as Record<string, boolean>;
      if (oe) oe[FEATURE_CLICK_FLAG] = true;
    });
    fl.on('mouseover', (e) => (e as unknown as { layer: L.Path }).layer.setStyle({ weight: 3.5 }));
    fl.on('mouseout', (e) => (e as unknown as { layer: L.Path }).layer.setStyle({ weight: 2 }));
    fl.on('loading', () => setStatus(layer.id, 'loading'));
    fl.on('load', () => setStatus(layer.id, 'ready'));
    fl.on('requesterror', () => setStatus(layer.id, 'error'));

    fl.addTo(map);
    ref.current = fl;
    return () => {
      fl.off();
      map.removeLayer(fl);
      ref.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, layer]);

  useEffect(() => {
    ref.current?.setStyle((f: GeoJSON.Feature) => {
      const c = categoryColor(String(f.properties?.kategori_bencana ?? ''));
      return { color: c, weight: 2, fillColor: c, fillOpacity: opacity * 0.6, opacity: Math.min(1, opacity + 0.2) };
    });
  }, [opacity]);

  return null;
}
