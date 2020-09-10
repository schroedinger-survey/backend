CREATE TABLE IF NOT EXISTS reset_password_token
(
    id      uuid          DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES users (id) ON DELETE CASCADE,
    created DATE NOT NULL DEFAULT CURRENT_DATE,
    expired DATE NOT NULL DEFAULT CURRENT_DATE + interval '1' HOUR
);