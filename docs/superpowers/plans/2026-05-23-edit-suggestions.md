# Edit Suggestions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the GitHub issue link ("report this listing") with an in-app form that stores user-submitted corrections to Firestore.

**Architecture:** A `EditSuggestion` component manages its own open/submit/success state. It renders as a link ("report an issue") that expands inline into a small form: issue type selector + optional notes. On submit, writes to a Firestore `suggestions` collection. The GitHub link in `MapView.tsx` (`buildReportUrl` + anchor) is removed and replaced with `EditSuggestion`. The detail sheet in `ToiletDetail.tsx` also gets `EditSuggestion` below the action buttons.

**Tech Stack:** React 18, TypeScript, Firebase Firestore (already configured)

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `services/suggestionService.ts` | Write suggestions to Firestore |
| Create | `components/EditSuggestion.tsx` | Inline report form |
| Modify | `components/MapView.tsx` | Replace `buildReportUrl` + anchor with `<EditSuggestion>` |
| Modify | `components/ToiletDetail.tsx` | Add `<EditSuggestion>` below action buttons |

---

### Task 1: Create `services/suggestionService.ts`

**Files:**
- Create: `services/suggestionService.ts`

- [ ] **Step 1: Create the file with this exact content**

```ts
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
```

---

### Task 2: Create `components/EditSuggestion.tsx`

**Files:**
- Create: `components/EditSuggestion.tsx`

- [ ] **Step 1: Create the file with this exact content**

```tsx
import React, { useState } from 'react';
import {
  submitSuggestion,
  ISSUE_LABELS,
  type IssueType,
} from '../services/suggestionService';

interface EditSuggestionProps {
  placeId: string;
  placeName: string;
  userId: string | null;
}

const EditSuggestion: React.FC<EditSuggestionProps> = ({
  placeId,
  placeName,
  userId,
}) => {
  const [open, setOpen] = useState(false);
  const [issueType, setIssueType] = useState<IssueType>('details_incorrect');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await submitSuggestion(placeId, placeName, issueType, notes, userId);
      setSubmitted(true);
      setTimeout(() => {
        setOpen(false);
        setSubmitted(false);
        setNotes('');
        setIssueType('details_incorrect');
      }, 2000);
    } catch (err: any) {
      setError(err?.message ?? 'could not submit. try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-[11px] font-semibold text-gray-500 underline underline-offset-2 hover:text-gray-700"
      >
        report an issue
      </button>
    );
  }

  if (submitted) {
    return (
      <p className="text-[11px] text-green-600 font-semibold">
        thanks — we'll look into it.
      </p>
    );
  }

  return (
    <div className="border border-gray-200 rounded-lg p-3 space-y-2">
      <p className="text-xs font-bold">report an issue</p>
      <select
        value={issueType}
        onChange={(e) => setIssueType(e.target.value as IssueType)}
        className="w-full border border-gray-200 rounded-lg p-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
      >
        {(Object.entries(ISSUE_LABELS) as [IssueType, string][]).map(
          ([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          )
        )}
      </select>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="additional notes (optional)"
        className="w-full border border-gray-200 rounded-lg p-2 text-xs resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
        rows={2}
      />
      {error && <p className="text-[10px] text-red-500">{error}</p>}
      <div className="flex gap-2">
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="px-3 py-1.5 text-xs font-bold text-white bg-gray-800 rounded-lg hover:bg-gray-700 disabled:opacity-50"
        >
          {submitting ? 'sending...' : 'submit'}
        </button>
        <button
          onClick={() => { setOpen(false); setError(null); }}
          className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700"
        >
          cancel
        </button>
      </div>
    </div>
  );
};

export default EditSuggestion;
```

---

### Task 3: Replace GitHub link in `MapView.tsx`

**Files:**
- Modify: `components/MapView.tsx`

- [ ] **Step 1: Add the import**

Find in `MapView.tsx`:
```tsx
import { formatDistance } from '../utils/distance';
```

Add after it:
```tsx
import EditSuggestion from './EditSuggestion';
```

- [ ] **Step 2: Remove `buildReportUrl` function and the anchor tag**

Find and delete the entire `buildReportUrl` function in `ToiletPopupContent`:
```tsx
  const buildReportUrl = () => {
    const { lat, lng } = toilet.location;
    const title = `Listing issue: ${toilet.name} (${lat.toFixed(5)}, ${lng.toFixed(5)})`;
    const body = [
      `Problem:`,
      ``,
      `- [ ] wrong location`,
      `- [ ] not a toilet / removed`,
      `- [ ] details are incorrect`,
      `- [ ] other`,
      ``,
      `Listing:`,
      `- name: ${toilet.name}`,
      `- id: ${toilet.id}`,
      `- category: ${toilet.category}`,
      `- coordinates: ${lat}, ${lng}`,
      `- address shown: ${address}`,
      ``,
      `Extra notes:`
    ].join('\n');

    const params = new URLSearchParams({
      title,
      body,
    });

    return `https://github.com/mandlcho/findit/issues/new?${params.toString()}`;
  };
```

Also find and delete the anchor tag that used it:
```tsx
      <a
        href={buildReportUrl()}
        target="_blank"
        rel="noreferrer"
        className="mt-2 block text-center text-[11px] font-semibold text-gray-600 underline underline-offset-2"
      >
        report this listing
      </a>
```

- [ ] **Step 3: Add `EditSuggestion` where the anchor was**

In `ToiletPopupContent`'s return, after the `go` button and before the closing `</div>`, add:
```tsx
      <div className="mt-2 flex justify-center">
        <EditSuggestion
          placeId={toilet.id}
          placeName={toilet.name}
          userId={null}
        />
      </div>
```

Note: the popup doesn't have access to `currentUser` from `App.tsx`. Passing `userId={null}` means suggestions from the popup are always anonymous. This is acceptable — the detail sheet (Task 4) will pass the real userId.

---

### Task 4: Add `EditSuggestion` to `ToiletDetail.tsx`

**Files:**
- Modify: `components/ToiletDetail.tsx`

- [ ] **Step 1: Add the import**

Find in `ToiletDetail.tsx`:
```tsx
import StarRating from './StarRating';
```

Add after it:
```tsx
import EditSuggestion from './EditSuggestion';
```

- [ ] **Step 2: Add below the action buttons**

Find the `{/* Actions */}` block in `ToiletDetail.tsx`:
```tsx
      {/* Actions */}
      <div className="flex gap-2">
```

After its closing `</div>`, add:
```tsx

      <EditSuggestion
        placeId={toilet.id}
        placeName={toilet.name}
        userId={user?.uid ?? null}
      />
```

- [ ] **Step 3: Verify build passes**

```bash
npm run build
```

Expected: zero TypeScript errors.

- [ ] **Step 4: Commit**

```bash
git add services/suggestionService.ts components/EditSuggestion.tsx components/MapView.tsx components/ToiletDetail.tsx
git commit -m "feat: replace GitHub issue link with in-app edit suggestions"
```

---

## Evaluator Checklist

Start the dev server: `npm run dev` → open http://localhost:5173

- [ ] Tap a toilet pin on the map — popup shows "report an issue" link (no GitHub link visible).
- [ ] Tap "report an issue" in popup — form expands inline with issue type selector and notes field.
- [ ] Select an issue type and tap "submit" — "thanks — we'll look into it." appears for ~2s, then collapses.
- [ ] Open toilet detail sheet (tap toilet row or marker) — "report an issue" link appears below the directions/review buttons.
- [ ] Submit from detail sheet while signed in — check Firebase Console → Firestore → `suggestions` collection → new document with correct `placeId`, `placeName`, `issueType`, `userId`.
- [ ] Submit from popup — `userId` field in Firestore is `"anonymous"`.
- [ ] "cancel" button collapses the form without submitting.
- [ ] Submitting twice on the same toilet creates two separate documents.
