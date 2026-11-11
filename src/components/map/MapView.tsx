import { MapContainer, Pane } from 'react-leaflet';
import { ALL_LAYERS, PANES, type BnpbFeatureLayer, type GibsLayer, type InariskLayer } from '@/config/layers';
import { DEFAULT_ZOOM, INDONESIA_CENTER, MAX_ZOOM, MIN_ZOOM } from '@/config/services';
import { useMapStore } from '@/store/useMapStore';
import { ArcgisRasterLayer } from './ArcgisRasterLayer';
import { BasemapLayer } from './BasemapLayer';
import { EventsFeatureLayer } from './EventsFeatureLayer';
import { GibsTileLayer } from './GibsTileLayer';
import { MapControls } from './MapControls';
import { MapEventsHandler } from './MapEventsHandler';

/**
 * Peta utama (CRS tampilan EPSG:3857).
 * Urutan pane dari bawah ke atas: basemap → NASA GIBS → InaRISK → data operasional BNPB.
 */
export function MapView() {
  const layers = useMapStore((s) => s.layers);

  const gibs = ALL_LAYERS.filter((l): l is GibsLayer => l.source === 'gibs' && layers[l.id].visible);
  const inarisk = ALL_LAYERS.filter((l): l is InariskLayer => l.source === 'inarisk' && layers[l.id].visible);
  const bnpb = ALL_LAYERS.filter((l): l is BnpbFeatureLayer => l.source === 'bnpb' && layers[l.id].visible);

  return (
    <MapContainer
      center={INDONESIA_CENTER}
      zoom={DEFAULT_ZOOM}
      minZoom={MIN_ZOOM}
      maxZoom={MAX_ZOOM}
      zoomControl={false}
      worldCopyJump
      className="h-full w-full"
    >
      {Object.values(PANES).map((p) => (
        <Pane key={p.name} name={p.name} style={{ zIndex: p.zIndex }} />
      ))}

      <BasemapLayer />

      {/* Layer GIBS citra (jpg) di bawah layer GIBS tematik (png) */}
      {gibs.map((l) => (
        <GibsTileLayer key={l.id} layer={l} order={l.format === 'jpg' ? 0 : 5 + (l.protocol === 'wms' ? 5 : 0)} />
      ))}
      {inarisk.map((l) => (
        <ArcgisRasterLayer key={l.id} layer={l} />
      ))}
      {bnpb.map((l) =>
        l.serviceType === 'FeatureServer' ? (
          <EventsFeatureLayer key={l.id} layer={l} />
        ) : (
          <ArcgisRasterLayer key={l.id} layer={l} />
        ),
      )}

      <MapEventsHandler />
      <MapControls />
    </MapContainer>
  );
}
