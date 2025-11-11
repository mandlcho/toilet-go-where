
export interface Location {
  lat: number;
  lng: number;
}

export interface Toilet {
  id: string;
  name: string;
  location: Location;
  address?: string;
  fee?: boolean;
  wheelchair?: boolean;
  diaper?: boolean;
  housedIn?: string;
}
