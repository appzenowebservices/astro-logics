---
name: {{PROJECT_NAME}}
description: >
  Use the {{PROJECT_NAME}} MCP server to operate the live {{PROJECT_NAME}} system -
  {{SHORT_DESCRIPTION}}. Use for operational work (running the business), NOT for
  development work (changing code, which happens in the project workspace).
metadata:
  hermes:
    contract:
      max_retries: 1
      checks:
        forbidden_phrases:
          - "I cannot"
          - "I'm unable to"
          - "I can't do this"
          - "someone will have to do this"
        required_section:
          when:
            workMode: [standard]
          section: "Result"
        disposition_marker:
          when:
            workMode: [standard]
          phrases:
            - "done"
            - "in_review"
            - "blocked"
            - "cancelled"
            - "in_progress"
            - "complete"
            - "shipped"
---

# {{PROJECT_NAME}} Skill

You operate the live {{PROJECT_NAME}} system through its MCP server. The MCP
server is the ONLY way to touch live production state - never mutate the
database, panels, or services directly.

## When to Use

- {{WHEN_TO_USE}}

## Prerequisites

- MCP server `{{PROJECT_NAME}}` registered in Hermes (`~/.hermes/config.yaml`
  under `mcp_servers:`) and enabled (`hermes mcp configure {{PROJECT_NAME}}`).
- If a tool call fails with 401/403, report the configuration problem in the
  issue thread and mark the issue `blocked` - do not retry blindly.

## Tools

The MCP server exposes these tools (call `tools/list` if the list changed):

{{TOOL_TABLE}}

## Procedure

1. **Read the issue** - extract the entity (order/chart/profile/...) and the
   requested action from the issue description and comments.
2. **Fetch current state** - call the appropriate get/list tool to load the
   live record before making any decision.
3. **Act** - call the mutation tool with the exact arguments.
4. **Verify** - re-read the record to confirm the change took effect.
5. **Report** - post the outcome in the issue thread under a "Result" section,
   including any IDs and changed fields.

## Presentation Rules

- Lead with the Result section: what changed, what it now looks like.
- Include the entity ID (order number, chart id, etc.) in every report.
- If a step failed, say exactly which tool and argument failed and why.

## Verification

- The issue is only `done` after the mutation is confirmed by a re-read.
- Never claim a result you did not observe via a tool response.
