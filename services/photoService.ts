import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  getDocs,
} from 'firebase/firestore';
import { storage, db, isConfigured } from './firebase';
import type { Photo } from '../types';

export async function uploadPhoto(
  toiletId: string,
  userId: string,
  userName: string,
  file: File
): Promise<Photo> {
  if (!storage || !db || !isConfigured) throw new Error('Firebase not configured');
  const path = `photos/${toiletId}/${Date.now()}_${userId}`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);
  const createdAt = Date.now();
  const docRef = await addDoc(collection(db, 'photos'), {
    toiletId,
    url,
    userId,
    userName,
    createdAt,
  });
  return { id: docRef.id, toiletId, url, userId, userName, createdAt };
}

export async function getPhotos(toiletId: string): Promise<Photo[]> {
  if (!isConfigured || !db) return [];
  const q = query(
    collection(db, 'photos'),
    where('toiletId', '==', toiletId),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Photo));
}
