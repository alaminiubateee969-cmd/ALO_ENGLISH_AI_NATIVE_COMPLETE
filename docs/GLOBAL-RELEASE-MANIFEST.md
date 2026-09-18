# GLOBAL RELEASE MANIFEST (§91) — template + current state

## Manifest schema (binding for every future production release)
```yaml
release_id: REL-<date>-<seq>
project: <service_id>
domain: <domain>
repository: <owner/repo>
branch: main
commit_sha: <40-hex>          # must equal approved PR merge SHA
artifact_sha256: <64-hex>     # CI artifact checksum
runtime: node-22 + bun-1.3
dependency_lock_hash: <bun.lock sha256>
sbom: <artifact URL>          # pending CI addition
database_version: <prisma migration at deploy>
migration: <none|migration-name>   # with backup proof
agent_versions: <registry versions>
prompt_versions: <prompt versions>
policy_versions: <policy versions>
tool_versions: <tool versions>
mcp_versions: <mcp versions or NONE>
build_id: <CI run id>
deployment_time: <ISO8601>
approval: <approver + evidence link>
verification: { github_sha: .., vps_sha: .., running_release_sha: .., health: .. }
```

## Current production state of this service
- release_id: UNKNOWN (live deployment not produced by any recorded pipeline run)
- commit_sha on server: UNKNOWN → **blocks §124 exact-SHA verification** (S-02)
- Last CI artifact: none created (job skipped after test failure)

## Audit-time reference manifest (this working branch)
release_id: REL-2026-09-18-INSPECT-01
project: alo-english | domain: english.aloeducation.com
repository: alaminiubateee969-cmd/ALO_ENGLISH_AI_NATIVE_COMPLETE
branch: arena/01a0b208-alo-english-ai-native-complete
commit_sha: (filled at push — see git log)
artifact_sha256: N/A (docs-only change-set; no runtime artifact)
mcp_versions: NONE | migration: none | approval: audit-only, no production change
