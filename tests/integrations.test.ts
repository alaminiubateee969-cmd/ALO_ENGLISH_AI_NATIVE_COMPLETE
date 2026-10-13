/**
 * tests/integrations.test.ts
 *
 * The registry is documentation that CI can enforce. Four invariants:
 *
 *   1. No secret is ever embedded — variable names only.
 *   2. Every entry says what degrades when it is off, because "optional" is not a
 *      consequence an operator can plan around.
 *   3. Copyleft services are marked service-only, so the licence conclusion from
 *      the reference audit survives in code.
 *   4. Readiness reads the environment and reports missing variable names, never
 *      values.
 */

import { describe, expect, test } from 'bun:test';
import {
  INTEGRATIONS,
  findEmbeddedSecrets,
  findIntegration,
  integrationReadiness,
  integrationReport,
  summariseIntegrations,
} from '../src/lib/integrations/registry';

describe('the registry is safe to publish', () => {
  test('no entry contains anything shaped like a secret', () => {
    expect(findEmbeddedSecrets()).toEqual([]);
  });

  test('every entry explains what stops working without it', () => {
    for (const integration of INTEGRATIONS) {
      expect(integration.degrades.length).toBeGreaterThan(20);
      expect(integration.purpose.length).toBeGreaterThan(10);
    }
  });

  test('ids are unique and every project url is https', () => {
    const ids = INTEGRATIONS.map((integration) => integration.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const integration of INTEGRATIONS) {
      if (integration.projectUrl) expect(integration.projectUrl.startsWith('https://')).toBe(true);
    }
  });

  test('copyleft services are marked external-service-only', () => {
    const copyleft = INTEGRATIONS.filter(
      (integration) => integration.licence === 'LGPL' || integration.licence === 'AGPL-3.0',
    );
    expect(copyleft.length).toBeGreaterThan(0);
    for (const integration of copyleft) {
      expect(integration.copying).toBe('EXTERNAL_SERVICE_ONLY');
    }
  });

  test('anything requiring credentials names the variables that carry them', () => {
    for (const integration of INTEGRATIONS) {
      if (integration.copying === 'HOSTED_API') {
        expect(integration.envKeys.length).toBeGreaterThan(0);
      }
    }
  });

  test('environment variable names are upper snake case', () => {
    for (const integration of INTEGRATIONS) {
      for (const key of integration.envKeys) {
        expect(key).toMatch(/^[A-Z][A-Z0-9_]*$/);
      }
    }
  });
});

describe('readiness', () => {
  const languageTool = findIntegration('languagetool');
  const countryData = findIntegration('country-reference');

  test('an unset variable is reported by name, and the integration is off', () => {
    if (!languageTool) throw new Error('languagetool must be in the registry');
    const readiness = integrationReadiness(languageTool, {});
    expect(readiness.configured).toBe(false);
    expect(readiness.missingKeys).toEqual(['LANGUAGETOOL_URL']);
    expect(readiness.envKeys).toContain('LANGUAGETOOL_URL');
  });

  test('a set variable turns it on, and its value is never returned', () => {
    if (!languageTool) throw new Error('languagetool must be in the registry');
    const readiness = integrationReadiness(languageTool, { LANGUAGETOOL_URL: 'http://127.0.0.1:8010' });
    expect(readiness.configured).toBe(true);
    expect(readiness.missingKeys).toEqual([]);
    expect(JSON.stringify(readiness)).not.toContain('8010');
  });

  test('whitespace is not configuration', () => {
    if (!languageTool) throw new Error('languagetool must be in the registry');
    expect(integrationReadiness(languageTool, { LANGUAGETOOL_URL: '   ' }).configured).toBe(false);
  });

  test('a first-party capability with no variables is always on', () => {
    if (!countryData) throw new Error('country-reference must be in the registry');
    expect(countryData.envKeys).toEqual([]);
    expect(integrationReadiness(countryData, {}).configured).toBe(true);
  });

  test('multi-variable integrations need all of them', () => {
    const whatsapp = findIntegration('whatsapp-cloud');
    if (!whatsapp) throw new Error('whatsapp-cloud must be in the registry');
    const partial = integrationReadiness(whatsapp, { WHATSAPP_APP_SECRET: 'x'.repeat(24) });
    expect(partial.configured).toBe(false);
    expect(partial.missingKeys).toEqual(['WHATSAPP_ACCESS_TOKEN', 'WHATSAPP_PHONE_NUMBER_ID']);
  });
});

describe('summary', () => {
  test('an empty environment leaves only the first-party entries configured', () => {
    const rows = integrationReport({});
    const summary = summariseIntegrations(rows);
    expect(summary.total).toBe(INTEGRATIONS.length);
    expect(summary.configured).toBeLessThan(summary.total);
    expect(summary.degraded.length).toBe(summary.total - summary.configured);
    expect(summary.degraded.every((row) => row.missingKeys.length > 0)).toBe(true);
  });

  test('categories are counted consistently', () => {
    const summary = summariseIntegrations(integrationReport({}));
    const totals = Object.values(summary.byCategory).reduce((sum, bucket) => sum + bucket.total, 0);
    expect(totals).toBe(summary.total);
  });

  test('the report is deterministic', () => {
    expect(integrationReport({})).toEqual(integrationReport({}));
  });
});
