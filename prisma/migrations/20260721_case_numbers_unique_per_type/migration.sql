-- Case numbers are unique within each register type, not across all registers.
-- This allows, for example, black number 11/67 to exist once in ร้องทุกข์
-- and once in อุทธรณ์ without losing either record.

DROP INDEX IF EXISTS "Case_blackNumber_key";
DROP INDEX IF EXISTS "Case_redNumber_key";

CREATE UNIQUE INDEX IF NOT EXISTS "Case_type_blackNumber_key"
  ON "Case" ("type", "blackNumber");

CREATE UNIQUE INDEX IF NOT EXISTS "Case_type_redNumber_key"
  ON "Case" ("type", "redNumber");
