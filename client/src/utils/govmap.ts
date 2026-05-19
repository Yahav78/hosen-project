import proj4 from 'proj4';

/** Israel Transverse Mercator (EPSG:2039) — coordinate system used by GovMap */
const ITM =
    '+proj=tmerc +lat_0=31.73439361111111 +lon_0=35.20451694444445 +k=1.0000067 +x_0=219529.584 +y_0=626907.39 +ellps=GRS80 +towgs84=23.772,17.49,17.31,-1.437,0.12,-2.192,6.18 +units=m +no_defs';

/** Emergency facilities layer from GovMap embed (מקלטים + מרכזים רפואיים) */
export const GOVMAP_LAYER_EMERGENCY = '226453';

/** Default center in ITM when GPS is unavailable */
const DEFAULT_ITM = { x: 159033.76, y: 620248.06 };

/** Default zoom — street/neighborhood level (matches GovMap embed) */
export const GOVMAP_DEFAULT_ZOOM = 11;

export function wgs84ToItm(lat: number, lng: number): { x: number; y: number } {
    const [x, y] = proj4('EPSG:4326', ITM, [lng, lat]);
    return { x: Math.round(x * 100) / 100, y: Math.round(y * 100) / 100 };
}

export interface GovMapEmbedOptions {
    lat?: number;
    lng?: number;
    zoom?: number;
}

/**
 * Builds a GovMap embed URL (iframe src).
 * @see https://api.govmap.gov.il/docs/intro/html
 */
export function buildGovMapEmbedUrl(options: GovMapEmbedOptions = {}): string {
    let cx = DEFAULT_ITM.x;
    let cy = DEFAULT_ITM.y;
    if (typeof options.lat === 'number' && typeof options.lng === 'number') {
        const itm = wgs84ToItm(options.lat, options.lng);
        cx = itm.x;
        cy = itm.y;
    }

    const params = new URLSearchParams({
        c: `${cx},${cy}`,
        bb: '1',
        zb: '1',
        rb: '1',
        z: String(options.zoom ?? GOVMAP_DEFAULT_ZOOM),
        lay: GOVMAP_LAYER_EMERGENCY,
        in: '1'
    });

    return `https://www.govmap.gov.il?${params.toString()}`;
}

/** Rounds GPS so iframe URL does not reload on every watchPosition tick */
export function roundCoords(coords: { lat: number; lng: number }): { lat: number; lng: number } {
    return {
        lat: Math.round(coords.lat * 1000) / 1000,
        lng: Math.round(coords.lng * 1000) / 1000
    };
}

/** Haversine distance in km */
export function distanceKm(
    a: { lat: number; lng: number },
    b: { lat: number; lng: number }
): number {
    const R = 6371;
    const dLat = ((b.lat - a.lat) * Math.PI) / 180;
    const dLng = ((b.lng - a.lng) * Math.PI) / 180;
    const lat1 = (a.lat * Math.PI) / 180;
    const lat2 = (b.lat * Math.PI) / 180;
    const h =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}
