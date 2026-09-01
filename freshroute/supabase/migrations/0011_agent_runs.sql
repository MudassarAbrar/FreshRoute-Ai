-- Migration 0011: Agent Runs — cost tracking and session persistence
-- Per spec Section 9: iteration caps, token tracking, cost estimation

-- ─── agent_runs ───
CREATE TABLE IF NOT EXISTS agent_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  user_id uuid REFERENCES profiles(id),
  coordinator_agent text NOT NULL DEFAULT 'freshroute_coordinator',
  sub_agent_path text[] NOT NULL DEFAULT '{}',
  prompt_version text NOT NULL DEFAULT 'unknown',
  input_tokens int NOT NULL DEFAULT 0,
  output_tokens int NOT NULL DEFAULT 0,
  total_cost_usd numeric(10,6) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'running'
    CHECK (status IN ('running', 'completed', 'failed', 'timeout', 'cancelled')),
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  error text
);

CREATE INDEX IF NOT EXISTS idx_agent_runs_session ON agent_runs (session_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_runs_user ON agent_runs (user_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_runs_status ON agent_runs (status)
  WHERE status = 'running';

ALTER TABLE agent_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own agent runs"
  ON agent_runs FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "System can insert agent runs"
  ON agent_runs FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update agent runs"
  ON agent_runs FOR UPDATE
  USING (true);

-- ─── agent_sessions (replaces in-memory Map) ───
-- Persists conversation history so sessions survive Edge Function cold starts.
CREATE TABLE IF NOT EXISTS agent_sessions (
  id text PRIMARY KEY,
  user_id uuid REFERENCES profiles(id),
  contents jsonb NOT NULL DEFAULT '[]',
  stage text NOT NULL DEFAULT 'intake',
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agent_sessions_user ON agent_sessions (user_id, updated_at DESC);

ALTER TABLE agent_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own sessions"
  ON agent_sessions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "System can manage sessions"
  ON agent_sessions FOR ALL
  USING (true)
  WITH CHECK (true);

-- ─── Cleanup function for old agent runs (90-day retention) ───
CREATE OR REPLACE FUNCTION cleanup_old_agent_runs()
RETURNS int AS $$
DECLARE
  deleted_count int;
BEGIN
  DELETE FROM agent_runs
  WHERE completed_at < now() - interval '90 days'
    AND status IN ('completed', 'failed', 'timeout', 'cancelled');
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── Cleanup function for stale sessions (7-day retention) ───
CREATE OR REPLACE FUNCTION cleanup_stale_sessions()
RETURNS int AS $$
DECLARE
  deleted_count int;
BEGIN
  DELETE FROM agent_sessions
  WHERE updated_at < now() - interval '7 days';
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
