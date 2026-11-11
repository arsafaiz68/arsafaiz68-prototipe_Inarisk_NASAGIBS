# WebGIS Monitoring Kebencanaan Indonesia

Integrasi citra satelit **NASA GIBS** dan data spasial **InaRISK BNPB** dalam satu peta interaktif.

Stack: React 18 + Vite + TypeScript · Leaflet / React Leaflet · Esri Leaflet · Tailwind CSS · Zustand · date-fns · Recharts · Lucide.

## Menjalankan

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # build produksi ke dist/
npm run preview
```

## Fitur

- **Basemap**: OpenStreetMap & Esri Satellite, dengan thumbnail dan indikator aktif. Basemap berada di pane paling bawah, dan menggantinya tidak mengubah posisi, zoom, atau layer lain.
- **NASA GIBS** (WMTS EPSG:3857, satu layer lewat WMS): True Color MODIS Terra & VIIRS NOAA-20, False Color 7-2-1, Hotspot MODIS, Genangan Banjir 2 hari, Curah Hujan IMERG, NDVI 8 hari, Suhu Permukaan Darat, Aerosol (AOD).
- **Tanggal data**: navigasi hari, date picker, preset, slider 60 hari, animasi time-lapse, dan tombol "Terbaru tersedia". Ketersediaan tanggal per layer dibaca dari WMTS *DescribeDomains* GIBS.
- **InaRISK BNPB**: 12 indeks bahaya, 12 indeks risiko, dan indeks kapasitas (ArcGIS ImageServer/MapServer).
- **Identifikasi klik**: membaca nilai indeks 0–1 dari semua layer InaRISK yang aktif lewat `ImageServer/identify`, lalu mengelaskannya menjadi Rendah/Sedang/Tinggi.
- **Kejadian Bencana Mingguan BNPB**: poligon per kabupaten (FeatureServer) dengan popup detail, ringkasan korban, grafik per jenis bencana, dan daftar kejadian yang bisa diklik untuk *fly-to*.
- **Batas administrasi** provinsi dan kabupaten (MapServer BNPB).
- **Panel info layer**: deskripsi, legenda, metadata, ketersediaan temporal, dan endpoint yang bisa disalin.
- **Status bar**: koordinat kursor dalam EPSG:4326 (desimal & DMS) dan EPSG:3857, zoom, serta skala.
- **State lewat URL** (untuk berbagi tampilan):
  `?basemap=esri-satellite&date=2026-11-09&layers=gibs-modis-terra-truecolor,inarisk-bahaya-banjir`

## Struktur

```
src/
  config/       services.ts (endpoint), basemaps.ts, layers.ts (katalog layer & pane)
  services/     gibs.ts (URL & DescribeDomains), inarisk.ts (identify), events.ts (query kejadian)
  store/        useMapStore.ts (Zustand)
  hooks/        useGibsAvailability.ts
  components/
    map/        MapView, BasemapLayer, GibsTileLayer, ArcgisRasterLayer, EventsFeatureLayer,
                MapEventsHandler (koordinat & identify), MapControls
    sidebar/    Sidebar, LayerPanel, LayerItem, BasemapSwitcher, Legend, EventsPanel
    panels/     DatePanel, LayerInfoPanel
    layout/     Header, StatusBar
```

Untuk menambah layer, cukup menambahkan entri di `src/config/layers.ts`. Komponen UI tidak perlu diubah.

## Catatan sumber data

| Sumber | Endpoint |
|---|---|
| NASA GIBS WMTS | `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/{Layer}/default/{Date}/{TileMatrixSet}/{z}/{y}/{x}.{ext}` |
| NASA GIBS WMS | `https://gibs.earthdata.nasa.gov/wms/epsg3857/best/wms.cgi` |
| InaRISK / BNPB | `https://gis.bnpb.go.id/server/rest/services/inarisk/...` |

- Endpoint InaRISK yang lama (`inarisk1.bnpb.go.id:6443/arcgis/...`) sudah tidak bisa dijangkau. Aplikasi memakai endpoint yang digunakan portal InaRISK saat ini (dari `inarisk.bnpb.go.id/v4/config/arcgis-layers.json`).
- Server BNPB (di belakang Cloudflare) menolak browser *headless* otomatis. Browser biasa tidak terpengaruh.
- Tanggal GIBS menggunakan UTC. Data hari ini sering belum lengkap, jadi tanggal default adalah kemarin.
