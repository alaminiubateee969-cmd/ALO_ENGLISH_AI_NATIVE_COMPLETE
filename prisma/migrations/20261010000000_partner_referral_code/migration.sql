-- Give each partner a shareable referral identifier. Existing partner rows stay
-- NULL until the partner profile endpoint lazily assigns a code.
ALTER TABLE "Partner" ADD COLUMN "referralCode" TEXT;
CREATE UNIQUE INDEX "Partner_referralCode_key" ON "Partner"("referralCode");
