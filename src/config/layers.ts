import { SERVICES } from './services';

/* ------------------------------------------------------------------ */
/* Tipe                                                                */
/* ------------------------------------------------------------------ */

export type LayerSource = 'gibs' | 'inarisk' | 'bnpb';

export type LegendSpec =
  | { kind: 'image'; url: string }
  | { kind: 'classes'; items: { label: string; color: string }[] }
  | { kind: 'gradient'; colors: string[]; min: string; max: string; unit?: string };

interface BaseLayer {
  id: string;
  title: string;
  group: string;
  source: LayerSource;
  description: string;
  defaultOpacity: number;
  legend?: LegendSpec;
  metadata: Record<string, string>;
}

export interface GibsLayer extends BaseLayer {
  source: 'gibs';
  gibsId: string;
  /** 'wmts' untuk ubin raster, 'wms' untuk layer vektor yang dirender server. */
  protocol: 'wmts' | 'wms';
  tileMatrixSet: string;
  format: 'jpg' | 'png';
  maxNativeZoom: number;
}

export interface InariskLayer extends BaseLayer {
  source: 'inarisk';
  serviceType: 'ImageServer' | 'MapServer';
  url: string;
  /** Indeks 0–1 yang dikelaskan oleh InaRISK menjadi Rendah/Sedang/Tinggi. */
  indexType: 'bahaya' | 'risiko' | 'kapasitas';
}

export interface BnpbFeatureLayer extends BaseLayer {
  source: 'bnpb';
  serviceType: 'FeatureServer' | 'MapServer';
  url: string;
  /** Untuk MapServer dinamis: sublayer yang ditampilkan. */
  sublayers?: number[];
}

export type LayerConfig = GibsLayer | InariskLayer | BnpbFeatureLayer;

/* ------------------------------------------------------------------ */
/* NASA GIBS                                                           */
/* ------------------------------------------------------------------ */

const GIBS_COMMON = {
  source: 'gibs' as const,
  'Penyedia': 'NASA ESDIS — Global Imagery Browse Services',
};

const gibs = (l: Omit<GibsLayer, 'source' | 'metadata'> & { metadata: Record<string, string> }): GibsLayer => ({
  ...l,
  source: 'gibs',
  metadata: {
    'Identifier GIBS': l.gibsId,
    'Tile Matrix Set': l.tileMatrixSet,
    'Protokol': l.protocol.toUpperCase(),
    'Proyeksi': 'EPSG:3857 (Web Mercator)',
    'Penyedia': GIBS_COMMON['Penyedia'],
    ...l.metadata,
  },
});

export const GIBS_LAYERS: GibsLayer[] = [
  gibs({
    id: 'gibs-modis-terra-truecolor',
    gibsId: 'MODIS_Terra_CorrectedReflectance_TrueColor',
    title: 'True Color — MODIS Terra',
    group: 'Citra Satelit Harian',
    description:
      'Citra warna alami (Corrected Reflectance, kanal 1-4-3) dari sensor MODIS satelit Terra. Berguna untuk mengamati tutupan awan, asap kebakaran, sedimen banjir, dan abu vulkanik.',
    protocol: 'wmts',
    tileMatrixSet: 'GoogleMapsCompatible_Level9',
    format: 'jpg',
    maxNativeZoom: 9,
    defaultOpacity: 1,
    metadata: { 'Sensor / Satelit': 'MODIS / Terra', 'Resolusi': '250 m', 'Periode': 'Harian' },
  }),
  gibs({
    id: 'gibs-viirs-noaa20-truecolor',
    gibsId: 'VIIRS_NOAA20_CorrectedReflectance_TrueColor',
    title: 'True Color — VIIRS NOAA-20',
    group: 'Citra Satelit Harian',
    description:
      'Citra warna alami dari sensor VIIRS satelit NOAA-20. Lintasan siang hari berbeda dengan Terra sehingga dapat melengkapi area yang tertutup awan.',
    protocol: 'wmts',
    tileMatrixSet: 'GoogleMapsCompatible_Level9',
    format: 'jpg',
    maxNativeZoom: 9,
    defaultOpacity: 1,
    metadata: { 'Sensor / Satelit': 'VIIRS / NOAA-20', 'Resolusi': '250 m', 'Periode': 'Harian' },
  }),
  gibs({
    id: 'gibs-modis-terra-721',
    gibsId: 'MODIS_Terra_CorrectedReflectance_Bands721',
    title: 'False Color 7-2-1 — MODIS Terra',
    group: 'Citra Satelit Harian',
    description:
      'Komposit kanal 7-2-1. Air dan genangan banjir tampak biru gelap/hitam, vegetasi hijau terang, dan bekas terbakar (burn scar) cokelat kemerahan. Cocok untuk analisis banjir dan karhutla.',
    protocol: 'wmts',
    tileMatrixSet: 'GoogleMapsCompatible_Level9',
    format: 'jpg',
    maxNativeZoom: 9,
    defaultOpacity: 1,
    metadata: { 'Sensor / Satelit': 'MODIS / Terra', 'Resolusi': '250–500 m', 'Periode': 'Harian' },
  }),
  gibs({
    id: 'gibs-thermal-anomalies',
    gibsId: 'MODIS_Combined_Thermal_Anomalies_All',
    title: 'Hotspot / Titik Panas — MODIS',
    group: 'Kebencanaan & Lingkungan',
    description:
      'Deteksi anomali termal dan titik api aktif dari MODIS Terra + Aqua. Indikator utama kebakaran hutan dan lahan (karhutla). Dirender sebagai PNG melalui layanan WMS GIBS.',
    protocol: 'wms',
    tileMatrixSet: 'GoogleMapsCompatible_Level7',
    format: 'png',
    maxNativeZoom: 7,
    defaultOpacity: 1,
    legend: { kind: 'classes', items: [{ label: 'Titik panas / api aktif', color: '#ff3b1f' }] },
    metadata: { 'Sensor / Satelit': 'MODIS / Terra + Aqua', 'Resolusi': '1 km', 'Periode': 'Harian' },
  }),
  gibs({
    id: 'gibs-flood-2day',
    gibsId: 'MODIS_Combined_Flood_2-Day',
    title: 'Genangan Banjir (2 Hari) — MODIS',
    group: 'Kebencanaan & Lingkungan',
    description:
      'Produk deteksi air permukaan/banjir global (MODIS NRT Global Flood Product) dengan jendela komposit 2 hari dari Terra + Aqua.',
    protocol: 'wmts',
    tileMatrixSet: 'GoogleMapsCompatible_Level9',
    format: 'png',
    maxNativeZoom: 9,
    defaultOpacity: 0.9,
    legend: { kind: 'image', url: 'https://gibs.earthdata.nasa.gov/legends/MODIS_Flood_H.svg' },
    metadata: { 'Sensor / Satelit': 'MODIS / Terra + Aqua', 'Resolusi': '250 m', 'Periode': 'Komposit 2 hari' },
  }),
  gibs({
    id: 'gibs-imerg-precip',
    gibsId: 'IMERG_Precipitation_Rate',
    title: 'Laju Curah Hujan — GPM IMERG',
    group: 'Kebencanaan & Lingkungan',
    description:
      'Estimasi laju curah hujan (mm/jam) dari misi Global Precipitation Measurement (GPM) algoritma IMERG. Berguna untuk memantau potensi banjir dan longsor.',
    protocol: 'wmts',
    tileMatrixSet: 'GoogleMapsCompatible_Level6',
    format: 'png',
    maxNativeZoom: 6,
    defaultOpacity: 0.75,
    legend: { kind: 'image', url: 'https://gibs.earthdata.nasa.gov/legends/GPM_Precipitation_Rate_H.svg' },
    metadata: { 'Sensor / Satelit': 'GPM Constellation', 'Resolusi': '0,1° (~10 km)', 'Periode': 'Harian' },
  }),
  gibs({
    id: 'gibs-modis-ndvi',
    gibsId: 'MODIS_Terra_NDVI_8Day',
    title: 'Indeks Vegetasi NDVI (8 Hari)',
    group: 'Kebencanaan & Lingkungan',
    description:
      'Normalized Difference Vegetation Index komposit 8 hari bergulir. Menunjukkan kerapatan & kesehatan vegetasi — indikator kekeringan dan degradasi lahan.',
    protocol: 'wmts',
    tileMatrixSet: 'GoogleMapsCompatible_Level9',
    format: 'png',
    maxNativeZoom: 9,
    defaultOpacity: 0.8,
    legend: { kind: 'image', url: 'https://gibs.earthdata.nasa.gov/legends/MODIS_NDVI_H.svg' },
    metadata: { 'Sensor / Satelit': 'MODIS / Terra', 'Resolusi': '250 m', 'Periode': 'Komposit 8 hari bergulir' },
  }),
  gibs({
    id: 'gibs-modis-lst-day',
    gibsId: 'MODIS_Terra_Land_Surface_Temp_Day',
    title: 'Suhu Permukaan Darat (Siang)',
    group: 'Kebencanaan & Lingkungan',
    description:
      'Land Surface Temperature siang hari dari MODIS Terra. Mendukung analisis kekeringan, urban heat island, dan potensi kebakaran.',
    protocol: 'wmts',
    tileMatrixSet: 'GoogleMapsCompatible_Level7',
    format: 'png',
    maxNativeZoom: 7,
    defaultOpacity: 0.8,
    legend: { kind: 'image', url: 'https://gibs.earthdata.nasa.gov/legends/MODIS_Land_Surface_Temp_H.svg' },
    metadata: { 'Sensor / Satelit': 'MODIS / Terra', 'Resolusi': '1 km', 'Periode': 'Harian' },
  }),
  gibs({
    id: 'gibs-modis-aod',
    gibsId: 'MODIS_Terra_Aerosol',
    title: 'Aerosol Optical Depth (Asap/Kabut)',
    group: 'Kebencanaan & Lingkungan',
    description:
      'Ketebalan optik aerosol (Dark Target) dari MODIS Terra. Nilai tinggi mengindikasikan asap kebakaran, kabut asap, atau abu vulkanik.',
    protocol: 'wmts',
    tileMatrixSet: 'GoogleMapsCompatible_Level6',
    format: 'png',
    maxNativeZoom: 6,
    defaultOpacity: 0.75,
    legend: { kind: 'image', url: 'https://gibs.earthdata.nasa.gov/legends/MODIS_VIIRS_AOD_H.svg' },
    metadata: { 'Sensor / Satelit': 'MODIS / Terra', 'Resolusi': '10 km', 'Periode': 'Harian' },
  }),
];

/* ------------------------------------------------------------------ */
/* InaRISK BNPB                                                        */
/* ------------------------------------------------------------------ */

export const INARISK_CLASSES = [
  { label: 'Rendah', color: '#38a800', min: 0, max: 0.333 },
  { label: 'Sedang', color: '#ffd400', min: 0.333, max: 0.666 },
  { label: 'Tinggi', color: '#e60000', min: 0.666, max: 1.0001 },
];

const INARISK_LEGEND: LegendSpec = {
  kind: 'gradient',
  colors: ['#38a800', '#b0e000', '#ffff00', '#ffaa00', '#ff0000'],
  min: 'Rendah (0)',
  max: 'Tinggi (1)',
  unit: 'indeks',
};

const HAZARDS: { key: string; name: string; service?: string; type?: 'ImageServer' | 'MapServer'; risk?: boolean }[] = [
  { key: 'banjir', name: 'Banjir', risk: true },
  { key: 'banjir_bandang', name: 'Banjir Bandang', risk: true },
  { key: 'tanah_longsor', name: 'Tanah Longsor', risk: true },
  { key: 'gempabumi', name: 'Gempabumi', service: 'layer_bahaya_gempabumi_30', type: 'MapServer', risk: true },
  { key: 'tsunami', name: 'Tsunami', risk: true },
  { key: 'letusan_gunungapi', name: 'Letusan Gunungapi', risk: true },
  { key: 'likuefaksi', name: 'Likuefaksi', risk: true },
  { key: 'kebakaran_hutan_dan_lahan', name: 'Kebakaran Hutan & Lahan', risk: true },
  { key: 'kekeringan', name: 'Kekeringan', risk: true },
  { key: 'cuaca_ekstrim', name: 'Cuaca Ekstrem', risk: true },
  { key: 'gelombang_ekstrim_dan_abrasi', name: 'Gelombang Ekstrem & Abrasi', risk: true },
  { key: 'multi', name: 'Multi Bahaya', risk: true },
];

const inarisk = (
  kind: 'bahaya' | 'risiko',
  h: (typeof HAZARDS)[number],
): InariskLayer => {
  const serviceName = kind === 'bahaya' && h.service ? h.service : `layer_${kind}_${h.key}`;
  const serviceType = kind === 'bahaya' && h.type ? h.type : 'ImageServer';
  const label = kind === 'bahaya' ? 'Bahaya' : 'Risiko';
  return {
    id: `inarisk-${kind}-${h.key}`,
    title: `${label} ${h.name}`,
    group: kind === 'bahaya' ? 'InaRISK — Indeks Bahaya' : 'InaRISK — Indeks Risiko',
    source: 'inarisk',
    serviceType,
    indexType: kind,
    url: `${SERVICES.bnpbRest}/inarisk/${serviceName}/${serviceType}`,
    defaultOpacity: 0.7,
    legend: INARISK_LEGEND,
    description:
      kind === 'bahaya'
        ? `Indeks bahaya ${h.name.toLowerCase()} (0–1) hasil kajian BNPB. Menggambarkan potensi intensitas/besaran ancaman ${h.name.toLowerCase()} pada suatu lokasi, diklasifikasikan menjadi Rendah, Sedang, dan Tinggi.`
        : `Indeks risiko ${h.name.toLowerCase()} (0–1) hasil kajian BNPB — fungsi dari bahaya, kerentanan, dan kapasitas. Menunjukkan potensi kerugian akibat ${h.name.toLowerCase()}.`,
    metadata: {
      'Layanan': `${serviceName} (${serviceType})`,
      'Penyedia': 'Badan Nasional Penanggulangan Bencana (BNPB) — InaRISK',
      'Tipe Data': serviceType === 'ImageServer' ? 'Raster Float32, 1 band (indeks 0–1)' : 'Peta dinamis ArcGIS',
      'Proyeksi Sumber': 'EPSG:3395 (World Mercator)',
      'Klasifikasi': 'Rendah < 0,333 ≤ Sedang < 0,666 ≤ Tinggi',
    },
  };
};

export const INARISK_LAYERS: InariskLayer[] = [
  ...HAZARDS.map((h) => inarisk('bahaya', h)),
  ...HAZARDS.filter((h) => h.risk).map((h) => inarisk('risiko', h)),
  {
    id: 'inarisk-kapasitas',
    title: 'Indeks Kapasitas Daerah',
    group: 'InaRISK — Indeks Risiko',
    source: 'inarisk',
    serviceType: 'ImageServer',
    indexType: 'kapasitas',
    url: `${SERVICES.bnpbRest}/inarisk/layer_peta_kapasitas/ImageServer`,
    defaultOpacity: 0.7,
    legend: INARISK_LEGEND,
    description:
      'Indeks kapasitas daerah dalam penanggulangan bencana (kelembagaan, peringatan dini, pendidikan, mitigasi, kesiapsiagaan). Nilai tinggi = kapasitas lebih baik.',
    metadata: {
      'Layanan': 'layer_peta_kapasitas (ImageServer)',
      'Penyedia': 'Badan Nasional Penanggulangan Bencana (BNPB) — InaRISK',
      'Tipe Data': 'Raster Float32, 1 band (indeks 0–1)',
    },
  },
];

/* ------------------------------------------------------------------ */
/* Data operasional BNPB                                               */
/* ------------------------------------------------------------------ */

export const EVENTS_LAYER_ID = 'bnpb-kejadian-mingguan';

export const BNPB_LAYERS: BnpbFeatureLayer[] = [
  {
    id: EVENTS_LAYER_ID,
    title: 'Kejadian Bencana Mingguan',
    group: 'Data Operasional BNPB',
    source: 'bnpb',
    serviceType: 'FeatureServer',
    url: `${SERVICES.bnpbRest}/Kejadian_Bencana_Mingguan/FeatureServer/25`,
    defaultOpacity: 0.75,
    description:
      'Rekap kejadian bencana per kabupaten/kota pada minggu berjalan yang diperbarui BNPB, berisi jenis bencana, korban, pengungsi, kerusakan, kronologis dan kondisi mutakhir. Klik poligon untuk detail.',
    metadata: {
      'Layanan': 'Kejadian_Bencana_Mingguan (FeatureServer/25)',
      'Penyedia': 'Pusdatinkom BNPB',
      'Geometri': 'Poligon kabupaten/kota',
      'Pembaruan': 'Mingguan',
    },
  },
  {
    id: 'bnpb-batas-admin',
    title: 'Batas Administrasi',
    group: 'Data Operasional BNPB',
    source: 'bnpb',
    serviceType: 'MapServer',
    url: `${SERVICES.bnpbRest}/Basemap/batas_administrasi/MapServer`,
    sublayers: [1, 2],
    defaultOpacity: 0.9,
    description: 'Batas provinsi dan kabupaten/kota (layanan peta dinamis BNPB). Batas kecamatan & desa tersedia pada skala besar.',
    metadata: {
      'Layanan': 'Basemap/batas_administrasi (MapServer)',
      'Penyedia': 'BNPB',
      'Sublayer': 'Batas Provinsi, Batas Kabupaten',
    },
  },
];

export const ALL_LAYERS: LayerConfig[] = [...GIBS_LAYERS, ...INARISK_LAYERS, ...BNPB_LAYERS];

export const LAYER_INDEX: Record<string, LayerConfig> = Object.fromEntries(
  ALL_LAYERS.map((l) => [l.id, l]),
);

/** Kelompok layer dalam urutan tampil di sidebar. */
export const LAYER_GROUPS: { title: string; source: LayerSource; layers: LayerConfig[] }[] = (() => {
  const groups = new Map<string, { title: string; source: LayerSource; layers: LayerConfig[] }>();
  for (const l of ALL_LAYERS) {
    if (!groups.has(l.group)) groups.set(l.group, { title: l.group, source: l.source, layers: [] });
    groups.get(l.group)!.layers.push(l);
  }
  return [...groups.values()];
})();

/** z-index pane per sumber — basemap selalu paling bawah. */
export const PANES = {
  basemap: { name: 'basemap-pane', zIndex: 150 },
  gibs: { name: 'gibs-pane', zIndex: 300 },
  inarisk: { name: 'inarisk-pane', zIndex: 350 },
  bnpb: { name: 'bnpb-pane', zIndex: 420 },
} as const;
