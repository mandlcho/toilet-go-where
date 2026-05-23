export interface ShareParams {
  id: string;
  lat: number;
  lng: number;
}

export function encodeShareUrl(params: ShareParams): string {
  const url = new URL(window.location.href);
  url.searchParams.set('id', params.id);
  url.searchParams.set('lat', params.lat.toFixed(6));
  url.searchParams.set('lng', params.lng.toFixed(6));
  return url.toString();
}

export function decodeShareParams(): ShareParams | null {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  const lat = params.get('lat');
  const lng = params.get('lng');
  if (!id || !lat || !lng) return null;
  const latNum = parseFloat(lat);
  const lngNum = parseFloat(lng);
  if (isNaN(latNum) || isNaN(lngNum)) return null;
  return { id, lat: latNum, lng: lngNum };
}

export function clearShareParams(): void {
  const url = new URL(window.location.href);
  url.searchParams.delete('id');
  url.searchParams.delete('lat');
  url.searchParams.delete('lng');
  window.history.replaceState({}, '', url.toString());
}
