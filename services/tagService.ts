import {
  doc,
  setDoc,
  arrayUnion,
  arrayRemove,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { db, isConfigured } from './firebase';
import type { ConditionTag } from '../types';

export const TAG_LABELS: Record<string, string> = {
  has_soap: 'has soap',
  has_paper: 'has paper',
  clean: 'clean',
  hand_dryer: 'hand dryer',
  broken_lock: 'broken lock',
  out_of_order: 'out of order',
};

export const TAG_KEYS = Object.keys(TAG_LABELS);

export async function getTags(toiletId: string): Promise<ConditionTag[]> {
  if (!isConfigured || !db) return [];
  const q = query(
    collection(db, 'tags'),
    where('toiletId', '==', toiletId)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as ConditionTag));
}

export async function toggleTag(
  toiletId: string,
  tagKey: string,
  userId: string,
  currentlyVoted: boolean
): Promise<void> {
  if (!db || !isConfigured) throw new Error('Firebase not configured');
  const docId = `${toiletId}_${tagKey}`;
  const ref = doc(db, 'tags', docId);
  await setDoc(
    ref,
    {
      toiletId,
      tagKey,
      votes: currentlyVoted ? arrayRemove(userId) : arrayUnion(userId),
    },
    { merge: true }
  );
}
