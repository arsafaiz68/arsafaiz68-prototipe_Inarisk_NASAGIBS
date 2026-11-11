import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import * as esri from 'esri-leaflet';
import { PANES, type BnpbFeatureLayer, type InariskLayer } from '@/config/layers';
import { useMapStore } from '@/store/useMapStore';

interface Props {
  layer: InariskLayer | BnpbFeatureLayer;
}

const BNPB_ATTRIBUTION =
  'Data: <a href="https://inarisk.bnpb.go.id" target="_blank" rel="noreferrer">InaRISK BNPB</a>';

/**
 * Layer raster ArcGIS REST (ImageServer → imageMapLayer, MapServer → dynamicMapLayer)
 * melalui Esri Leaflet. Gambar diminta ulang (exportImage/export) setiap pergerakan peta.
 */
export function ArcgisRasterLayer({ layer }: Props) {
  const map = useMap();
  const opacity = useMapStore((s) => s.layers[layer.id].opacity);
  const setStatus = useMapStore((s) => s.setStatus);
  const ref = useRef<esri.RasterLayer | null>(null);

  useEffect(() => {
    const pane = layer.source === 'inarisk' ? PANES.inarisk.name : PANES.bnpb.name;
    const base = { url: layer.url, pane, opacity, attribution: BNPB_ATTRIBUTION, format: 'png32' };
    const lyr =
      layer.serviceType === 'ImageServer'
        ? esri.imageMapLayer({ ...base, format: 'png' })
        : esri.dynamicMapLayer({
            ...base,
            transparent: true,
            layers: 'sublayers' in layer ? layer.sublayers : undefined,
          });

    lyr.on('loading', () => setStatus(layer.id, 'loading'));
    lyr.on('load', () => setStatus(layer.id, 'ready'));
    lyr.on('requesterror', () => setStatus(layer.id, 'error'));
    lyr.addTo(map);
    ref.current = lyr;
    return () => {
      lyr.off();
      map.removeLayer(lyr);
      ref.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, layer]);

  useEffect(() => {
    ref.current?.setOpacity(opacity);
  }, [opacity]);

  return null;
}
