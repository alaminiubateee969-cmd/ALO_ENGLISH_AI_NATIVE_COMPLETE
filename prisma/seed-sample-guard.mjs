/**
 * Guard for legacy, short-form/sample question seed scripts.
 *
 * These banks are not licensed or validated full-length exam content. They
 * must never be part of the production seed chain. Manual use is allowed only
 * when explicitly opted into against a clearly named disposable test/sample
 * SQLite database; production and unlabelled targets fail closed.
 */
export function assertSafeSampleSeedTarget() {
  const databaseUrl = process.env.DATABASE_URL || "";
  const disposableTarget =
    databaseUrl === "file::memory:" ||
    /^file:.*(?:^|[\/._-])(?:ci|test|sample)(?:[\/._-]|$)/i.test(databaseUrl);

  if (
    process.env.ALLOW_SYNTHETIC_SAMPLE_QUESTIONS !== "1" ||
    process.env.NODE_ENV === "production" ||
    !disposableTarget
  ) {
    throw new Error(
      "Refusing to seed short-form synthetic question samples. These are not validated/authorized exam banks. " +
        "If explicitly needed for disposable development, set ALLOW_SYNTHETIC_SAMPLE_QUESTIONS=1 and use a DATABASE_URL whose SQLite filename contains ci, test, or sample."
    );
  }
}
