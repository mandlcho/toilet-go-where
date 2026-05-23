# FindIt Feature Pipeline

## How It Works

Each feature flows through three roles before being marked done:

```
Queue → Orchestrator → Coder → Evaluator → mark done → next feature
```

### The Queue

`feature-queue.json` lists all features with their status (`pending` / `in_progress` / `done`).  
Each feature has a pointer to its plan file in `plans/`.

### Roles

**Orchestrator**
- Reads `feature-queue.json`, picks the next `pending` feature
- Sets its status to `in_progress`
- Reads the codebase for relevant context
- Writes a detailed, self-contained implementation plan to `plans/YYYY-MM-DD-<name>.md`
- Hands off to Coder

**Coder**
- Reads the plan file top-to-bottom
- Implements every task/step exactly as written — no skipping, no improvising
- Uses `superpowers:subagent-driven-development` or `superpowers:executing-plans`
- Does NOT touch other features or refactor unrelated code

**Evaluator**
- Reads the plan's final "Evaluator Task" section
- Writes the test file(s) specified in that section (complete code is provided)
- Runs `npm test -- <test-file>` — all tests must pass, zero failures
- Also runs `npm run build` — zero TypeScript errors
- If any test fails, hands the exact failure output back to the Coder
- If all pass, marks the feature `done` in `feature-queue.json` and commits

### Running the Loop

Trigger the next iteration by saying **"run the next feature"** or **"continue the pipeline"**.

The orchestrator will pick the first `pending` item from the queue and begin.

---

## Feature Status

| # | Feature          | Status  | Plan |
|---|-----------------|---------|------|
| 0 | Test Setup       | pending | [plan](plans/2026-05-23-test-setup.md) |
| 2 | List View        | pending | [plan](plans/2026-05-23-list-view.md) |
| 5 | Condition Tags   | pending | [plan](plans/2026-05-23-condition-tags.md) |
| 6 | Photo Uploads    | pending | [plan](plans/2026-05-23-photo-uploads.md) |
| 7 | Edit Suggestions | pending | [plan](plans/2026-05-23-edit-suggestions.md) |
| 8 | Walk Time        | ✅ done | already in `utils/distance.ts` |
| 9 | Share a Place    | pending | [plan](plans/2026-05-23-share-place.md) |
|10 | Favorites        | pending | [plan](plans/2026-05-23-favorites.md) |
