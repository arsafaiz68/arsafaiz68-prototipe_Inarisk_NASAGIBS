import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { useMap } from 'react-leaflet';
import { PANES, type GibsLayer } from '@/config/layers';
import { SERVICES } from '@/config/services';
import { gibsTileUrl } from '@/services/gibs';
import { useMapStore } from '@/store/useMapStore';

const GIBS_ATTRIBUTION =
  'Imagery: <a href="https://earthdata.nasa.gov/gibs" target="_blank" rel="noreferrer">NASA GIBS</a> / ESDIS';

interface Props {
  layer: GibsLayer;
  order: number;
}

/**
 * Layer NASA GIBS. Instans Leaflet dibuat sekali; perubahan tanggal
 * hanya memperbarui URL/parameter TIME sehingga tidak berkedip.
 */
export function GibsTileLayer({ layer, order }: Props) {
  const map = useMap();
  const date = useMapStore((s) => s.date);
  const opacity = useMapStore((s) => s.layers[layer.id].opacity);
  const setStatus = useMapStore((s) => s.setStatus);
  const ref = useRef<L.TileLayer | null>(null);

  useEffect(() => {
    const common: L.TileLayerOptions = {
      pane: PANES.gibs.name,
      maxNativeZoom: layer.maxNativeZoom,
      maxZoom: 18,
      attribution: GIBS_ATTRIBUTION,
      opacity,
      zIndex: 10 + order,
      crossOrigin: true,
      bounds: L.latLngBounds([-85.0511, -180], [85.0511, 180]),
    };

    const tl =
      layer.protocol === 'wms'
        ? L.tileLayer.wms(SERVICES.gibsWms, {
            ...common,
            layers: layer.gibsId,
            format: 'image/png',
            transparent: true,
            version: '1.3.0',
            // @ts-expect-error parameter tambahan diteruskan ke query WMS
            TIME: date,
          })
        : L.tileLayer(gibsTileUrl(layer, date), common);

    let errors = 0;
    tl.on('loading', () => {
      errors = 0;
      setStatus(layer.id, 'loading');
    });
    tl.on('tileerror', () => {
      errors += 1;
    });
    tl.on('load', () => setStatus(layer.id, errors > 0 ? 'error' : 'ready'));

    tl.addTo(map);
    ref.current = tl;
    return () => {
      tl.off();
      map.removeLayer(tl);
      ref.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, layer]);

  useEffect(() => {
    const tl = ref.current;
    if (!tl) return;
    if (tl instanceof L.TileLayer.WMS) tl.setParams({ TIME: date } as unknown as L.WMSParams);
    else tl.setUrl(gibsTileUrl(layer, date));
  }, [date, layer]);

  useEffect(() => {
    ref.current?.setOpacity(opacity);
  }, [opacity]);

  useEffect(() => {
    ref.current?.setZIndex(10 + order);
  }, [order]);

  return null;
}
