# 🧠 Engineering Standards & Development Protocol

## 📁 Core Coding & File Management

1. **Existing Files Only:** Patch only provided files. Confirm before creating any new files.
2. **No Assumptions:** If a file is missing or needed, request it. Do not create stubs or guess structure.
3. **Preserve & Patch:** Incrementally patch code. Never erase or overwrite existing logic unless explicitly told to.
4. **Global Imports:** Use alias/global paths (e.g. `@/components/...`) to prevent directory-relative import errors.
5. **No Hardcoded DB Data:** Any data meant to be dynamic or from the database must **not** be hardcoded.

## ⚙️ Code Quality & Architecture

6. **Holistic Impact Review:** Before changing a file, understand how it connects to the full app.
7. **SRP (Single Responsibility Principle):** Each function, component, or file should do one thing well.
8. **Separation of Concerns:** Keep business logic, state, and UI concerns distinct.
9. **Reusable Components:** Favor composable, generalized UI and logic for broad reusability.
10. **Optimized Structure & Performance:** Maintain a fast, clear, scalable structure with minimal bloat.
11. **Consistent Naming & Structure:** Match existing naming conventions. Keep consistent directory structures.

## 🌀 React State & Render Integrity

12. **State Selectors:** Use primitive values and minimal slices to reduce re-renders.
13. **Memoization Discipline:** Use `useMemo` and `useCallback` for derived values and callbacks.
14. **Effect Hygiene:**
    - Always use exhaustive dependency arrays.
    - Avoid circular re-triggers.
    - Use `refs` for non-dependency values.
15. **Stable Props & Boundaries:**
    - Use `React.memo` only where measurable benefit exists.
    - Avoid prop churn by memoizing or lifting state properly.

## 🛠️ Backend Debugging & API Interaction

16. **Backend-First Debugging:** When UI breaks on user action, check server logs **before** diving into frontend.
17. **No Mock Data:** All tests and components must use real API responses. Avoid placeholder/mocked data in live code.
18. **Verify Before Delivery:**
    - Confirm fixes using `curl`, `Postman`, or live logs.
    - Don’t mark a task complete until it’s tested and reproducible.

## 🧪 Testing & Validation

19. **CRUD Coverage:** Every endpoint must be testable for Create, Read, Update, and Delete.
20. **Real Flow Testing:** Simulate real user flows (login, create list, follow list, add item, search, etc.).
21. **End-to-End Tests:** Validate full flows using Playwright/Cypress. No shallow unit tests for key features.
22. **Type Safety:** Use full TypeScript strict mode (`strict: true`). Avoid `any`.

## 🔐 Security & Access Control

23. **Role-Based Access (RBAC):** Protect admin routes and features via backend-enforced role checks.
24. **Input Validation:** Sanitize and validate user input on both frontend and backend.
25. **Environment Hygiene:** Use `.env` files. Never commit API keys, tokens, or secrets.

## 🧭 Design, UI & Tailwind Standards

26. **Tailwind Consistency:** Match current classes, themes, spacings, and breakpoints. Avoid inline overrides.
27. **Dark Mode & Responsiveness:** Ensure all components look clean across viewports and modes.
28. **Design Maturity:** Favor minimal, elegant design over overly playful or experimental styling.

## 🧾 Documentation & Organization

29. **Feature-Level README:** Each major feature/module should have a README describing structure and use.
30. **Changelog Discipline:** Maintain a simple `CHANGELOG.md` documenting new features and fixes per release.
31. **Architecture Diagrams:** For large projects, maintain a diagram of service and data flow (e.g. with Mermaid or Excalidraw).

## 🚦 CI/CD & Delivery

32. **CI Pipeline Required:** All commits must pass build/test workflows before being merged.
33. **Linting & Formatting:** Use `prettier`, `eslint`, or project linter. No unformatted code.
34. **Uniform Error Handling:** Use shared error handler middleware/server logic for consistent errors.

---

> ⚠️ **Reminder:** All updates must be surgical, performance-minded, and maintain holistic system integrity. Avoid breaking ripple effects and follow every update through the system to confirm its downstream stability.

