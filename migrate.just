
up:
    DATABASE_URL="$(./loadenv.sh)" && \
    cd backend && \
    sqlx migrate run --database-url "$DATABASE_URL"


down:
    DATABASE_URL="$(./loadenv.sh)" && \
    cd backend && \
    while true; do \
        output="$(sqlx migrate revert --database-url $DATABASE_URL)"; \
        echo "$output"; \
        if echo "$output" | grep -q 'No migrations available to revert'; then \
            break; \
        fi \
    done

revert:
    DATABASE_URL="$(./loadenv.sh)" && \
    cd backend && \
    sqlx migrate revert --database-url "$DATABASE_URL"
