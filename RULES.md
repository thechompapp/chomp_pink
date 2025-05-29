# Core Coding & File Management Rules

## I. File Operations & Integrity

1.  **Existing Files Only**:
    * All modifications must be applied to **provided files only**.
    * Explicit confirmation is required before creating any new files.
    * **No Code Regression**: Ensure that changes do not reintroduce previously fixed bugs or remove existing, functional features.


3.  **No Assumptions - Request & Wait**:
    * If a required file is not provided, **request it explicitly and await its provision**.
    * Do **not** proceed with stubbed implementations, placeholder logic, or assumptions about file content or structure.
    * **No Mock Data**: All development and testing must use real data structures and, where applicable, connect to actual data sources or accurately represent them. Do not use simplified or placeholder data for fixes.
    * **Use Real API Endpoints**: All interactions must target actual, defined API endpoints. Do not use mock or simplified versions of API endpoints for problem-solving or testing.

4.  **Preserve & Patch - Incremental Updates**:
    * Update code **incrementally**.
    * Do **not** erase, overwrite, or remove existing logic unless explicitly instructed to do so.
    * **Do Not Use Simplified Versions to Fix Problems**: Address issues within the existing complexity and structure of the codebase. Do not create simplified or alternative versions of components or logic to bypass or mask underlying problems.

## II. Code Quality & Structure

5.  **Holistic Impact Analysis (360-Degree View)**:
    * Before altering any file, thoroughly understand its connections, dependencies, and overall impact across the application.
    * Ensure all related code, modules, and functionalities remain fully functional and synchronized with the changes.

6.  **Syntax & Loop Integrity**:
    * Rigorously check all code for syntax errors (e.g., mismatched parentheses, brackets, missing semicolons) before delivery.
    * Verify the absence of infinite loops, unintended circular dependencies, or blocking synchronous operations.

7.  **Global Imports**:
    * Utilize global or absolute import paths (e.g., `src/components/MyComponent` instead of `../../MyComponent`) to prevent directory-level and path-related errors during refactoring or file movement.

8.  **No Hardcoding (Especially Database Data)**:
    * Data that is intended to be dynamic, configurable, or managed via a database **must not be hardcoded** into the application logic.

9.  **Reusable Components & Consistency**:
    * Prioritize the use of existing reusable components.
    * When developing new functionalities, design them as reusable elements where appropriate to ensure consistency and broad applicability of updates.

10. **Performance & Maintainable Structure**:
    * Develop with optimal performance, execution speed, and resource efficiency as key priorities.
    * Maintain a clear, logical, and easily maintainable code structure.

11. **Tailwind & Design Consistency**:
    * Strictly adhere to the current Tailwind CSS utility classes and configurations used within the project.
    * Ensure all new or modified UI elements are consistent with established design patterns, color schemes, and typographic styles to maintain visual and stylistic uniformity.

## III. React-Specific Best Practices (for Infinite Loop & Re-render Prevention)

12. **State Management Precision**:
    * When using state selectors (e.g., in Zustand, Redux), prefer selecting specific primitive values rather than entire objects to minimize unnecessary re-renders.
    * Memoize derived values using `useMemo` to prevent re-computation on every render.
    * Memoize callback functions passed to child components or used in effects using `useCallback`.

13. **Effect Discipline (`useEffect`, `useCallback`, `useMemo`)**:
    * Always provide **exhaustive and accurate dependency arrays**.
    * Critically analyze effect logic to ensure it doesn't inadvertently modify its own dependencies, leading to circular triggers.
    * Use `useRef` for values that are needed within an effect but should not trigger the effect when they change (e.g., mutable values, timers, previous state/props).

14. **Component Boundaries & Stable References**:
    * Use `React.memo` judiciously on components where re-render optimization provides tangible benefits and props are likely to be stable.
    * Ensure stable references (especially for objects, arrays, and callback functions) are passed as props to child components to prevent unnecessary re-renders of memoized children.
    * Be mindful of potential re-render cascades when lifting state; ensure changes at a higher level don't cause widespread, unnecessary re-renders below.

## IV. Backend Interaction & Debugging

15. **Backend-First Debugging (for UI Anomalies)**:
    * If a user action that triggers a backend API call results in unexpected frontend behavior (hangs, errors, incorrect data display), **immediately examine the backend server logs** for errors, exceptions, or performance bottlenecks.
    * If backend logs indicate a database error (e.g., SQL syntax error, constraint violation), cross-reference the problematic query with the `schema_definition.sql` (or equivalent schema file) to ensure alignment and correctness.
    * Prioritize resolving backend issues before engaging in extensive frontend UI debugging for problems rooted in server-side logic or data retrieval.

## V. Development Process & Verification

16. **Verification Before Delivery (Crucial)**:
    * Before stating any fix, feature, or modification is complete, **rigorously verify the changes**.
    * For API-related changes, use a `curl` script (or equivalent API testing tool like Postman) against the **relevant, real API endpoint** to confirm correct functionality, status codes, and response payloads.
    * For UI or logic changes, observe positive results from detailed `console.log` debugging, step-through debugging, or UI interaction testing to confirm the material improvement and correct behavior.
    * **Do not claim a fix or completion without this tangible verification step.** Assertions of "should work" or "likely fixed" are insufficient.

17. **No Analysis Without Request**:
    * Do not provide your analytical thought process, step-by-step reasoning, or internal monologue unless specifically asked to do so by the user. Focus on delivering the requested code or addressing the query directly.

## VI. General (Implicit but Reinforced Principles)

* **Logical Organization**: Organize code into logical directory structures (e.g., feature-based, type-based) for clarity and maintainability.
* **Single Responsibility**: Strive for modules, classes, and functions that adhere to the Single Responsibility Principle.
* **Abstractions & DI**: Utilize appropriate abstractions and consider Dependency Injection patterns to promote decoupling and testability.
* **Centralized Configuration**: Centralize application-level configurations rather than scattering them throughout the codebase.
* **Consistent Standards**: Employ consistent naming conventions, linting rules (e.g., ESLint, Prettier), and code formatting across the entire project.
* **Comprehensive Testing**: Write and maintain a robust suite of tests, including unit, integration, and end-to-end (E2E) tests.
* **Uniform Error Handling**: Implement a consistent and predictable error handling strategy across the application.
* **Clear Documentation**: Document APIs, complex logic, and architectural decisions to aid understanding and future development.
* **CI/CD & Code Reviews**: Leverage Continuous Integration/Continuous Deployment (CI/CD) pipelines and participate in thorough code review processes.

Codebase Cleanup & Testing Standards
Version 1.1 – Last Updated: [Insert Date]

Objective
This initiative aims to aggressively clean, refactor, and streamline the codebase with zero functional regressions. All changes must improve internal maintainability, reduce unnecessary weight, and keep behavior and output fully stable across environments.

Primary Goals
Improve readability and maintainability by simplifying structure and naming. Eliminate all redundant files, logic, or assets. Maintain current performance and UX by ensuring that refactors do not slow down build times or user interactions.

Core Cleanup Tasks
Identification and Removal: Locate and justify unused functions, components, services, assets, deprecated config files, and dev-only scratchpads. Remove large commented-out code unless mission-critical (in which case, extract to documentation). Flag oversized or uncompressed media for optimization or deletion.

Reorganization: Structure files into clear, purpose-driven directories (preferably feature-based). Avoid nested bloat—keep hierarchy shallow and predictable. Standardize naming (camelCase for JS/TS, kebab-case for filenames).

Hard Constraints
No Mock Data
All testing and development must use live or staging environments with real endpoints. Remove any mock or stub directories unless they're justified and isolated unit snapshots.

No Mock Server Testing
Do not use MSW, Mirage, or any fake servers. Validate real API responses via curl, Postman, or real UI interaction.

No Functional Changes
Do not change behavior, logic, or visuals. This is a structural and organizational pass only.

No Style Edits
Do not touch CSS, layout, or visual styling unless deleting unused files. Visual regression is not acceptable.

Process and Deliverables
Analysis Phase:
Submit a markdown doc or spreadsheet outlining files to delete, rename, or move. Include reasons for each action.

Implementation Phase:
Apply changes via small, single-purpose PRs with descriptive commit messages like:

Remove deprecated filterHelpers.js

Group dish logic under /features/dishes/

Verification Phase:
Run full end-to-end checks with real APIs. Use logs, response validation, and UI flows to confirm nothing is broken.

Final Report:
Submit a changelog of deleted files, moved folders, renamed assets, and any removed dependencies.

Code & Structure Rules
Only edit files you’re assigned or scoped for.

Always provide complete file updates, not diffs.

Do not create placeholder files.

Never delete live code unless explicitly confirmed.

Follow global imports (e.g., @/components/...).

Reuse, don’t rewrite. Match the design system and Tailwind conventions.

React Rules
Memoize any derived values. Avoid infinite loops by managing useEffect dependencies carefully. Use stable props, React.memo, and useCallback for performance and reliability.

Testing Standards
Global Requirements:
All tests must be compact, performant, and operate only against real APIs and endpoints. Mocking is disallowed. Testing scope should reflect real usage while remaining fast and self-contained.

Unit Tests
Limit to pure logic only (e.g., helper functions).

Max: 30 lines per test file.

No API, DB, or network interaction.

Group multiple related functions in a single test file.

Avoid repetitive inputs—cover edge cases only.

Integration Tests
Cover real API/service/database flow.

Max: 50 lines per test file.

Use seeded data and real endpoints only.

Validate side effects, cleanup state afterward.

Must finish under 2 seconds per test.

End-to-End Tests
Simulate key user flows like login, CRUD, or search.

Max: 75 lines per test file.

One user journey per test.

Always hit the full stack (frontend to DB).

Tests must complete in under 5 seconds.

Use direct selectors and skip animations/delays.

Debugging and QA
If a frontend action breaks:

Check server logs first.

Confirm API schema and endpoint behavior.

Only then, investigate frontend UI issues.

Validate all fixes with curl or Postman. Do not claim a task as complete unless the real response is verified and matches spec.

Final Notes
Be surgical. Every deletion must be confirmed. Every test must be optimized. If a test runs long, reduce scope or split into smaller tests. Always verify against live systems—never assume.

If in doubt, ask. If confident, verify. If uncertain, halt and clarify.