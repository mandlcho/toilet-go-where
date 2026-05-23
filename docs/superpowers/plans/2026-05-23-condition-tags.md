# Condition Tags Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let users quick-tap condition attributes (has soap, has paper, clean, broken lock, etc.) that others have voted on, stored in Firestore.

**Architecture:** Six predefined tag keys are stored in `tagService.ts`. Each tag's state for a toilet lives in a Firestore `tags` collection, one document per `{toiletId}_{tagKey}`, holding a `votes` array of userIds. `ConditionTags` displays all six tags with vote counts and lets signed-in users toggle their vote optimistically. Rendered in `ToiletDetail.tsx` below the amenities section.

**Tech Stack:** React 18, TypeScript, Firebase Firestore (already configured in `services/firebase.ts`)

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Modify | `types.ts` | Add `ConditionTag` interface |
| Create | `services/tagService.ts` | Firestore read/write for condition tags |
| Create | `components/ConditionTags.tsx` | Tag display + toggle UI |
| Modify | `components/ToiletDetail.tsx` | Render ConditionTags below amenities |

---

### Task 1: Add `ConditionTag` type to `types.ts`

**Files:**
- Modify: `types.ts`

- [ ] **Step 1: Add the interface at the end of `types.ts`**

Append to the end of `types.ts`:
```ts
export interface ConditionTag {
  id: string;       // Firestore doc ID: `${toiletId}_${tagKey}`
  toiletId: string;
  tagKey: string;
  votes: string[];  // array of userIds who voted
}
```

---

### Task 2: Create `services/tagService.ts`

**Files:**
- Create: `services/tagService.ts`

- [ ] **Step 1: Create the file with this exact content**

```ts
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
```

---

### Task 3: Create `components/ConditionTags.tsx`

**Files:**
- Create: `components/ConditionTags.tsx`

- [ ] **Step 1: Create the file with this exact content**

```tsx
import React, { useEffect, useState } from 'react';
import { getTags, toggleTag, TAG_LABELS, TAG_KEYS } from '../services/tagService';

interface ConditionTagsProps {
  toiletId: string;
  userId: string | null;
}

const ConditionTags: React.FC<ConditionTagsProps> = ({ toiletId, userId }) => {
  const [tags, setTags] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const fetched = await getTags(toiletId);
    const map: Record<string, string[]> = {};
    for (const t of fetched) map[t.tagKey] = t.votes;
    setTags(map);
    setLoading(false);
  };

  useEffect(() => { void load(); }, [toiletId]);

  const handleToggle = async (tagKey: string) => {
    if (!userId) return;
    const currentVotes = tags[tagKey] ?? [];
    const voted = currentVotes.includes(userId);
    setTags((prev) => ({
      ...prev,
      [tagKey]: voted
        ? currentVotes.filter((id) => id !== userId)
        : [...currentVotes, userId],
    }));
    await toggleTag(toiletId, tagKey, userId, voted);
  };

  if (loading) {
    return <p className="text-xs text-gray-400">loading tags...</p>;
  }

  return (
    <div>
      <p className="text-xs font-bold mb-2">condition</p>
      <div className="flex flex-wrap gap-2">
        {TAG_KEYS.map((key) => {
          const votes = tags[key] ?? [];
          const voted = userId ? votes.includes(userId) : false;
          return (
            <button
              key={key}
              onClick={() => handleToggle(key)}
              disabled={!userId}
              className={`px-2.5 py-1 text-[10px] font-semibold rounded-full border transition-colors ${
                voted
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
              } disabled:cursor-default`}
            >
              {TAG_LABELS[key]}
              {votes.length > 0 ? ` (${votes.length})` : ''}
            </button>
          );
        })}
      </div>
      {!userId && (
        <p className="text-[10px] text-gray-400 mt-1">sign in to vote</p>
      )}
    </div>
  );
};

export default ConditionTags;
```

---

### Task 4: Add `ConditionTags` to `ToiletDetail.tsx`

**Files:**
- Modify: `components/ToiletDetail.tsx`

- [ ] **Step 1: Add the import**

Find in `ToiletDetail.tsx`:
```tsx
import StarRating from './StarRating';
```

Add after it:
```tsx
import ConditionTags from './ConditionTags';
```

- [ ] **Step 2: Render ConditionTags after the amenities block**

Find this block in `ToiletDetail.tsx`:
```tsx
      {/* Amenities */}
      {amenities.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {amenities.map((a) => (
            <span key={a as string} className="px-2 py-1 text-[10px] font-semibold bg-gray-100 text-gray-600 rounded-full">
              {a}
            </span>
          ))}
        </div>
      )}
```

Add after the closing `)}` of that block:
```tsx

      {/* Condition tags */}
      <ConditionTags toiletId={toilet.id} userId={user?.uid ?? null} />
```

- [ ] **Step 3: Verify build passes**

```bash
npm run build
```

Expected: zero TypeScript errors.

- [ ] **Step 4: Commit**

```bash
git add types.ts services/tagService.ts components/ConditionTags.tsx components/ToiletDetail.tsx
git commit -m "feat: add condition tags with Firestore voting"
```

---

## Evaluator Checklist

Start the dev server: `npm run dev` → open http://localhost:5173

- [ ] Tap a toilet pin → open bottom sheet detail.
- [ ] "condition" section appears below amenity badges, showing 6 tags: has soap, has paper, clean, hand dryer, broken lock, out of order.
- [ ] Without signing in: tags are visible but clicking them does nothing. "sign in to vote" hint appears.
- [ ] Sign in with Google. Tap "has soap" — it turns blue immediately (optimistic update).
- [ ] Close and reopen the same toilet — "has soap" is still blue and shows "(1)".
- [ ] Tap "has soap" again — vote is removed, tag returns to grey.
- [ ] Vote counts accumulate correctly across refreshes.
- [ ] Tags with zero votes show no count suffix. Tags with ≥1 vote show "(N)".
