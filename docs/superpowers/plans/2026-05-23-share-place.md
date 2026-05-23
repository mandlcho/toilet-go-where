# Share a Place Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deep link to a specific toilet via URL params (`?lat=...&lng=...&id=...`). Selecting a toilet updates the URL; opening the URL auto-searches and opens that toilet.

**Architecture:** `utils/share.ts` encodes/decodes URL params. In `App.tsx`, selecting a toilet calls `encodeShareUrl` and pushes to browser history. Closing the detail sheet calls `clearShareParams`. On mount, if URL params are present, the app searches around that lat/lng and auto-selects the matching toilet. No new components needed.

**Tech Stack:** React 18, TypeScript, browser History API

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `utils/share.ts` | Encode/decode/clear URL share params |
| Modify | `App.tsx` | On select → push URL; on mount → parse URL; on close → clear URL |

---

### Task 1: Create `utils/share.ts`

**Files:**
- Create: `utils/share.ts`

- [ ] **Step 1: Create the file with this exact content**

```ts
export interface ShareParams {
  id: string;
  lat: number;
  lng: number;
}

export function encodeShareUrl(params: ShareParams): string {
  const url = new URL(window.location.href);
  url.searchParams.set('id', params.id);
  url.searchParams.set('lat', params.lat.toFixed(6));
  url.searchParams.set('lng', params.lng.toFixed(6));
  return url.toString();
}

export function decodeShareParams(): ShareParams | null {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  const lat = params.get('lat');
  const lng = params.get('lng');
  if (!id || !lat || !lng) return null;
  const latNum = parseFloat(lat);
  const lngNum = parseFloat(lng);
  if (isNaN(latNum) || isNaN(lngNum)) return null;
  return { id, lat: latNum, lng: lngNum };
}

export function clearShareParams(): void {
  const url = new URL(window.location.href);
  url.searchParams.delete('id');
  url.searchParams.delete('lat');
  url.searchParams.delete('lng');
  window.history.replaceState({}, '', url.toString());
}
```

---

### Task 2: Wire share params into `App.tsx`

**Files:**
- Modify: `App.tsx`

- [ ] **Step 1: Add the import**

Find the imports block at the top of `App.tsx`. Add:
```tsx
import { encodeShareUrl, decodeShareParams, clearShareParams } from './utils/share';
```

Place it after the existing `import { haversineDistance } from './utils/distance';` line.

- [ ] **Step 2: Update URL when a toilet is selected**

Currently `onToiletSelect` in the `MapView` JSX calls `setSelectedToilet` directly:
```tsx
onToiletSelect={setSelectedToilet}
```

Change it to use a named handler. First, add this handler inside the `App` component (after `handleViewportChanged`):
```tsx
  const handleToiletSelect = (toilet: Toilet) => {
    setSelectedToilet(toilet);
    window.history.pushState(
      {},
      '',
      encodeShareUrl({ id: toilet.id, lat: toilet.location.lat, lng: toilet.location.lng })
    );
  };
```

Then update the JSX prop:
```tsx
onToiletSelect={handleToiletSelect}
```

- [ ] **Step 3: Clear URL params when detail sheet closes**

Find where `onClose` is passed to `BottomSheet`:
```tsx
      <BottomSheet isOpen={selectedToilet !== null} onClose={() => setSelectedToilet(null)}>
```

Replace with:
```tsx
      <BottomSheet
        isOpen={selectedToilet !== null}
        onClose={() => { setSelectedToilet(null); clearShareParams(); }}
      >
```

- [ ] **Step 4: On mount, parse URL params and auto-search**

Find the existing `useEffect` that calls `requestLocation()`. Add a new `useEffect` after it:
```tsx
  useEffect(() => {
    const params = decodeShareParams();
    if (!params) return;
    const { id, lat, lng } = params;
    setMapCenter({ lat, lng });
    setMapZoom(17);
    (async () => {
      try {
        const { findToilets } = await import('./services/locationService');
        const results = await findToilets({ lat, lng });
        setToilets(results);
        setActiveCategory('toilet');
        setHasSearched(true);
        lastSearchCenter.current = { lat, lng };
        const match = results.find((t) => t.id === id);
        if (match) {
          setSelectedToilet(match);
          window.history.replaceState(
            {},
            '',
            encodeShareUrl({ id: match.id, lat: match.location.lat, lng: match.location.lng })
          );
        }
      } catch {
        // silently fail — user can search manually
      }
    })();
  }, []);
```

- [ ] **Step 5: Verify build passes**

```bash
npm run build
```

Expected: zero TypeScript errors.

- [ ] **Step 6: Commit**

```bash
git add utils/share.ts App.tsx
git commit -m "feat: add share-a-place deep linking via URL params"
```

---

## Evaluator Checklist

Start the dev server: `npm run dev` → open http://localhost:5173

- [ ] Search for toilets, tap one — the browser URL bar updates to include `?id=...&lat=...&lng=...`.
- [ ] Close the detail sheet (swipe down or tap backdrop) — URL params are removed from the address bar.
- [ ] Tap a different toilet — URL updates to that toilet's params.
- [ ] Copy the URL while a toilet is selected. Open it in a new tab — the map centers on that location, searches, and auto-opens the correct toilet's detail sheet.
- [ ] Open a URL with a valid `?id=` but the toilet is not in results (e.g. id was for a different area) — app searches, finds nothing matching, but doesn't crash.
- [ ] Open the app with no URL params — behaves exactly as before (no regression).
