Prompt: Develop a Terminal-Based Test Results Reporter for Chomp/DoofObjective: Create a command-line tool or script that processes test results from the Chomp/Doof application's testing suite and generates a clear, informative, and well-formatted terminal output. This output must clearly present test outcomes, including pass/fail status with visual indicators (e.g., checkmarks for pass, 'X' for fail), and for tests involving API interactions, it must show the actual request made and the response received in a readable terminal format.Target Audience: A developer tasked with building this command-line reporting tool.Core Requirements for the Terminal-Based Test Results Reporter:Technology Stack:Language/Environment: Node.js (allowing it to be run easily in most development and CI environments).Libraries (Recommended):Consider libraries for enhancing terminal output, such as:chalk for colored text (e.g., green for pass, red for fail).boxen or similar for drawing boxes around sections.ora or listr for progress indicators if processing large reports (though primary focus is static display).Libraries for pretty-printing JSON (for API request/response bodies).Data Input:The tool should accept test results data, likely from a JSON file generated by the testing framework (e.g., Vitest with a JSON reporter).Assume a JSON structure that includes:Overall test run summary (total tests, passed, failed, duration).An array of test suites, each containing:Suite name/description.An array of individual test cases, each containing:Test case name/description.Status (e.g., "passed", "failed", "skipped").Duration.Error message and stack trace (if failed).For API/E2E tests:apiRequest: { method: "GET", url: "/api/users", headers: {...}, body: {...} } (sensitive headers like Auth should be masked or omitted for display).apiResponse: { statusCode: 200, headers: {...}, body: {...} } (large response bodies might need to be pretty-printed and potentially truncated with an option for full view if outputting to a file).Terminal Display Features:Overall Summary: Display total tests run, number passed, number failed, total skipped, and total duration clearly at the beginning of the output, possibly using colors.Hierarchical View:Clearly delineate test suites (e.g., using a heading with a different color or an underline).Under each suite, list individual test cases, indented for clarity.Pass/Fail Indicators:Use clear ASCII characters or Unicode symbols with appropriate coloring:Green ✓ (or [PASS]): For passed tests.Red ✗ (or [FAIL]): For failed tests.Gray - (or [SKIP]): For skipped tests.Detailed Test Information (Conditional Display):For each test case, display its name and duration.If Failed:Display the error message prominently (e.g., in red).Display a formatted stack trace (indented, potentially collapsible or truncated if very long, with an option for full output).API Interaction Details (Crucial, displayed for all or failed tests based on verbosity level):If apiRequest and apiResponse data is present:Clearly label "API Request:" followed by method and URL.Display request headers (selected, non-sensitive) and a pretty-printed JSON request body.Clearly label "API Response:" followed by the status code.Display response headers (selected) and a pretty-printed JSON response body.Ensure sensitive information (passwords, tokens) in request/response bodies/headers is masked or omitted by default.Verbosity Levels (Optional but Recommended):Allow a -v or --verbose flag to show API request/response details for all tests, not just failed ones.Default to showing API details only for failed tests to keep the output concise.Formatting and Clarity:Use indentation, spacing, and line breaks effectively to structure the output for readability.Employ colors (via chalk or similar) strategically to highlight important information (suite names, pass/fail status, errors).Ensure output is well-behaved in standard terminal emulators.Tool Design & Execution:Develop as a Node.js script executable from the command line (e.g., node ./scripts/display-test-results.js <path_to_results.json> [--verbose]).The script should parse the input JSON file.It should then iterate through the test data and print formatted output to stdout.Example Terminal Output Structure (Conceptual):======================================================================
 Chomp/Doof Test Run Summary
======================================================================
 Total Tests: 150 | ✅ Passed: 140 | ❌ Failed: 8 | ➖ Skipped: 2
 Duration: 12.5s
----------------------------------------------------------------------

Suite: User Authentication Tests (5/6 passed)
  ✅ Test: Successful User Registration (150ms)
     API Request:
       POST /api/auth/register
       Body:
         {
           "email": "test@example.com",
           "username": "testuser",
           ...
         }
     API Response:
       Status: 201
       Body:
         {
           "id": "user123",
           "email": "test@example.com",
           ...
         }
  ❌ Test: User Registration - Duplicate Email (80ms)
     Error: AssertionError: Expected status code 409 but got 200
     Stack Trace:
       at <anonymous>:1:1
       ...
     API Request:
       POST /api/auth/register
       Body:
         {
           "email": "existing@example.com",
           ...
         }
     API Response:
       Status: 200
       Body:
         { ... }
  ✅ Test: Successful User Login (120ms)
  ...

Suite: List Management API Tests (10/10 passed)
  ✅ Test: Create a New List (200ms)
  ...
----------------------------------------------------------------------
Implementation Considerations:Argument Parsing: Use a library like yargs or commander for handling command-line arguments (e.g., input file path, verbosity flags).JSON Parsing Robustness: Handle potential errors if the input JSON is malformed.Output to File: Consider an option to redirect output to a file for easier review of very large reports.Deliverables:A Node.js script (e.g., display-test-results.js) capable of parsing a test results JSON file and generating formatted terminal output.Clear documentation in the script's comments or a separate README on:How to run the script (command-line arguments).The expected input JSON format.Any options (like verbosity levels).This terminal-based reporter will provide a direct and accessible way to review test outcomes and diagnose issues related to API interactions by showing the "real actions happening" in a command-line friendly format.