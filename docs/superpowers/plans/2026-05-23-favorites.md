# Favorites Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let signed-in users bookmark toilets to a personal favorites list, persisted to Firestore. A heart button appears in the toilet detail sheet header.

**Architecture:** Firestore `favorites` collection; document ID is `{userId}_{placeId}`, document contains the full `Place` object plus `userId` and `createdAt`. `FavoriteButton` manages its own checked/loading state, checks on mount whether the current user has favorited this place, and toggles on tap. Rendered in `ToiletDetail.tsx` next to the toilet name. No dedicated favorites screen (YAGNI — the feature is "save", not "browse saved").

**Tech Stack:** React 18, TypeScript, Firebase Firestore (already configured in `services/firebase.ts`)

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Modify | `types.ts` | Add `Favorite` interface |
| Create | `services/favoritesService.ts` | Add / remove / check / list favorites in Firestore |
| Create | `components/FavoriteButton.tsx` | Heart icon toggle button |
| Modify | `components/ToiletDetail.tsx` | Render FavoriteButton next to toilet name |

---

### Task 1: Add `Favorite` type to `types.ts`

**Files:**
- Modify: `types.ts`

- [ ] **Step 1: Append the interface to `types.ts`**

```ts
export interface Favorite {
  id: string;        // Firestore doc ID: `${userId}_${placeId}`
  userId: string;
  place: Place;
  createdAt: number;
}
```

---

### Task 2: Create `services/favoritesService.ts`

**Files:**
- Create: `services/favoritesService.ts`

- [ ] **Step 1: Create the file with this exact content**

```ts
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
```

---

### Task 3: Create `components/FavoriteButton.tsx`

**Files:**
- Create: `components/FavoriteButton.tsx`

- [ ] **Step 1: Create the file with this exact content**

```tsx
import React, { useEffect, useState } from 'react';
import { isFavorited, addFavorite, removeFavorite } from '../services/favoritesService';
import type { Place } from '../types';

interface FavoriteButtonProps {
  place: Place;
  userId: string | null;
}

const FavoriteButton: React.FC<FavoriteButtonProps> = ({ place, userId }) => {
  const [favorited, setFavorited] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) { setFavorited(false); return; }
    isFavorited(userId, place.id).then(setFavorited);
  }, [userId, place.id]);

  const toggle = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      if (favorited) {
        await removeFavorite(userId, place.id);
        setFavorited(false);
      } else {
        await addFavorite(userId, place);
        setFavorited(true);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={toggle}
      disabled={!userId || loading}
      title={
        !userId
          ? 'sign in to save'
          : favorited
          ? 'remove from favorites'
          : 'add to favorites'
      }
      className="p-1.5 rounded-full transition-colors disabled:opacity-40 disabled:cursor-default hover:bg-gray-100 flex-shrink-0"
      aria-label={favorited ? 'unfavorite' : 'favorite'}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill={favorited ? '#ef4444' : 'none'}
        stroke={favorited ? '#ef4444' : 'currentColor'}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    </button>
  );
};

export default FavoriteButton;
```

---

### Task 4: Add `FavoriteButton` to `ToiletDetail.tsx`

**Files:**
- Modify: `components/ToiletDetail.tsx`

- [ ] **Step 1: Add the import**

Find in `ToiletDetail.tsx`:
```tsx
import StarRating from './StarRating';
```

Add after it:
```tsx
import FavoriteButton from './FavoriteButton';
```

- [ ] **Step 2: Wrap the header in a flex row to place the heart next to the name**

Find the header block:
```tsx
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold">{toilet.name}</h2>
```

Replace with:
```tsx
      {/* Header */}
      <div>
        <div className="flex items-start justify-between gap-2">
          <h2 className="text-lg font-bold">{toilet.name}</h2>
          <FavoriteButton place={toilet} userId={user?.uid ?? null} />
        </div>
```

- [ ] **Step 3: Verify build passes**

```bash
npm run build
```

Expected: zero TypeScript errors.

- [ ] **Step 4: Commit**

```bash
git add types.ts services/favoritesService.ts components/FavoriteButton.tsx components/ToiletDetail.tsx
git commit -m "feat: add favorites with Firestore persistence"
```

---

### Task 5: Evaluator — Write Tests

**Prerequisite:** `test-setup` feature must be complete.

**Files:**
- Create: `test/components/FavoriteButton.test.tsx`

- [ ] **Step 1: Create the test file**

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FavoriteButton from '../../components/FavoriteButton';
import * as favoritesService from '../../services/favoritesService';
import type { Place } from '../../types';

vi.mock('../../services/favoritesService', () => ({
  isFavorited: vi.fn(),
  addFavorite: vi.fn(),
  removeFavorite: vi.fn(),
}));

const mockPlace: Place = {
  id: 'toilet-1',
  name: 'test toilet',
  location: { lat: 1.3, lng: 103.8 },
  category: 'toilet',
};

describe('FavoriteButton', () => {
  beforeEach(() => {
    vi.mocked(favoritesService.isFavorited).mockResolvedValue(false);
    vi.mocked(favoritesService.addFavorite).mockResolvedValue(undefined);
    vi.mocked(favoritesService.removeFavorite).mockResolvedValue(undefined);
  });

  it('renders a button', () => {
    render(<FavoriteButton place={mockPlace} userId={null} />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('is disabled when userId is null', () => {
    render(<FavoriteButton place={mockPlace} userId={null} />);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('is enabled after isFavorited resolves when userId is provided', async () => {
    render(<FavoriteButton place={mockPlace} userId="user1" />);
    await waitFor(() =>
      expect(screen.getByRole('button')).not.toBeDisabled()
    );
  });

  it('calls isFavorited with userId and placeId on mount', async () => {
    render(<FavoriteButton place={mockPlace} userId="user1" />);
    await waitFor(() =>
      expect(favoritesService.isFavorited).toHaveBeenCalledWith('user1', 'toilet-1')
    );
  });

  it('calls addFavorite when tapped while not favorited', async () => {
    vi.mocked(favoritesService.isFavorited).mockResolvedValue(false);
    render(<FavoriteButton place={mockPlace} userId="user1" />);
    await waitFor(() => expect(screen.getByRole('button')).not.toBeDisabled());
    await userEvent.click(screen.getByRole('button'));
    expect(favoritesService.addFavorite).toHaveBeenCalledWith('user1', mockPlace);
  });

  it('calls removeFavorite when tapped while already favorited', async () => {
    vi.mocked(favoritesService.isFavorited).mockResolvedValue(true);
    render(<FavoriteButton place={mockPlace} userId="user1" />);
    await waitFor(() => expect(screen.getByRole('button')).not.toBeDisabled());
    await userEvent.click(screen.getByRole('button'));
    expect(favoritesService.removeFavorite).toHaveBeenCalledWith('user1', 'toilet-1');
  });

  it('aria-label changes from "favorite" to "unfavorite" after adding', async () => {
    vi.mocked(favoritesService.isFavorited).mockResolvedValue(false);
    render(<FavoriteButton place={mockPlace} userId="user1" />);
    await waitFor(() => expect(screen.getByLabelText('favorite')).toBeInTheDocument());
    await userEvent.click(screen.getByLabelText('favorite'));
    await waitFor(() =>
      expect(screen.getByLabelText('unfavorite')).toBeInTheDocument()
    );
  });
});
```

- [ ] **Step 2: Run the tests**

```bash
npm test -- test/components/FavoriteButton.test.tsx
```

Expected:
```
✓ test/components/FavoriteButton.test.tsx (7)
Test Files  1 passed (1)
Tests       7 passed (7)
```

If any test fails, report the exact error to the Coder.

- [ ] **Step 3: Commit**

```bash
git add test/components/FavoriteButton.test.tsx
git commit -m "test: add FavoriteButton component tests"
```

---

## Evaluator Checklist

- [ ] `npm test -- test/components/FavoriteButton.test.tsx` — all 7 tests pass, zero failures.
- [ ] `npm run build` — TypeScript still compiles cleanly.
