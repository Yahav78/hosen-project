import proj4 from 'proj4';

/** Israel Transverse Mercator (EPSG:2039) — coordinate system used by GovMap */
const ITM =
    '+proj=tmerc +lat_0=31.73439361111111 +lon_0=35.20451694444445 +k=1.0000067 +x_0=219529.584 +y_0=626907.39 +ellps=GRS80 +towgs84=23.772,17.49,17.31,-1.437,0.12,-2.192,6.18 +units=m +no_defs';

/** Public shelters layer (מקלטים ציבוריים) — numeric ID from GovMap embed */
export const GOVMAP_LAYER_SHELTERS = '417';

/** Emergency hospitals layer name from GovMap layer appendix */
export const GOVMAP_LAYER_HOSPITALS = 'Emergancy_Hospitals';

/** Default center (Tel Aviv area) in ITM when GPS is unavailable */
const DEFAULT_ITM = { x: 219143.61, y: 618345.06 };

export function wgs84ToItm(lat: number, lng: number): { x: number; y: number } {
    const [x, y] = proj4('EPSG:4326', ITM, [lng, lat]);
    return { x: Math.round(x * 100) / 100, y: Math.round(y * 100) / 100 };
}

export interface GovMapEmbedOptions {
    lat?: number;
    lng?: number;
    layers?: string[];
    zoom?: number;
}

/**
 * Builds a GovMap embed URL (iframe src) with optional layers and center.
 * @see https://api.govmap.gov.il/docs/intro/html
 */
export function buildGovMapEmbedUrl(options: GovMapEmbedOptions = {}): string {
    const layers = options.layers?.length
        ? options.layers
        : [GOVMAP_LAYER_SHELTERS, GOVMAP_LAYER_HOSPITALS];

    let cx = DEFAULT_ITM.x;
    let cy = DEFAULT_ITM.y;
    if (typeof options.lat === 'number' && typeof options.lng === 'number') {
        const itm = wgs84ToItm(options.lat, options.lng);
        cx = itm.x;
        cy = itm.y;
    }

    const params = new URLSearchParams({
        lay: layers.join(','),
        c: `${cx},${cy}`,
        bb: '1',
        zb: '1',
        rb: '1',
        in: '1'
    });

    if (options.zoom != null) {
        params.set('z', String(options.zoom));
    }

    return `https://www.govmap.gov.il?${params.toString()}`;
}
