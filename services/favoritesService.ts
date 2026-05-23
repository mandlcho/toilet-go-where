import {
  doc,
  setDoc,
  deleteDoc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { db, isConfigured } from './firebase';
import type { Favorite, Place } from '../types';

export async function addFavorite(userId: string, place: Place): Promise<void> {
  if (!db || !isConfigured) throw new Error('Firebase not configured');
  const id = `${userId}_${place.id}`;
  await setDoc(doc(db, 'favorites', id), {
    userId,
    place,
    createdAt: Date.now(),
  });
}

export async function removeFavorite(
  userId: string,
  placeId: string
): Promise<void> {
  if (!db || !isConfigured) throw new Error('Firebase not configured');
  await deleteDoc(doc(db, 'favorites', `${userId}_${placeId}`));
}

export async function isFavorited(
  userId: string,
  placeId: string
): Promise<boolean> {
  if (!db || !isConfigured) return false;
  const snap = await getDoc(doc(db, 'favorites', `${userId}_${placeId}`));
  return snap.exists();
}

export async function getFavorites(userId: string): Promise<Favorite[]> {
  if (!db || !isConfigured) return [];
  const q = query(
    collection(db, 'favorites'),
    where('userId', '==', userId)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Favorite));
}
