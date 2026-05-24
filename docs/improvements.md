# FindIt — Improvement Backlog

Generated from browser testing session on 2026-05-24.

---

## 🔴 Bugs

### 1. Infinite re-render loop on every marker click
**Symptom:** Clicking any toilet or ATM pin fires 16–200+ "Maximum update depth exceeded" React errors per click. The app doesn't crash visually but burns CPU until the next navigation.

**Root cause:** `ChangeView` in `MapView.tsx` runs a `useEffect` that calls `map.setView()`. Leaflet's popup auto-pan triggers `moveend`, which calls `onViewportChanged` → `setMapCenter` in App.tsx, which re-renders, which gives `ChangeView` a new `[lat, lng]` array (new reference → effect re-runs), and if the stored value differs from `map.getCenter()` by more than the 0.0001 threshold (floating-point drift from projection rounding), `setView` is called again — loop.

**Fix:** Push view changes to the map only in response to intentional programmatic events (search, re-center button). Use a `ref` to track pending view changes rather than syncing via props on every render.

---

## 🟡 UX Issues

### 2. Double UI on marker click
Clicking a pin opens both a Leaflet map popup *and* the bottom detail sheet simultaneously — same name, address, and distance shown twice. The popup is redundant noise.

**Fix:** Remove `<Popup>` children from toilet/ATM `<Marker>` elements. All detail content belongs in the sheet.

### 3. No results list
After a search the only way to browse results is tapping individual map pins. Clicking "find toilets (37)" re-searches instead of opening a list. On mobile with 37 pins this is unusable.

**Fix:** "find toilets (37)" button should open the `PlaceList` sheet (already built) when results exist, and only re-search when results are stale or the area changed. A long-press or swipe-up gesture could also expose the list.

### 4. "Report this listing" links to GitHub issues
The map popup's report link opens a pre-filled GitHub issue form — a developer tool. End users shouldn't land there. The `EditSuggestion` component (merged via PR #16) is the right in-app replacement, but it lives only in the detail sheet while the popup still has the old link.

**Fix:** Remove `buildReportUrl()` and the `<a>` tag in `ToiletPopupContent`. Since the popup itself should go away (#2), this becomes moot.

### 5. Auto re-center fires silently after 15 seconds
If the user pans more than 100m from their location and stops interacting, the map snaps back after 15 seconds with no warning. Users exploring the map will find their view jumping unexpectedly.

**Fix:** Either remove the timer entirely, or show a dismissable "returning to your location in Xs" pill that the user can cancel.

### 6. Filter state persists across category switches
Toggling to ATMs and back leaves toilet filters (free/accessible/diaper) still active. A user comparing categories gets filtered toilet results with no explanation.

**Fix:** Reset filters to all-off when `activeCategory` changes, or show the active filters as clearly labelled chips so the state is visible.

### 7. ATM detail shows toilet-specific amenity fields
ATMs inherit the toilet detail UI, so "wheelchair accessible" and "diaper changing" chips can appear for cash machines.

**Fix:** Conditionally render amenity chips only when `toilet.category !== 'atm'`. Add ATM-specific fields instead: operator/network/brand (already available in data), 24h indicator from `openingHours`.

### 8. Mobile bottom sheet has no visible close affordance
On 390×844, the detail sheet covers ~65% of the screen. There is no drag handle, no close button in the visible area, and no onboarding hint. The only exit is tapping the dark backdrop overlay — non-obvious on first use.

**Fix:** Add a drag handle pill at the top of the sheet. Add a visible × button in the sheet header. Consider allowing swipe-down to dismiss.

### 9. Selected pin has no visual highlight
The tapped pin doesn't change colour or size when the detail sheet opens. On a dense map the user loses track of which toilet the sheet is describing.

**Fix:** Track `selectedToilet.id` and apply a different icon (enlarged, filled, or accent-coloured) to the selected marker.

---

## 💡 Missing Features

### 10. No address / place search
Users can only find toilets near their GPS position. No way to search by address, landmark, or postal code — important for trip planning or sharing a location.

**Suggested approach:** Add a search input (top of screen) backed by the Nominatim geocoding API (same OSM ecosystem, free). On result select, move the map to that location and trigger a search there.

### 11. No empty-state when filters produce zero results
Applying strict filters with no matches shows the map with no pins and no explanation. The search button still shows a count but it's zero.

**Fix:** When `filteredToilets.length === 0` and `hasSearched`, show an inline message below the button: "no results match your filters" with a "clear filters" link.

### 12. Tailwind via CDN in production
Every page load fires: `cdn.tailwindcss.com should not be used in production`. This also loads the full 300 kB Tailwind CDN script unnecessarily since the project uses Vite.

**Fix:** Remove the CDN `<script>` tag from `index.html` and configure Tailwind as a PostCSS plugin in `vite.config.ts`. Standard setup, ~5 minute change.

### 13. No share / deep-link for ATMs
The share-a-place URL encoding was implemented for toilets but ATM results use the same `selectedToilet` state — verify the URL param includes the category so sharing an ATM link works correctly.

---

## Priority Order

| # | Item | Effort | Impact |
|---|------|--------|--------|
| 1 | Fix re-render loop | S | Critical |
| 2 | Remove duplicate popup | XS | High |
| 12 | Tailwind → PostCSS | XS | High |
| 8 | Sheet close affordance | S | High |
| 9 | Highlight selected pin | S | High |
| 3 | Results list button fix | S | High |
| 6 | Reset filters on category switch | XS | Medium |
| 7 | ATM detail fields | S | Medium |
| 5 | Remove or warn before auto re-center | S | Medium |
| 11 | Empty filter state | XS | Medium |
| 4 | Remove GitHub report link from popup | XS | Low (blocked by #2) |
| 10 | Address search | L | High (big feature) |
| 13 | ATM deep-link verification | XS | Low |
