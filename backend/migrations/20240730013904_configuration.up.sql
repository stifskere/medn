
CREATE TABLE configuration(
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL UNIQUE,
    value VARCHAR(500)
);