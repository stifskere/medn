
CREATE TABLE shared_files (
    id INTEGER PRIMARY KEY AUTO_INCREMENT,
    target INTEGER REFERENCES users(id),
    metadata INTEGER REFERENCES metadata(id)
);
