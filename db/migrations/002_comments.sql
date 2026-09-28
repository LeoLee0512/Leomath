-- LeoMath v0.1.3: comments on concepts, experiments and software pages.
CREATE TABLE IF NOT EXISTS comments (
  id           BIGSERIAL PRIMARY KEY,
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_type  TEXT NOT NULL CHECK (target_type IN ('concept', 'experiment', 'software')),
  target_slug  TEXT NOT NULL,
  body         TEXT NOT NULL CHECK (char_length(body) BETWEEN 1 AND 2000),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Soft delete: the row stays for moderation history, the site hides it.
  deleted_at   TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS comments_target_idx ON comments(target_type, target_slug, created_at);
CREATE INDEX IF NOT EXISTS comments_user_idx ON comments(user_id, created_at DESC);
