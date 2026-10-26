/**
 * src/lib/integrations/registry.ts
 *
 * Every external service this platform can talk to, in one place, with the
 * licence, the purpose and the environment variable that switches it on.
 *
 * WHY A REGISTRY RATHER THAN SCATTERED `process.env` READS
 * ───────────────────────────────────────────────────────
 * An integration is a decision, not a line of code. Scattered reads make it
 * impossible to answer the two questions an operator actually asks — "what does
 * this deployment depend on?" and "what happens if that service is down?" — and
 * they hide the third question nobody likes asking: "which of these are we
 * legally allowed to use?" Each entry here answers all three.
 *
 * The unconfigured state is a first-class value, not an error. Every integration
 * below names the feature that degrades when its variable is unset, because in
 * this platform the honest failure mode is "this feature is off", never a crash
 * and never a silent fallback to something that looks like it works.
 *
 * The entry set is drawn from `docs/REFERENCE_LINK_AUDIT_2026-10-14.md`: only
 * services whose licence permits commercial use, plus the self-hosted pieces this
 * repository has already built bridges to. AGPL services are listed with
 * `licence: 'AGPL-3.0'` and `copying: 'EXTERNAL_SERVICE_ONLY'` so that the reason
 * they are not vendored survives in the code, not just in a conclusion section.
 *
 * NO SECRET IS EVER STORED HERE. Entries carry variable *names*. `assertNoSecrets`
 * is a test, so a future edit pasting a token into this file fails CI rather than
 * shipping.
 */

export type IntegrationCategory =
  | 'AI_MODEL'
  | 'ANALYTICS'
  | 'CONTENT'
  | 'COMMUNICATION'
  | 'GRAMMAR'
  | 'REFERENCE_DATA';

export type LicenceStatus = 'MIT' | 'Apache-2.0' | 'BSD-3-Clause' | 'LGPL' | 'AGPL-3.0' | 'COMMERCIAL_TERMS' | 'SELF_HOSTED';

/** How the licence permits this platform to use the thing. */
export type CopyingPolicy =
  /** Code may be vendored or adapted with attribution. */
  | 'COPY_WITH_ATTRIBUTION'
  /** Run it as a separate process or service; do not link or vendor the code. */
  | 'EXTERNAL_SERVICE_ONLY'
  /** A hosted product used over its API under its own terms. */
  | 'HOSTED_API';

export type Integration = {
  id: string;
  name: string;
  category: IntegrationCategory;
  /** The capability this provides, in one clause. */
  purpose: string;
  /** What stops working when it is not configured. Must be a real consequence. */
  degrades: string;
  licence: LicenceStatus;
  copying: CopyingPolicy;
  /** Upstream project, when there is one. Always https. */
  projectUrl?: string;
  /** Environment variables that switch it on. Names only — never values. */
  envKeys: readonly string[];
  /** True when the platform runs a first-party fallback without this service. */
  hasFirstPartyFallback: boolean;
  /** Where the bridge lives, when it is in this repository. */
  implementedIn?: string;
};

export const INTEGRATIONS: readonly Integration[] = [
  {
    id: 'languagetool',
    name: 'LanguageTool',
    category: 'GRAMMAR',
    purpose: 'Grammar, spelling and wording feedback on writing practice.',
    degrades: 'Writing practice still works; the feedback panel reports that the checker is not configured.',
    licence: 'LGPL',
    copying: 'EXTERNAL_SERVICE_ONLY',
    projectUrl: 'https://github.com/languagetool-org/languagetool',
    envKeys: ['LANGUAGETOOL_URL'],
    hasFirstPartyFallback: true,
    implementedIn: 'src/lib/writing/grammar.ts',
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    category: 'AI_MODEL',
    purpose: 'Model routing for study guidance, evaluation assistance and internal agents.',
    degrades: 'AI-assisted features report themselves unavailable; every non-AI route keeps working.',
    licence: 'COMMERCIAL_TERMS',
    copying: 'HOSTED_API',
    projectUrl: 'https://openrouter.ai',
    envKeys: ['OPENROUTER_API_KEY', 'AI_MODEL'],
    hasFirstPartyFallback: true,
    implementedIn: 'src/lib/ai/routing',
  },
  {
    id: 'umami',
    name: 'Umami',
    category: 'ANALYTICS',
    purpose: 'Privacy-first visitor analytics when a deployment wants a dashboard rather than counters.',
    degrades: 'The first-party aggregate counters in this repository carry on; only the external dashboard is absent.',
    licence: 'MIT',
    copying: 'EXTERNAL_SERVICE_ONLY',
    projectUrl: 'https://github.com/umami-software/umami',
    envKeys: ['UMAMI_SCRIPT_URL', 'UMAMI_WEBSITE_ID'],
    hasFirstPartyFallback: true,
    implementedIn: 'src/lib/analytics/events.ts',
  },
  {
    id: 'ghost',
    name: 'Ghost',
    category: 'CONTENT',
    purpose: 'External blog and newsletter publishing, when a deployment prefers a separate CMS.',
    degrades: 'The built-in blog in this repository is used instead; nothing else changes.',
    licence: 'MIT',
    copying: 'EXTERNAL_SERVICE_ONLY',
    projectUrl: 'https://github.com/TryGhost/Ghost',
    envKeys: ['GHOST_API_URL', 'GHOST_CONTENT_API_KEY'],
    hasFirstPartyFallback: true,
    implementedIn: 'src/lib/content/blog.ts',
  },
  {
    id: 'whatsapp-cloud',
    name: 'WhatsApp Business Cloud API',
    category: 'COMMUNICATION',
    purpose: 'Inbound and outbound WhatsApp messages through the communication hub.',
    degrades: 'WhatsApp webhooks answer 503 and outbound WhatsApp sends report NOT_CONFIGURED. No message is sent unsent-and-unrecorded.',
    licence: 'COMMERCIAL_TERMS',
    copying: 'HOSTED_API',
    envKeys: ['WHATSAPP_APP_SECRET', 'WHATSAPP_ACCESS_TOKEN', 'WHATSAPP_PHONE_NUMBER_ID'],
    hasFirstPartyFallback: false,
    implementedIn: 'src/lib/crm/outbound-providers.ts',
  },
  {
    id: 'meta-messenger',
    name: 'Meta Messenger and Instagram',
    category: 'COMMUNICATION',
    purpose: 'Facebook Messenger and Instagram direct messages in the same inbox.',
    degrades: 'Those webhooks answer 503 and their channels cannot send.',
    licence: 'COMMERCIAL_TERMS',
    copying: 'HOSTED_API',
    envKeys: ['META_APP_SECRET', 'META_PAGE_ACCESS_TOKEN'],
    hasFirstPartyFallback: false,
    implementedIn: 'src/lib/crm/outbound-providers.ts',
  },
  {
    id: 'sms-provider',
    name: 'SMS gateway',
    category: 'COMMUNICATION',
    purpose: 'SMS delivery for students who gave a phone number and no messaging app.',
    degrades: 'SMS sends report NOT_CONFIGURED; the student keeps being reachable by the other channels.',
    licence: 'COMMERCIAL_TERMS',
    copying: 'HOSTED_API',
    envKeys: ['ALO_SMS_ACCESS_TOKEN', 'ALO_SMS_SEND_URL'],
    hasFirstPartyFallback: false,
    implementedIn: 'src/lib/crm/outbound-providers.ts',
  },
  {
    id: 'chatwoot',
    name: 'Chatwoot',
    category: 'COMMUNICATION',
    purpose:
      'An external shared support inbox (web, WhatsApp and email in one agent desk), when a deployment prefers a bought desk to the inbox built into this CRM.',
    degrades:
      'Nothing: the built-in CRM inbox, review queue and consent register carry on. This is an alternative, not a dependency.',
    licence: 'SELF_HOSTED',
    copying: 'EXTERNAL_SERVICE_ONLY',
    projectUrl: 'https://github.com/chatwoot/chatwoot',
    envKeys: ['CHATWOOT_API_URL', 'CHATWOOT_API_TOKEN'],
    hasFirstPartyFallback: true,
    implementedIn: 'src/app/api/crm/messages',
  },
  {
    id: 'firecrawl',
    name: 'Firecrawl',
    category: 'CONTENT',
    purpose:
      'Structured retrieval of official visa, university and test-provider pages for internal research, so guidance is written from a current source rather than a memory.',
    degrades:
      'Official-source research is done by hand in a browser. No learner-facing feature depends on it, by design.',
    licence: 'AGPL-3.0',
    copying: 'EXTERNAL_SERVICE_ONLY',
    projectUrl: 'https://github.com/firecrawl/firecrawl',
    envKeys: ['FIRECRAWL_API_KEY'],
    hasFirstPartyFallback: true,
  },
  {
    id: 'country-reference',
    name: 'Country and visa reference data',
    category: 'REFERENCE_DATA',
    purpose: 'Country names, currencies and visa-route descriptions used on the destination pages.',
    degrades: 'Destination pages show only what is stored locally; no reference data is fetched at request time.',
    licence: 'MIT',
    copying: 'COPY_WITH_ATTRIBUTION',
    projectUrl: 'https://github.com/public-apis/public-apis',
    envKeys: [],
    hasFirstPartyFallback: true,
    implementedIn: 'src/lib/alo-data.ts',
  },
];

export type IntegrationReadiness = {
  id: string;
  name: string;
  category: IntegrationCategory;
  configured: boolean;
  /** Variable names that are still unset. Never values, never partial values. */
  missingKeys: string[];
  envKeys: readonly string[];
  degrades: string;
};

/** Is one integration configured in this environment? */
export function integrationReadiness(
  integration: Integration,
  env: Record<string, string | undefined> = process.env,
): IntegrationReadiness {
  const missingKeys = integration.envKeys.filter((key) => !env[key] || String(env[key]).trim().length === 0);
  return {
    id: integration.id,
    name: integration.name,
    category: integration.category,
    // An integration with no variables is always on: it is first-party data.
    configured: missingKeys.length === 0,
    missingKeys,
    envKeys: integration.envKeys,
    degrades: integration.degrades,
  };
}

/** Readiness for every integration, in registry order. */
export function integrationReport(env: Record<string, string | undefined> = process.env): IntegrationReadiness[] {
  return INTEGRATIONS.map((integration) => integrationReadiness(integration, env));
}

export type IntegrationSummary = {
  total: number;
  configured: number;
  /** Configured integrations that have a first-party fallback. */
  degraded: Array<{ id: string; name: string; missingKeys: string[] }>;
  byCategory: Record<IntegrationCategory, { total: number; configured: number }>;
};

export function summariseIntegrations(rows: IntegrationReadiness[] = integrationReport()): IntegrationSummary {
  const byCategory = {} as IntegrationSummary['byCategory'];
  for (const row of rows) {
    const bucket = (byCategory[row.category] ??= { total: 0, configured: 0 });
    bucket.total += 1;
    if (row.configured) bucket.configured += 1;
  }

  return {
    total: rows.length,
    configured: rows.filter((row) => row.configured).length,
    degraded: rows
      .filter((row) => !row.configured)
      .map((row) => ({ id: row.id, name: row.name, missingKeys: row.missingKeys })),
    byCategory,
  };
}

/** One integration, or undefined. */
export function findIntegration(id: string): Integration | undefined {
  return INTEGRATIONS.find((integration) => integration.id === id);
}

/**
 * Guard for tests: no entry may contain an environment value. Tokens, keys and
 * long random strings are the shapes that appear when somebody pastes a working
 * configuration instead of a variable name.
 */
export function findEmbeddedSecrets(rows: readonly Integration[] = INTEGRATIONS): string[] {
  const offenders: string[] = [];
  for (const row of rows) {
    const fields = [row.id, row.name, row.purpose, row.degrades, row.projectUrl ?? '', ...row.envKeys];
    for (const field of fields) {
      if (/(?:sk|pk|key|token|secret)[-_][A-Za-z0-9]{16,}/i.test(field)) offenders.push(`${row.id}:${field}`);
      if (/[A-Za-z0-9+/]{40,}={0,2}/.test(field)) offenders.push(`${row.id}:${field}`);
    }
  }
  return offenders;
}
