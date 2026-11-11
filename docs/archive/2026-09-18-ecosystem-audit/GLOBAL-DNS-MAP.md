# GLOBAL DNS MAP (§45) — 2026-09-18

## Constraints of this inspection
Sandbox has NO raw network (no dig/nslookup/whois). DNS was therefore verified only
*implicitly* (a successful HTTPS fetch proves resolution). No zone data, NS/SOA/MX/TXT/
SPF/DKIM/DMARC/CAA records were retrievable → all email-security and CAA checks are
NOT VERIFIED (OWNER ACTION REQUIRED at the DNS provider).

| Domain | Resolves | Authoritative NS | A/AAAA | MX | SPF/DKIM/DMARC | CAA | Wildcard? |
|---|---|---|---|---|---|---|---|
| english.aloeducation.com | ✅ (implicit) | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN |
| aloeducation.com | ✅ (implicit) | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN |
| alolabs.net (+4 subs) | ✅ root; subs UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN |
| icla-global.com | ✅ (implicit) | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN |
| bdtech360.com | ✅ (implicit) | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN |
| learn.aloeducation.com, icla-global.in, alaminn.info, ecotechbd.com, neelacholcityagro.com, uninotary.com, hosting/agents/panel/marketing.alolabs.net, markting.alolabs.net | NOT VERIFIED (fetch failed — NXDOMAIN vs down indistinguishable) | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN | UNKNOWN |

## Owner-run DNS checklist (one command batch at the DNS provider)
1. Export zone files for all 9 domains (§4 authorized sources only).
2. Verify every intended subdomain has an explicit record; flag wildcards (`*.`) (§129).
3. Add/verify SPF+DKIM+DMARC for mail-sending domains; add CAA for issuance control (§45/§46).
4. Check `markting.alolabs.net` explicitly: exists? legacy? delete-with-evidence decision (§2.16, §127).
5. Dangling-CNAME / takeover sweep for all subdomains (§128).
6. NEVER change nameservers automatically (§45 honored — none touched).
