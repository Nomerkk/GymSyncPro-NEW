CREATE TABLE IF NOT EXISTS "audit_logs" (
  "id" varchar PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" varchar REFERENCES "users"("id"),
  "action" varchar NOT NULL,
  "entity_id" varchar,
  "entity_type" varchar,
  "details" jsonb,
  "ip_address" varchar,
  "user_agent" varchar,
  "created_at" timestamp DEFAULT now()
);
