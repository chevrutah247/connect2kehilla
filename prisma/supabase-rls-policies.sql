-- ============================================================
-- RLS Policies for Connect2Kehilla
-- Run this in Supabase SQL Editor after enabling RLS
-- Allows full access for the server (postgres/service_role)
-- ============================================================

-- BUSINESS
ALTER TABLE "Business" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for service role" ON "Business";
CREATE POLICY "Allow all for service role" ON "Business"
  USING (true) WITH CHECK (true);

-- LISTING
ALTER TABLE "Listing" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for service role" ON "Listing";
CREATE POLICY "Allow all for service role" ON "Listing"
  USING (true) WITH CHECK (true);

-- JOB
ALTER TABLE "Job" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for service role" ON "Job";
CREATE POLICY "Allow all for service role" ON "Job"
  USING (true) WITH CHECK (true);

-- JOBSUBSCRIPTION
ALTER TABLE "JobSubscription" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for service role" ON "JobSubscription";
CREATE POLICY "Allow all for service role" ON "JobSubscription"
  USING (true) WITH CHECK (true);

-- WORKER
ALTER TABLE "Worker" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for service role" ON "Worker";
CREATE POLICY "Allow all for service role" ON "Worker"
  USING (true) WITH CHECK (true);

-- USER
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for service role" ON "User";
CREATE POLICY "Allow all for service role" ON "User"
  USING (true) WITH CHECK (true);

-- QUERY
ALTER TABLE "Query" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for service role" ON "Query";
CREATE POLICY "Allow all for service role" ON "Query"
  USING (true) WITH CHECK (true);

-- LEAD
ALTER TABLE "Lead" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for service role" ON "Lead";
CREATE POLICY "Allow all for service role" ON "Lead"
  USING (true) WITH CHECK (true);

-- SHABBATSCHEDULE
ALTER TABLE "ShabbatSchedule" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for service role" ON "ShabbatSchedule";
CREATE POLICY "Allow all for service role" ON "ShabbatSchedule"
  USING (true) WITH CHECK (true);

-- ENUMS don't have RLS, skip those.
