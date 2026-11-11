# Apache Linkis Integration — ALO English Platform

**Upstream:** https://github.com/apache/linkis — *Apache Linkis builds a computation middleware layer between upper applications and underlying engines.*

**Status in ALO:** **OPT-IN, not required.** Default `LINKIS_ENABLED=false`. CI, `typecheck`, `lint`, `build`, and Hostinger deploy all pass without Linkis. When disabled, `/api/linkis/health` returns `{enabled:false}` and `/api/linkis/jobs` returns `503`.

---

## 1. What Linkis is (and is not)

| Aspect | Detail |
|---|---|
| Language | Java 7M + Scala 5.8M (primary), Vue/JS for Web |
| License | Apache 2.0 |
| Requires | JDK 8/11, Maven 3.6+, MySQL 8 (metadata), Spring Cloud Gateway + Eureka |
| Provides | One REST/WS/JDBC gateway (`/api/rest_j/v1/...`) that routes jobs to engines |
| Engines | Spark 3.2.1, Hive 3.1.3, Python, Shell, JDBC (MySQL/PG/Oracle/ClickHouse), Flink, Presto/Trino, ElasticSearch, SeaTunnel, Pipeline, OpenLooKeng, Sqoop |
| Not | An npm package, a Prisma adapter, or a drop-in for SQLite. It is a **separate JVM cluster**. |

```
[ALO Next.js] --REST (Token-Code)--> [Linkis Gateway :9001]
                                        ├─ Entrance / Manager / Orchestrator
                                        └─ EngineConn (per job process)
                                           spark | python | shell | jdbc | flink ...
```

ALO never embeds Linkis Java code. `src/lib/linkis/client.ts` is a thin `fetch` client.

---

## 2. Why ALO would use it

| ALO gap (docs/FEATURE_GAP_REGISTER.md) | Linkis job |
|---|---|
| FR-006/007 question bank is EMPTY, no blueprint validation | `python` job validates `Question` table nightly (mirrors `scripts/validate-content.mjs` distributed) |
| FR-012 objective scoring only `deterministic_objective` | `spark-3.2.1` job aggregates `Score`→ `ExamAnalytics.difficulty/discrimination` |
| RAG is JS keyword `chunkText+scoreChunk` (no vector) | `jdbc` + `elasticsearch` DataSource for semantic search |
| `ModelRouter` is `groq → local` only | `pipeline` orchestrates `ASR → LLM → LearningMemory` with retries |
| CRM multi-tenant labels | Gateway labels enforce per-branch quotas |

ALO's `mini-services/examiner-stream` stays for realtime; Linkis is for **batch/analytics**.

---

## 3. How it is integrated (this repo)

```
src/lib/linkis/
  config.ts  — LINKIS_ENABLED, gatewayUrl, token, defaultEngine
  types.ts   — EngineType, RunType, LinkisSubmitRequest/Response
  client.ts  — submitJob(), getJobStatus(), getJobLog(), AloTasks.*

src/app/api/linkis/
  health/route.ts  — GET /api/linkis/health (disabled → 200 {enabled:false}, enabled → ADMIN only proxy)
  jobs/route.ts    — POST {code, runType, engineType} → 202 {execID}, GET ?execID= → status

docker-compose.linkis.yml — local Linkis 1.9 + MySQL 8 stack (8088 web, 9001 gateway)
docs/LINKIS_INTEGRATION.md — this file
```

No `.github/workflows` VPS deploy was added — `scripts/check-manifest.mjs` forbids `VPS_HOST/ssh-action/pm2` in workflows; Hostinger remains the only production deploy (`deploy.yml` is readiness only).

Environment (add to `.env` / hPanel, never commit):

```env
# Disabled by default — app works without Linkis
LINKIS_ENABLED=false
LINKIS_GATEWAY_URL=http://linkis-gateway:9001
LINKIS_TOKEN=your-gateway-token-code
LINKIS_DEFAULT_ENGINE=spark-3.2.1
LINKIS_TIMEOUT_MS=30000
```

Also see `.env.example` additions.

---

## 4. Quick start (local, no prod impact)

```bash
# 1. start Linkis (needs Docker, ~2GB RAM)
docker compose -f docker-compose.linkis.yml up -d
# wait ~90s for mysql healthy + linkis healthcheck
curl http://localhost:9001/api/rest_j/v1/linkisManager/ecinfo | jq .

# 2. enable ALO client
echo 'LINKIS_ENABLED=true' >> .env
echo 'LINKIS_GATEWAY_URL=http://localhost:9001' >> .env
echo 'LINKIS_TOKEN=...' >> .env  # from linkis/conf/token.properties

# 3. run ALO
npm run dev
curl http://localhost:3000/api/linkis/health | jq .   # {enabled:true, healthy:true}
curl -X POST http://localhost:3000/api/linkis/jobs \
  -H "Cookie: alo_session=..." \
  -H "Content-Type: application/json" \
  -d '{"code":"SELECT 1","runType":"sql","engineType":"spark-3.2.1"}' | jq .

# 4. use helpers
# src/lib/linkis/client.ts → AloTasks.validateQuestions(), AloTasks.examAnalyticsSpark()
```

For production, deploy Linkis on its **own JVM host** (not Hostinger shared). See `docs/LINKIS_INTEGRATION.md#5`.

---

## 5. Production recommendation

- **Keep Hostinger for ALO** (`english.aloeducation.com` → `103.231.239.79` currently) — do not point it at Linkis.
- **Deploy Linkis separately** on a 2 vCPU/4GB Ubuntu 22.04 host, e.g. `linkis.aloeducation.com → 115.187.18.239`.
- Linkis needs its own MySQL (`linkis` db) — cannot use ALO's SQLite `file:...`. If you later move ALO to MySQL/Postgres, add it as a Linkis DataSource.

Build Linkis from source (required once per host):

```bash
git clone https://github.com/apache/linkis.git --depth 1
cd linkis
./mvnw -N install && ./mvnw clean install -Dmaven.test.skip=true
cd linkis-dist && ./bin/install.sh   # creates linkis-package
# configure linkis/conf/db.sh (MYSQL_*), then ./bin/start-all.sh && ./bin/checkServices.sh
```

---

## 6. Security

- `LINKIS_TOKEN` is a gateway `Token-Code` — treat as secret (panel env).
- `/api/linkis/jobs` is `ADMIN/SUPER_ADMIN` only, blocks `DROP/TRUNCATE/GRANT`.
- Gateway itself enforces label-based multi-tenancy (`userCreator`).

---

## 7. When NOT to use Linkis

If you only need reports, stay with SQLite → Postgres + cron + `mini-services/examiner-stream` + BullMQ. Linkis is 10× ops cost for 1.1× benefit below ~10k daily jobs.

---

## References

- Upstream: https://github.com/apache/linkis
- Docs: https://linkis.apache.org/docs/latest/introduction/
- API: https://linkis.apache.org/docs/latest/api/restful-api/
- Checked at: 2026-10-13 via Google DOH — `103.231.239.79` (english), `115.187.18.53` (aloeducation.com), NS `ns19/ns20.ebndns.com` (no Cloudflare yet)
