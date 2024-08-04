export $(cat ./.env | xargs);

if [ -n "$MYSQL_PASSWORD" ]; then \
  echo "mysql://${MYSQL_USERNAME}:${MYSQL_PASSWORD}@${MYSQL_HOST}/${MYSQL_DATABASE}"; \
else \
  echo "mysql://${MYSQL_USERNAME}@${MYSQL_HOST}/${MYSQL_DATABASE}"; \
fi