# Test Infrastructure Setup Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Install vitest + React Testing Library and wire them into the project so every feature plan can ship with a passing test suite.

**Architecture:** Vitest runs in a jsdom environment. `@testing-library/react` renders components. `@testing-library/jest-dom` extends `expect` with DOM matchers. `@testing-library/user-event` v14 simulates realistic user interactions. All test files live under `test/` at the project root.

**Tech Stack:** vitest, @testing-library/react, @testing-library/jest-dom, @testing-library/user-event, jsdom

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Modify | `package.json` | Add test script and devDependencies |
| Modify | `vite.config.ts` | Add vitest config block |
| Create | `test/setup.ts` | Extend expect with jest-dom matchers |

---

### Task 1: Install test dependencies

**Files:**
- Modify: `package.json` (npm will update this)

- [ ] **Step 1: Install packages**

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

Expected: packages appear in `package.json` devDependencies, no peer-dependency errors.

---

### Task 2: Add test script to `package.json`

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Add scripts**

Open `package.json`. Find the `"scripts"` block:
```json
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
```

Replace with:
```json
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  },
```

---

### Task 3: Add vitest config to `vite.config.ts`

**Files:**
- Modify: `vite.config.ts`

- [ ] **Step 1: Change the import**

Find:
```ts
import { defineConfig } from 'vite';
```

Replace with:
```ts
import { defineConfig } from 'vitest/config';
```

(`vitest/config` re-exports `defineConfig` with the `test` field included in its types.)

- [ ] **Step 2: Add the `test` block inside the returned config object**

Find the closing brace of the returned config object. The file currently ends like:
```ts
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
  };
});
```

Add `test` before the final `};`:
```ts
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    test: {
      environment: 'jsdom',
      setupFiles: ['./test/setup.ts'],
    },
  };
});
```

---

### Task 4: Create `test/setup.ts`

**Files:**
- Create: `test/setup.ts`

- [ ] **Step 1: Create the file**

```ts
import '@testing-library/jest-dom';
```

---

### Task 5: Verify the setup works

- [ ] **Step 1: Create a smoke-test file**

Create `test/smoke.test.ts`:
```ts
import { describe, it, expect } from 'vitest';

describe('test infrastructure', () => {
  it('runs', () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 2: Run tests**

```bash
npm test
```

Expected output:
```
✓ test/smoke.test.ts (1)
  ✓ test infrastructure > runs

Test Files  1 passed (1)
Tests       1 passed (1)
```

- [ ] **Step 3: Delete the smoke test**

```bash
rm test/smoke.test.ts
```

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json vite.config.ts test/setup.ts
git commit -m "chore: add vitest and React Testing Library"
```

---

## Evaluator Checklist

- [ ] `npm test` runs without errors (even with no test files it should exit 0 or with "no test files found" — not a crash).
- [ ] `npm run build` still passes — vitest config must not break the production build.
