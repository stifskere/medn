
up:
    DATABASE_URL="$(./loadenv.sh)" && \
    cd backend && \
    sqlx migrate run --database-url "$DATABASE_URL"

revert:
    DATABASE_URL="$(./loadenv.sh)" && \
    cd backend && \
    sqlx migrate revert --database-url "$DATABASE_URL"