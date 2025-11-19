/**
 * LangSmith Query Examples
 * Common queries for debugging and performance analysis
 */

/**
 * DAICE LangSmith Query Cheat Sheet
 *
 * ==================================================
 * FINDING TRACES BY ROOM
 * ==================================================
 *
 * Find all traces for a specific room:
 * Filter: tags includes "room:WbguTSh1NZqIt0AtlUs9"
 * Sort by: timestamp ASC
 *
 * Result: All 3 section traces for that room
 *
 * ==================================================
 * FINDING TRACES BY SECTION
 * ==================================================
 *
 * Find all Section 1 (DM Story) traces:
 * Filter: tags includes "wizard-section-1"
 *
 * Find all Section 2 (World Config) traces:
 * Filter: tags includes "wizard-section-2"
 *
 * Find all Section 3 (Character Setup) traces:
 * Filter: tags includes "wizard-section-3"
 *
 * ==================================================
 * FINDING FAILED EXECUTIONS
 * ==================================================
 *
 * Find all failed traces:
 * Filter: status = "error"
 * Sort by: timestamp DESC
 *
 * Find failed Section 1 traces:
 * Filter: tags includes "wizard-section-1" AND status = "error"
 *
 * ==================================================
 * PERFORMANCE ANALYSIS
 * ==================================================
 *
 * Find slow executions (> 2 minutes):
 * Filter: latency > 120000
 * Sort by: latency DESC
 *
 * Average latency by section:
 * Metric: Average latency
 * Group by: metadata.section
 *
 * ==================================================
 * FINDING BY USER
 * ==================================================
 *
 * Find all traces for a user:
 * Filter: tags includes "user:test-user-123"
 *
 * ==================================================
 * FINDING BY THEME
 * ==================================================
 *
 * Find all "High Fantasy" worlds:
 * Filter: tags includes "theme:high-fantasy"
 *
 * ==================================================
 * DEBUGGING WORKFLOW
 * ==================================================
 *
 * Step 1: User reports error in room abc123
 * Query: tags includes "room:abc123"
 *
 * Step 2: Identify which section failed
 * Look at: status column for each trace
 *
 * Step 3: Open failed trace
 * Click: trace with status = "error"
 *
 * Step 4: Find failed span
 * Look for: red span in trace tree
 *
 * Step 5: Inspect span details
 * View: Input, Output/Error, Logs
 *
 * ==================================================
 * COMPARING SECTIONS
 * ==================================================
 *
 * Section 1 average duration:
 * Filter: tags includes "wizard-section-1"
 * Metric: Average latency
 *
 * Section 2 average duration:
 * Filter: tags includes "wizard-section-2"
 * Metric: Average latency
 *
 * ==================================================
 * FINDING SPECIFIC NODE ISSUES
 * ==================================================
 *
 * All history_period_node executions:
 * Filter: span_name = "history_period_node"
 *
 * Failed history periods:
 * Filter: span_name = "history_period_node" AND status = "error"
 *
 * ==================================================
 */

export {};
