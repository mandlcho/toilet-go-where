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

### Task 5: Evaluator — Write Tests

**Prerequisite:** `test-setup` feature must be complete.

**Files:**
- Create: `test/components/ConditionTags.test.tsx`

- [ ] **Step 1: Create the test file**

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ConditionTags from '../../components/ConditionTags';
import * as tagService from '../../services/tagService';

vi.mock('../../services/tagService', () => ({
  getTags: vi.fn(),
  toggleTag: vi.fn(),
  TAG_LABELS: {
    has_soap: 'has soap',
    has_paper: 'has paper',
    clean: 'clean',
    hand_dryer: 'hand dryer',
    broken_lock: 'broken lock',
    out_of_order: 'out of order',
  },
  TAG_KEYS: ['has_soap', 'has_paper', 'clean', 'hand_dryer', 'broken_lock', 'out_of_order'],
}));

describe('ConditionTags', () => {
  beforeEach(() => {
    vi.mocked(tagService.getTags).mockResolvedValue([]);
    vi.mocked(tagService.toggleTag).mockResolvedValue(undefined);
  });

  it('renders all 6 tag labels after loading', async () => {
    render(<ConditionTags toiletId="t1" userId={null} />);
    await waitFor(() => {
      expect(screen.getByText('has soap')).toBeInTheDocument();
      expect(screen.getByText('clean')).toBeInTheDocument();
      expect(screen.getByText('broken lock')).toBeInTheDocument();
      expect(screen.getByText('out of order')).toBeInTheDocument();
    });
  });

  it('shows "sign in to vote" hint when userId is null', async () => {
    render(<ConditionTags toiletId="t1" userId={null} />);
    await waitFor(() =>
      expect(screen.getByText(/sign in to vote/)).toBeInTheDocument()
    );
  });

  it('hides "sign in to vote" when userId is provided', async () => {
    render(<ConditionTags toiletId="t1" userId="user1" />);
    await waitFor(() =>
      expect(screen.queryByText(/sign in to vote/)).not.toBeInTheDocument()
    );
  });

  it('shows vote count when votes exist', async () => {
    vi.mocked(tagService.getTags).mockResolvedValue([
      { id: 't1_has_soap', toiletId: 't1', tagKey: 'has_soap', votes: ['u1', 'u2'] },
    ]);
    render(<ConditionTags toiletId="t1" userId="u3" />);
    await waitFor(() =>
      expect(screen.getByText('has soap (2)')).toBeInTheDocument()
    );
  });

  it('applies active (blue) styles when current user has voted', async () => {
    vi.mocked(tagService.getTags).mockResolvedValue([
      { id: 't1_clean', toiletId: 't1', tagKey: 'clean', votes: ['user1'] },
    ]);
    render(<ConditionTags toiletId="t1" userId="user1" />);
    await waitFor(() => {
      const btn = screen.getByText('clean (1)').closest('button');
      expect(btn).toHaveClass('bg-blue-600');
    });
  });

  it('calls toggleTag and increments count optimistically when user votes', async () => {
    render(<ConditionTags toiletId="t1" userId="user1" />);
    await waitFor(() => expect(screen.getByText('has soap')).toBeInTheDocument());
    await userEvent.click(screen.getByText('has soap'));
    expect(tagService.toggleTag).toHaveBeenCalledWith('t1', 'has_soap', 'user1', false);
    expect(screen.getByText('has soap (1)')).toBeInTheDocument();
  });

  it('does not call toggleTag when userId is null', async () => {
    render(<ConditionTags toiletId="t1" userId={null} />);
    await waitFor(() => expect(screen.getByText('has soap')).toBeInTheDocument());
    await userEvent.click(screen.getByText('has soap'));
    expect(tagService.toggleTag).not.toHaveBeenCalled();
  });

  it('removes vote optimistically on second click', async () => {
    vi.mocked(tagService.getTags).mockResolvedValue([
      { id: 't1_clean', toiletId: 't1', tagKey: 'clean', votes: ['user1'] },
    ]);
    render(<ConditionTags toiletId="t1" userId="user1" />);
    await waitFor(() => expect(screen.getByText('clean (1)')).toBeInTheDocument());
    await userEvent.click(screen.getByText('clean (1)'));
    expect(tagService.toggleTag).toHaveBeenCalledWith('t1', 'clean', 'user1', true);
    expect(screen.getByText('clean')).toBeInTheDocument();
    expect(screen.queryByText('clean (1)')).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the tests**

```bash
npm test -- test/components/ConditionTags.test.tsx
```

Expected:
```
✓ test/components/ConditionTags.test.tsx (8)
Test Files  1 passed (1)
Tests       8 passed (8)
```

If any test fails, report the exact error to the Coder.

- [ ] **Step 3: Commit**

```bash
git add test/components/ConditionTags.test.tsx
git commit -m "test: add ConditionTags component tests"
```

---

## Evaluator Checklist

- [ ] `npm test -- test/components/ConditionTags.test.tsx` — all 8 tests pass, zero failures.
- [ ] `npm run build` — TypeScript still compiles cleanly.
