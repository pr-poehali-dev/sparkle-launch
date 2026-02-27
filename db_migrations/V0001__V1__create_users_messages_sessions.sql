
CREATE TABLE t_p83164480_sparkle_launch.users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE t_p83164480_sparkle_launch.messages (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES t_p83164480_sparkle_launch.users(id),
    user_email VARCHAR(255) NOT NULL,
    subject VARCHAR(500) NOT NULL,
    body TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'new',
    admin_reply TEXT,
    replied_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE t_p83164480_sparkle_launch.sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES t_p83164480_sparkle_launch.users(id),
    token VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '30 days')
);

INSERT INTO t_p83164480_sparkle_launch.users (email, password_hash, is_admin)
VALUES ('atamankinartjom@yandex.ru', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMUBmerTfeaG7hn4Q4LTI8q7Ci', TRUE);
