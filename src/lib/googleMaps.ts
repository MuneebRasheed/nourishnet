/**
 * Google Places Autocomplete + Geocoding (HTTP).
 * Set EXPO_PUBLIC_GOOGLE_MAPS_API_KEY in .env (restrict the key in Google Cloud Console).
 */

const apiKey = (): string => (process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? '').trim();

export type PlacePrediction = {
  description: string;
  place_id: string;
};

export type ResolvedPlace = {
  address: string;
  lat: number;
  lng: number;
};

export function isGoogleMapsConfigured(): boolean {
  return apiKey().length > 0;
}

export async function fetchPlacePredictions(input: string): Promise<PlacePrediction[]> {
  const key = apiKey();
  const q = input.trim();
  if (!key || q.length < 2) return [];

  const url =
    'https://maps.googleapis.com/maps/api/place/autocomplete/json?' +
    new URLSearchParams({
      input: q,
      key,
      language: 'en',
      types: 'geocode',
    }).toString();

  const res = await fetch(url);
  const data = (await res.json()) as {
    status: string;
    predictions?: { description: string; place_id: string }[];
    error_message?: string;
  };

  if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
    if (__DEV__ && data.error_message) {
      console.warn('[googleMaps] autocomplete', data.status, data.error_message);
    }
    return [];
  }

  return (data.predictions ?? []).map((p) => ({
    description: p.description,
    place_id: p.place_id,
  }));
}

export async function fetchPlaceDetails(placeId: string): Promise<ResolvedPlace | null> {
  const key = apiKey();
  if (!key) return null;

  const url =
    'https://maps.googleapis.com/maps/api/place/details/json?' +
    new URLSearchParams({
      place_id: placeId,
      key,
      fields: 'formatted_address,geometry/location,name',
      language: 'en',
    }).toString();

  const res = await fetch(url);
  const data = (await res.json()) as {
    status: string;
    result?: {
      formatted_address?: string;
      name?: string;
      geometry?: { location?: { lat: number; lng: number } };
    };
    error_message?: string;
  };

  if (data.status !== 'OK' || !data.result?.geometry?.location) {
    if (__DEV__ && data.error_message) {
      console.warn('[googleMaps] place details', data.status, data.error_message);
    }
    return null;
  }

  const { lat, lng } = data.result.geometry.location;
  const address =
    data.result.formatted_address ?? data.result.name ?? `${lat}, ${lng}`;
  return { address, lat, lng };
}

export async function reverseGeocode(lat: number, lng: number): Promise<ResolvedPlace | null> {
  const key = apiKey();
  if (!key) return null;

  const url =
    'https://maps.googleapis.com/maps/api/geocode/json?' +
    new URLSearchParams({
      latlng: `${lat},${lng}`,
      key,
      language: 'en',
    }).toString();

  const res = await fetch(url);
  const data = (await res.json()) as {
    status: string;
    results?: { formatted_address: string }[];
    error_message?: string;
  };

  if (data.status !== 'OK' || !data.results?.[0]?.formatted_address) {
    if (__DEV__ && data.error_message) {
      console.warn('[googleMaps] reverse geocode', data.status, data.error_message);
    }
    return null;
  }

  return {
    address: data.results[0].formatted_address,
    lat,
    lng,
  };
}
