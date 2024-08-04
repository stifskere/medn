
CREATE TABLE sessions(
     id INTEGER PRIMARY KEY AUTO_INCREMENT,
     user_id INTEGER,
     token VARCHAR(255) NOT NULL,
     expires_at TIMESTAMP NOT NULL DEFAULT (NOW() + INTERVAL 3 HOUR)
);

ALTER TABLE sessions ADD CONSTRAINT fk_sessions_users_user_id
    FOREIGN KEY (user_id) REFERENCES users(id)