Objective: Generate an exceptionally detailed and specific project summary for the "Chomp/Doof" application. This summary must serve as a complete handoff document, enabling another AI assistant or developer with no prior context to understand the project's intricacies, identify issues, strategize refactoring, and continue development work seamlessly, with a strong emphasis on code cleanup and ensuring all existing parts have a clear purpose.

Target Audience: An AI assistant or developer new to the project.

Core Requirements for the Project Summary:

Project Overview:

Purpose and Core Functionality: Clearly define what the "Chomp/Doof" application does, its primary goals, and the key problems it solves for its users.

Key Technologies, Frameworks, and Libraries: Provide an exhaustive list for both frontend (chomp_pink) and backend (doof-backend). Specify versions if known and relevant (e.g., React 18, Node.js 18.x, PostgreSQL 14). Include UI libraries, state management solutions, HTTP clients, testing frameworks, build tools, ORMs/DB clients, etc.

Architecture and Structure:

High-Level Architecture: Describe the overall system architecture (e.g., Client-Server, Monolith/Microservices, N-Tier).

Detailed Directory Structure Overview: Present a clear, tree-like representation of the significant directories and subdirectories within chomp_pink/ and doof-backend/. For each key directory, explain its primary role (e.g., src/hooks - Reusable frontend logic, doof-backend/controllers - Backend request handling and business logic).

Component/Module Structure:

Frontend (chomp_pink/src): Explain the roles and interactions of pages/, components/ (differentiate UI/ from feature-specific components), layouts/, hooks/, services/, stores/, contexts/, utils/, config/, main.jsx, App.jsx, queryClient.js.

Backend (doof-backend): Explain the roles and interactions of routes/, controllers/, models/, services/ (if any beyond listService.js), middleware/, utils/, config/, db/, server.js.

Codebase Deep Dive:

Major Files & Their Purpose: For each major file identified in the architecture (e.g., apiClient.js, useAuthStore.js, listController.js, userModel.js, Navbar.jsx, AdminTable.jsx), provide a concise, one-sentence summary of its primary responsibility.

Core Functions/Modules Explained: For the most critical files and modules, explain the purpose and role of their primary exported functions, classes, or components. Focus on what they do and why they exist within the application's flow, not a line-by-line code walkthrough.

Feature Implementation & Status:

Major Features Completed: Detail the implementation of key features (e.g., User Authentication, List Management, Search & Filter, Admin Panel CRUD, Bulk Add). Describe the frontend and backend components involved and how they interact.

Known Issues, Limitations, or Technical Debt: Be very specific. List issues like "Axios instability evidenced by multiple patch files (vite-axios-fix-plugin.js, etc.)," "Redundant utility functions across src/utils/formatters.js and src/utils/formatting.js," "Potential race conditions in useBulkAddProcessor.js due to unmanaged async operations," "Inconsistent error handling patterns in backend controllers." Cross-reference with files if possible.

Development Roadmap & Decisions:

Immediate Next Steps: Based on the codebase's current state (flux, some broken features), what are the most critical stabilization and cleanup tasks? (e.g., "Resolve Axios instability," "Remove all files in backup/ directory," "Fix user authentication flow").

Future Development Plans (If Known): Briefly outline any planned features or major enhancements.

Critical Design Decisions & Tradeoffs: Document key architectural or technological choices made (e.g., "Chose Zustand over Redux for simpler global state," "Direct PostgreSQL interaction via pg library instead of a full ORM for fine-grained query control") and the reasoning behind them, if discernible.

API Documentation (Comprehensive):

For all backend API endpoints defined in doof-backend/routes/:

HTTP Method (e.g., GET, POST).

Full Path (e.g., /api/users/:id).

Brief description of its function.

Authentication requirements (e.g., "Public," "User JWT required," "Admin JWT required").

Request:

Path parameters (e.g., :id).

Query parameters (e.g., ?sortBy=date).

Request body structure (JSON example if applicable).

Response (Success):

Status code(s) (e.g., 200, 201, 204).

Response body structure (JSON example).

Response (Error):

Common error status codes (e.g., 400, 401, 403, 404, 409, 500).

Example error response body structure (e.g., { "error": "Descriptive message" }).

Refactoring Strategies and Opportunities (Actionable):

Provide specific, actionable refactoring suggestions. For example:

"Consolidate all Axios request logic into src/services/apiClient.js, implementing robust interceptors for token management and global error handling. Subsequently, remove vite-axios-fix-plugin.js, monkey-patch-axios.js, and other related temporary fix files."

"Refactor the AdminTable.jsx component and its associated hooks (useAdminTable.js, useAdminRow.js) to be more generic, potentially using a configuration object to define table columns and actions, reducing boilerplate for different admin sections."

"Merge utility functions from src/utils/formatting.js, src/utils/formatters.js, and src/utils/dataFormatters.js into a single, well-organized utility module to eliminate redundancy."

Identify opportunities for improving code clarity, efficiency, and adherence to DRY principles.

Codebase Errors & Issues Requiring Fixes (Descriptive):

Based on your analysis of the file list and common patterns, specifically describe potential bugs, logical errors, or bad practices. Do not write code snippets to fix them.

Examples: "The src/controllers/adminController.js file appears to be a frontend 'controller,' which is unconventional for React. Its logic should likely be refactored into appropriate hooks or services within the src/pages/AdminPanel/ or src/hooks/ directories."

"Multiple test setup files (src/tests/setup.js, src/test/setup.js) and configurations (jest.internal.config.js, vitest.internal.config.js) exist, indicating a fragmented testing strategy that needs unification."

"The presence of src/utils/apiClient.js and src/services/apiClient.js suggests direct duplication; standardize on the services location."

Software Architecture & Flow Diagrams:

Conceptual Architecture Diagram: Create a high-level diagram (e.g., using Mermaid syntax if possible, or describe it clearly for an AI to generate) illustrating the main layers (Frontend Client, Frontend Server/Build, Backend API, Database) and their primary interactions.

Relational File/Module Diagram (for Debugging & Understanding Flow):

Illustrate or describe the typical flow of data and control for key operations. For example:

"User Login Flow: LoginPage.jsx (UI) -> useAuthStore (state/action) -> authService.js (API call) -> apiClient.js (HTTP request) -> doof-backend/routes/auth.js -> authController.js (logic) -> userModel.js (DB interaction) -> Database."

"Admin Data Fetch Flow: AdminTable.jsx (UI) -> useAdminTable.js (hook) -> adminService.js (API call) -> apiClient.js -> doof-backend/routes/admin.js -> adminController.js -> genericModel.js (or specific model) -> Database."

The goal is to show how different file types (pages, components, hooks, services, stores, routes, controllers, models) are interconnected for key functionalities, aiding in pinpointing problem areas.

Program Flow Mapping & Unused Code Identification (Crucial for Cleanup):

Trace Major User Flows: For at least 3-5 critical user flows (e.g., User Registration, Creating a List and Adding Items, Searching for a Restaurant, Admin Approving a Submission), meticulously map out the sequence of operations. List the specific files, and if possible, key functions/components within those files, that are involved in each step of the flow.

Verify Purpose & Interconnection: For every significant module (service, hook, controller, major UI component, utility class/object) identified in the codebase:

Confirm its active participation in one or more of these traced user flows or its role as a fundamental utility/library.

If a module's purpose or connection to active flows is unclear, flag it.

Identify and List Candidates for Deletion: Based on the flow mapping and purpose verification, explicitly list all files, directories, or significant code sections that appear to be unused, orphaned, or made obsolete by other implementations. Provide a brief justification for why each is a candidate for removal (e.g., "File src/utils/oldLogger.js - functionality superseded by src/utils/logger.js and not imported anywhere"). This is a direct input to the "eliminate / delete / retire anything that’s not being used" goal.

Overall Feedback & Strategic Recommendations:

Conclude with a high-level assessment of the codebase's current state: its strengths, critical weaknesses (e.g., high technical debt in specific areas, architectural concerns).

Summarize the most impactful next steps for the developer who will receive this summary, focusing on stabilization, cleanup, and then further development.