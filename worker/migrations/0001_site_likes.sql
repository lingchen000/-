CREATE TABLE IF NOT EXISTS site_likes (
  scope TEXT NOT NULL CHECK (scope = 'site'),
  visitor_hash TEXT NOT NULL CHECK (length(visitor_hash) = 64),
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  PRIMARY KEY (scope, visitor_hash)
);

CREATE INDEX IF NOT EXISTS site_likes_created_at_idx
  ON site_likes (created_at);
