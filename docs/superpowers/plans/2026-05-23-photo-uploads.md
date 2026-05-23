# Photo Uploads Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let signed-in users upload photos of a toilet; photos appear in a horizontal scroll gallery in the detail sheet.

**Architecture:** Firebase Storage holds images at `photos/{toiletId}/{timestamp}_{userId}`. A Firestore `photos` collection stores metadata (URL, uploader, timestamp). `PhotoGallery` loads and displays photos and exposes a hidden file input for upload. A `capture="environment"` attribute on the file input triggers the camera directly on mobile. Rendered in `ToiletDetail.tsx` above the reviews section.

**Tech Stack:** React 18, TypeScript, Firebase Storage + Firestore (already configured in `services/firebase.ts`)

**Firebase prerequisite:** Firebase Storage must be enabled in the Firebase Console for your project (Storage → Get started). The app will throw if Storage is not activated.

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Modify | `types.ts` | Add `Photo` interface |
| Modify | `services/firebase.ts` | Initialize and export Firebase Storage |
| Create | `services/photoService.ts` | Upload to Storage + Firestore metadata |
| Create | `components/PhotoGallery.tsx` | Gallery display + upload button |
| Modify | `components/ToiletDetail.tsx` | Render PhotoGallery above reviews |

---

### Task 1: Add `Photo` type to `types.ts`

**Files:**
- Modify: `types.ts`

- [ ] **Step 1: Append the interface to `types.ts`**

```ts
export interface Photo {
  id: string;
  toiletId: string;
  url: string;
  userId: string;
  userName: string;
  createdAt: number;
}
```

---

### Task 2: Add Firebase Storage to `services/firebase.ts`

**Files:**
- Modify: `services/firebase.ts`

- [ ] **Step 1: Read the current content of `services/firebase.ts`**

Open `services/firebase.ts` and find the imports block at the top. It will look something like:

```ts
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
```

- [ ] **Step 2: Add Storage import**

Add `getStorage` to the imports:
```ts
import { getStorage } from 'firebase/storage';
```

- [ ] **Step 3: Export the storage instance**

Find where `db` and `auth` are exported (after `isConfigured` is determined). Add:
```ts
export const storage = isConfigured ? getStorage(app) : null;
```

Place it directly after the `export const db = ...` line.

---

### Task 3: Create `services/photoService.ts`

**Files:**
- Create: `services/photoService.ts`

- [ ] **Step 1: Create the file with this exact content**

```ts
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  getDocs,
} from 'firebase/firestore';
import { storage } from './firebase';
import { db, isConfigured } from './firebase';
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
```

---

### Task 4: Create `components/PhotoGallery.tsx`

**Files:**
- Create: `components/PhotoGallery.tsx`

- [ ] **Step 1: Create the file with this exact content**

```tsx
import React, { useEffect, useRef, useState } from 'react';
import { getPhotos, uploadPhoto } from '../services/photoService';
import type { Photo } from '../types';

interface PhotoGalleryProps {
  toiletId: string;
  userId: string | null;
  userName: string | null;
}

const PhotoGallery: React.FC<PhotoGalleryProps> = ({ toiletId, userId, userName }) => {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    const fetched = await getPhotos(toiletId);
    setPhotos(fetched);
    setLoading(false);
  };

  useEffect(() => { void load(); }, [toiletId]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId || !userName) return;
    setError(null);
    setUploading(true);
    try {
      const photo = await uploadPhoto(toiletId, userId, userName, file);
      setPhotos((prev) => [photo, ...prev]);
    } catch (err: any) {
      setError(err?.message ?? 'upload failed');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-bold">photos</p>
        {userId && (
          <>
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="text-[10px] text-blue-600 hover:text-blue-800 font-semibold disabled:opacity-50"
            >
              {uploading ? 'uploading...' : '+ add photo'}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleFileChange}
            />
          </>
        )}
      </div>
      {error && <p className="text-[10px] text-red-500 mb-1">{error}</p>}
      {loading ? (
        <p className="text-xs text-gray-400">loading photos...</p>
      ) : photos.length === 0 ? (
        <p className="text-xs text-gray-400">
          {userId ? 'no photos yet. be the first!' : 'no photos yet.'}
        </p>
      ) : (
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {photos.map((p) => (
            <img
              key={p.id}
              src={p.url}
              alt="toilet photo"
              className="w-24 h-24 rounded-lg object-cover flex-shrink-0"
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default PhotoGallery;
```

---

### Task 5: Add `PhotoGallery` to `ToiletDetail.tsx`

**Files:**
- Modify: `components/ToiletDetail.tsx`

- [ ] **Step 1: Add the import**

Find in `ToiletDetail.tsx`:
```tsx
import StarRating from './StarRating';
```

Add after it:
```tsx
import PhotoGallery from './PhotoGallery';
```

- [ ] **Step 2: Render PhotoGallery above the reviews section**

Find this block in `ToiletDetail.tsx`:
```tsx
      {/* Reviews list */}
      <div>
        <h3 className="text-sm font-bold mb-3">reviews</h3>
```

Add `PhotoGallery` directly above that block:
```tsx
      {/* Photos */}
      <PhotoGallery
        toiletId={toilet.id}
        userId={user?.uid ?? null}
        userName={user?.displayName ?? null}
      />

```

- [ ] **Step 3: Verify build passes**

```bash
npm run build
```

Expected: zero TypeScript errors.

- [ ] **Step 4: Commit**

```bash
git add types.ts services/firebase.ts services/photoService.ts components/PhotoGallery.tsx components/ToiletDetail.tsx
git commit -m "feat: add photo uploads via Firebase Storage"
```

---

### Task 6: Evaluator — Write Tests

**Prerequisite:** `test-setup` feature must be complete.

**Files:**
- Create: `test/components/PhotoGallery.test.tsx`

- [ ] **Step 1: Create the test file**

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PhotoGallery from '../../components/PhotoGallery';
import * as photoService from '../../services/photoService';
import type { Photo } from '../../types';

vi.mock('../../services/photoService', () => ({
  getPhotos: vi.fn(),
  uploadPhoto: vi.fn(),
}));

const makePhoto = (id: string, url: string): Photo => ({
  id,
  toiletId: 't1',
  url,
  userId: 'u1',
  userName: 'Alice',
  createdAt: 1000,
});

describe('PhotoGallery', () => {
  beforeEach(() => {
    vi.mocked(photoService.getPhotos).mockResolvedValue([]);
    vi.mocked(photoService.uploadPhoto).mockResolvedValue(makePhoto('ph1', 'https://example.com/a.jpg'));
  });

  it('shows "no photos yet." when empty and not signed in', async () => {
    render(<PhotoGallery toiletId="t1" userId={null} userName={null} />);
    await waitFor(() =>
      expect(screen.getByText('no photos yet.')).toBeInTheDocument()
    );
  });

  it('shows "be the first!" when signed in with no photos', async () => {
    render(<PhotoGallery toiletId="t1" userId="u1" userName="Alice" />);
    await waitFor(() =>
      expect(screen.getByText(/be the first!/)).toBeInTheDocument()
    );
  });

  it('hides the upload button when not signed in', async () => {
    render(<PhotoGallery toiletId="t1" userId={null} userName={null} />);
    await waitFor(() =>
      expect(screen.queryByText('+ add photo')).not.toBeInTheDocument()
    );
  });

  it('shows the upload button when signed in', async () => {
    render(<PhotoGallery toiletId="t1" userId="u1" userName="Alice" />);
    await waitFor(() =>
      expect(screen.getByText('+ add photo')).toBeInTheDocument()
    );
  });

  it('renders a thumbnail for each photo', async () => {
    vi.mocked(photoService.getPhotos).mockResolvedValue([
      makePhoto('ph1', 'https://example.com/a.jpg'),
      makePhoto('ph2', 'https://example.com/b.jpg'),
    ]);
    render(<PhotoGallery toiletId="t1" userId="u1" userName="Alice" />);
    await waitFor(() => {
      const imgs = screen.getAllByAltText('toilet photo');
      expect(imgs).toHaveLength(2);
      expect(imgs[0]).toHaveAttribute('src', 'https://example.com/a.jpg');
    });
  });

  it('calls uploadPhoto and prepends the new photo', async () => {
    const newPhoto = makePhoto('ph3', 'https://example.com/c.jpg');
    vi.mocked(photoService.uploadPhoto).mockResolvedValue(newPhoto);
    render(<PhotoGallery toiletId="t1" userId="u1" userName="Alice" />);
    await waitFor(() => expect(screen.getByText('+ add photo')).toBeInTheDocument());

    const file = new File(['img'], 'photo.jpg', { type: 'image/jpeg' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await userEvent.upload(input, file);

    expect(photoService.uploadPhoto).toHaveBeenCalledWith('t1', 'u1', 'Alice', file);
    await waitFor(() => {
      expect(screen.getByAltText('toilet photo')).toHaveAttribute(
        'src',
        'https://example.com/c.jpg'
      );
    });
  });

  it('shows an error message when upload fails', async () => {
    vi.mocked(photoService.uploadPhoto).mockRejectedValue(new Error('storage unavailable'));
    render(<PhotoGallery toiletId="t1" userId="u1" userName="Alice" />);
    await waitFor(() => expect(screen.getByText('+ add photo')).toBeInTheDocument());

    const file = new File(['img'], 'photo.jpg', { type: 'image/jpeg' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await userEvent.upload(input, file);

    await waitFor(() =>
      expect(screen.getByText('storage unavailable')).toBeInTheDocument()
    );
  });
});
```

- [ ] **Step 2: Run the tests**

```bash
npm test -- test/components/PhotoGallery.test.tsx
```

Expected:
```
✓ test/components/PhotoGallery.test.tsx (7)
Test Files  1 passed (1)
Tests       7 passed (7)
```

If any test fails, report the exact error to the Coder.

- [ ] **Step 3: Commit**

```bash
git add test/components/PhotoGallery.test.tsx
git commit -m "test: add PhotoGallery component tests"
```

---

## Evaluator Checklist

- [ ] `npm test -- test/components/PhotoGallery.test.tsx` — all 7 tests pass, zero failures.
- [ ] `npm run build` — TypeScript still compiles cleanly.
