import { collection, addDoc } from 'firebase/firestore';
import { db, isConfigured } from './firebase';

export type IssueType =
  | 'wrong_location'
  | 'no_longer_exists'
  | 'details_incorrect'
  | 'other';

export const ISSUE_LABELS: Record<IssueType, string> = {
  wrong_location: 'wrong location',
  no_longer_exists: 'no longer exists',
  details_incorrect: 'details are incorrect',
  other: 'other',
};

export async function submitSuggestion(
  placeId: string,
  placeName: string,
  issueType: IssueType,
  notes: string,
  userId: string | null
): Promise<void> {
  if (!db || !isConfigured) throw new Error('Firebase not configured');
  await addDoc(collection(db, 'suggestions'), {
    placeId,
    placeName,
    issueType,
    notes: notes.trim(),
    userId: userId ?? 'anonymous',
    createdAt: Date.now(),
  });
}
