DROP TABLE IF EXISTS reset_password_tokens;

CREATE TABLE IF NOT EXISTS reset_password_tokens
(
    id      uuid          DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES users (id) ON DELETE CASCADE,
    created timestamp NOT NULL DEFAULT NOW(),
    expired timestamp NOT NULL DEFAULT NOW() + interval '1' day
);