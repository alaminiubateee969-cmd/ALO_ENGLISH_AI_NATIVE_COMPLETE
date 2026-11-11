-- Privacy-first analytics counters.
--
-- There is no visitor in this table. No identifier, no session, no IP address,
-- no user-agent, no referrer, no free text — one row per day per event per path
-- per label, holding a count. The rules that keep it that way live in
-- src/lib/analytics/events.ts (a fixed event list, slug-only labels, query
-- strings stripped, anything resembling personal data refused outright); this
-- table is the shape those rules produce.
--
-- Why NOT NULL with an empty-string default rather than nullable columns: the
-- uniqueness of a row is (day, event, path, label), and in SQLite NULL values are
-- distinct in a unique index, so a nullable path would let the same counter be
-- inserted twice and the aggregate would silently double-count. An empty string
-- means "this event has no page", which is exactly what it is.
--
-- Why an integer counter rather than one row per event: the alternative is a row
-- per page view, which is a visitor trace with extra steps. A counter cannot be
-- joined back to a person because there is no person in it.

CREATE TABLE "AnalyticsCounter" (
  "id"        TEXT     NOT NULL PRIMARY KEY,
  "day"       TEXT     NOT NULL,
  "event"     TEXT     NOT NULL,
  "path"      TEXT     NOT NULL DEFAULT '',
  "label"     TEXT     NOT NULL DEFAULT '',
  "count"     INTEGER  NOT NULL DEFAULT 0,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);

CREATE UNIQUE INDEX "AnalyticsCounter_day_event_path_label_key" ON "AnalyticsCounter" ("day", "event", "path", "label");
CREATE INDEX "AnalyticsCounter_day_idx" ON "AnalyticsCounter" ("day");
CREATE INDEX "AnalyticsCounter_event_idx" ON "AnalyticsCounter" ("event");
CREATE INDEX "AnalyticsCounter_path_idx" ON "AnalyticsCounter" ("path");
