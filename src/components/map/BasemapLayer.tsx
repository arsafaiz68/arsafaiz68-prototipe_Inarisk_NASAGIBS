import { TileLayer } from 'react-leaflet';
import { BASEMAPS } from '@/config/basemaps';
import { PANES } from '@/config/layers';
import { useMapStore } from '@/store/useMapStore';

/**
 * Basemap selalu dirender pada pane khusus dengan z-index terendah,
 * sehingga pergantian basemap tidak memengaruhi urutan layer tematik,
 * posisi, maupun zoom peta.
 */
export function BasemapLayer() {
  const id = useMapStore((s) => s.basemap);
  const bm = BASEMAPS.find((b) => b.id === id) ?? BASEMAPS[0];
  return (
    <TileLayer
      key={bm.id}
      pane={PANES.basemap.name}
      url={bm.url}
      attribution={bm.attribution}
      subdomains={bm.subdomains ?? 'abc'}
      maxZoom={bm.maxZoom}
      maxNativeZoom={bm.maxNativeZoom}
      crossOrigin
    />
  );
}
