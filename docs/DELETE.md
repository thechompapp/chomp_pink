Objective: To significantly improve the health, maintainability, and clarity of the Chomp/Doof codebase by systematically identifying and safely removing all unnecessary, redundant, or obsolete files and code segments. This task is critical for reducing technical debt and streamlining future development.

Critical Constraints - Adhere Strictly:

NO FUNCTIONAL CHANGES: The application's behavior must remain identical. All removals must be behavior-preserving.

NO VISUAL/CSS CHANGES: Do not alter CSS or styling unless a CSS file is proven 100% unlinked and unused by any part of the application, and its removal has zero impact on any visual aspect. This requires extreme caution and verification.

THOROUGH VERIFICATION: Before any rm -rf or git rm command, absolute certainty of a file's obsolescence is required. When in doubt, consult or investigate further.

Scope of Cleanup - Specific File Categories to Investigate and Potentially Remove:

Based on our previous analysis (referencing the project summary chomp_doof_project_summary), meticulously examine and target the following categories. This is not an exhaustive list; apply critical thinking to any file that seems out of place or unused.

Backup and Obsolete Versioned Files:

The entire backup/ directory and all its contents.

Any files with suffixes like .new, .migration, _backup, .old (e.g., src/App.new.jsx, src/pages/Login/index.new.jsx, src/pages/Lists/ListDetail_backup.jsx). Verify if their functionality has been merged into primary files.

Temporary Fix-Related Files (Investigate if Still Needed):

Files explicitly created as temporary patches, especially around Axios:

vite-axios-fix-plugin.js

src/services/monkey-patch-axios.js

src/services/axiosXhrFixer.js

src/services/axios-simple-fix.js

src/services/axios-patch.js

src/services/axios-method-fix.js

src/services/axios-init.js (if superseded by a central apiClient.js)

src/services/custom-axios.js

src/services/customAdapter.js (if related to Axios fixes)

Other fix files: admin-browser-fix.js, doof-backend/models/fix-apply.js, fix-apply.js, src/auth-fix.js, src/utils/auth-fix.js.

Action: Determine if the underlying issues these files addressed are now resolved by library updates, a stable apiClient.js, or other means. If so, remove these patches.

Generated Artifacts (Ensure they are in .gitignore if not already):

All JSON files within test-reports/.

test-results/bulk-add-test-results.json.

Any diagnostic-report-*.json files.

Backend logs like doof-backend/logs/debug.log (ensure logging strategy is in place, but log files themselves are usually not versioned).

Redundant or Obsolete Configurations & Scripts:

Test Configs: jest.internal.config.js (if Vitest via vitest.internal.config.js is the standard). Consolidate test setup files like src/tests/setup.js and src/test/setup.js.

ESLint Configs: eslint.config.js (root) vs. doof-backend/.eslintrc.js. Determine if one is primary and the other redundant for its scope.

Root-level Scripts: Review utility scripts in the project root (e.g., verify-ui-changes.js, verify-list-toggle.js, start-servers.js, internal-integration-test-runner.js, force-online-mode.js, enable-admin-access.js, diagnose-data-rendering-issue.js, dev-server.js, dev-localStorage.js, clear-offline-mode.js, check-duplicates.sh, app-wiring-test-runner.js, api-connectivity-tests.js, disable-offline-mode.js). Document active scripts and remove obsolete ones.

package-integration-tests.json: If its purpose is served by the main package.json scripts or a consolidated test strategy, consider removal.

Outdated or Irrelevant Documentation:

Review all .md files (root, docs/, src/docs/, doof-backend/public/ADMIN_ACCESS.md).

Specifically check: TEST_CLEANUP_ANALYSIS.md, REAL_DATA_RENDERING_ACTION_PLAN.md, INTERNAL_INTEGRATION_STRATEGY.md, INTEGRATION_TESTING_README.md (and its potential duplicate integration-testing-readme.md), IMMEDIATE_ACTION_SUMMARY.md, ENHANCED_TEST_SUITE_SUMMARY.md, API_STANDARDIZATION.md, ADMIN_PANEL_FIX.md.

Archive or remove documents that no longer reflect the current state or plans.

Unused Public Assets (Frontend):

Files in public/ like public/test.html, public/simple.html, public/reset-offline.js, public/fix-offline.html, public/bypass-auth.js. Verify they are not linked or used by any part of the deployed application.

Unlinked/Unused CSS Files (Extreme Caution Required):

src/components/UI/ConfirmationModal.css

src/pages/BulkAdd/PlaceSelectionDialog.css

Verification: Confirm these are not imported or referenced by any active component. Test thoroughly after removal to ensure no visual regressions. Prefer refactoring to Tailwind CSS if styles are needed.

Specific Unused or Development-Only JS/JSX/TSX Code:

src/controllers/adminController.js (clarify its role; if it's a dev tool or misplaced, act accordingly).

Test components: src/components/TestFollowButton.jsx, src/components/TestListToggle.jsx, src/components/UI/TestQuickAdd.jsx.

Test pages: src/pages/AuthTest/index.jsx.

Mock data files if not used by active tests or development seeding scripts: src/pages/Lists/guaranteed-mock-lists.js, src/services/mockApi.js, src/utils/mockData.js.

TypeScript files in backup/backend/src/ (adminService.ts, adminController.ts) if the project is JavaScript-only.

places-api-integration-tests.js (if functionality is covered by the main test suite).

bulk-add-processor-tests.js (if these tests are integrated elsewhere or obsolete).

Duplicate Utility Files/Functions:

Consolidate src/utils/formatting.js, src/utils/formatters.js, src/utils/dataFormatters.js.

Merge or clarify src/utils/ErrorHandler.js and src/utils/errorHandling.js.

Standardize on one apiClient.js (likely src/services/apiClient.js) and remove src/utils/apiClient.js.

Standardize on one networkUtils.js (likely src/utils/networkUtils.js or consolidate into apiClient.js if specific to API calls) and remove src/services/networkUtils.js.

Remove duplicate hook: src/pages/AdminPanel/useAdminTableState.js (prefer src/hooks/useAdminTableState.js).

Large Commented-Out Code Blocks:

Systematically scan files for large sections of commented-out code.

If the code is genuinely obsolete, remove it. If it's temporarily commented for a pending feature, ensure it's clearly marked or managed in a separate branch.

Mandatory Process for Identification and Removal:


Static Analysis (Initial Pass):

Utilize IDE features ("Find Usages", "Safe Delete").

Employ linters (ESLint with plugins like eslint-plugin-unused-imports or depcheck utility) to identify unimported/unused files, exports, and dependencies.

Manual Verification (Crucial Step):

For each file/code block identified by static analysis or from the list above:

Confirm it's not conditionally imported/required in a way static analysis might miss.

Search the entire codebase for any references (including in strings, configurations, or scripts).

Verify it's not part of an unmerged feature branch that relies on it.

Understand its original purpose before deciding on removal.

Team Consultation (If Unsure): If there is any doubt about a file's utility or obsolescence, discuss it with the team before removal.

Safe Deletion:


For code blocks within files, simply delete the lines.

Incremental Commits:

Commit changes in small, logical chunks (e.g., "Remove obsolete backup directory", "Consolidate Axios fix attempts", "Delete unused test components").

Write clear, descriptive commit messages explaining what was removed and why it was deemed obsolete.

Rigorous Testing (After Each Significant Chunk of Removals):

Run all existing automated tests (unit, integration, E2E).

Manually test all affected application areas thoroughly. Pay extremely close attention to ensure no functionality has been inadvertently broken and that there are zero visual regressions.

Test across different user roles (regular user, admin user).

Documentation of Removals: Maintain a list of deleted files/major code sections and a brief justification for their removal. This can be part of the pull request description.

Expected Outcome:

A significantly cleaner, more streamlined codebase with a reduced footprint.

Improved build times (potentially).

Easier navigation and understanding of the project structure for all developers.

A comprehensive list of all files and major code sections removed, along with justifications, to be included in the pull request for this task.

Final Warning: This task requires meticulous attention to detail. The rm -rf mindset should be replaced with a "verify, then verify again, then carefully remove" mindset. The integrity of the application is paramount.