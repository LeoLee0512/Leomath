-- Moderator rights live on the account itself, not in an email list: email addresses are not verified,
-- so matching on them let whoever registered (or re-registered after a deletion) a listed address moderate.
-- Grant with: UPDATE users SET is_admin = true WHERE email = '…';
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT false;
