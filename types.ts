
export interface Location {
  lat: number;
  lng: number;
}

export type PlaceCategory = 'toilet' | 'atm';

export interface Place {
  id: string;
  name: string;
  location: Location;
  address?: string;
  fee?: boolean;
  wheelchair?: boolean;
  diaper?: boolean;
  housedIn?: string;
  category?: PlaceCategory;
  openingHours?: string;
  operator?: string;
  network?: string;
  brand?: string;
}

/** @deprecated Use Place instead */
export type Toilet = Place;

export interface Review {
  id: string;
  toiletId: string;
  userId: string;
  userName: string;
  userPhoto: string;
  rating: number;
  text: string;
  createdAt: number;
}

export interface ReviewUser {
  uid: string;
  displayName: string;
  photoURL: string;
  email: string;
}

export interface ConditionTag {
  id: string;       // Firestore doc ID: `${toiletId}_${tagKey}`
  toiletId: string;
  tagKey: string;
  votes: string[];  // array of userIds who voted
}

export interface Favorite {
  id: string;        // Firestore doc ID: `${userId}_${placeId}`
  userId: string;
  place: Place;
  createdAt: number;
}
