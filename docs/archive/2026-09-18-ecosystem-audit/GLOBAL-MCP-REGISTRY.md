# GLOBAL MCP REGISTRY (§32/§33) — 2026-09-18

## MCP servers in this repository: **NONE** (code-verified)
`git grep -i mcp` over all tracked source, config, and prisma files → 0 functional
references. No MCP client, server, config, or allowlist exists in this service.

## Ecosystem MCP inventory: UNKNOWN
- `agents.alolabs.net` is REPORTED to contain AI-agent infrastructure (§2.3) — its MCP
  usage cannot be inspected (site unreachable from vantage). OWNER ACTION REQUIRED.
- `bdtech360.com` may contain MCP per §2.11 — external review required.

## Intake policy (binding, §33)
Any proposal to add an MCP server must pass, in order, with evidence retained in
`docs/` + PR review:
inspect source → security review → dependency review → permission review → network
review → test → human approval → install → verify. Agents may NEVER self-install MCP.
Default state: **DENY** (§28).
