
CREATE TABLE metadata(
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    user_id INTEGER,
    name VARCHAR(255) NOT NULL,
    path VARCHAR(255) NOT NULL,
    size INTEGER NOT NULL,
    public SMALLINT(1) NOT NULL DEFAULT 1
);

ALTER TABLE metadata ADD CONSTRAINT fk_metadata_users_user_id
    FOREIGN KEY (user_id) REFERENCES users(id)