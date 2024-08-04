mod migrate

setup:
    cd frontend && npm install && \
    cd ../backend && cargo build && \
    echo "DATABASE_URL=$(./loadenv.sh)" >> .env && \
    cargo sqlx prepare && \
    just migrate up && \
    echo "Project is now setup, you may run \`just dev\` to start the development server"

dev:
    cd frontend && npm run dev &
    cd backend && MEDN_MODE=dev cargo watch -x run
    || pkill -9 webpack && pkill -9 cargo

build:
