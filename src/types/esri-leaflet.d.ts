/** Deklarasi minimal esri-leaflet 3.x yang dipakai aplikasi. */
declare module 'esri-leaflet' {
  import * as L from 'leaflet';

  interface RasterLayerOptions extends L.LayerOptions {
    url: string;
    opacity?: number;
    pane?: string;
    zIndex?: number;
    format?: string;
    f?: 'image' | 'json';
    position?: 'front' | 'back';
    attribution?: string;
  }

  export interface RasterLayer extends L.Layer {
    setOpacity(opacity: number): this;
    bringToFront(): this;
    bringToBack(): this;
    redraw(): void;
  }

  export interface ImageMapLayerOptions extends RasterLayerOptions {
    renderingRule?: Record<string, unknown>;
    mosaicRule?: Record<string, unknown>;
    bandIds?: string;
    noData?: number;
    interpolation?: string;
  }

  export interface DynamicMapLayerOptions extends RasterLayerOptions {
    layers?: number[];
    transparent?: boolean;
    dynamicLayers?: unknown[];
  }

  export interface FeatureLayerOptions extends L.GeoJSONOptions {
    url: string;
    pane?: string;
    where?: string;
    fields?: string[];
    simplifyFactor?: number;
    precision?: number;
    style?: L.PathOptions | ((feature: GeoJSON.Feature) => L.PathOptions);
  }

  export interface FeatureLayer extends L.Layer {
    setStyle(style: L.PathOptions | ((feature: GeoJSON.Feature) => L.PathOptions)): this;
  }

  export function imageMapLayer(options: ImageMapLayerOptions): RasterLayer;
  export function dynamicMapLayer(options: DynamicMapLayerOptions): RasterLayer;
  export function featureLayer(options: FeatureLayerOptions): FeatureLayer;
}
