#!/usr/bin/env sh
set -eu

PROJECT_NAME="${COMPOSE_PROJECT_NAME:-alcohol-bar-game}"
DATABASE_VOLUME="${DATABASE_VOLUME:-alcohol_bar_postgres_data}"

docker compose down --remove-orphans

for volume in $(docker volume ls -q --filter "label=com.docker.compose.project=${PROJECT_NAME}"); do
  if [ "$volume" != "$DATABASE_VOLUME" ]; then
    docker volume rm "$volume"
  fi
done

# Only unused images built for this application are removed. The PostgreSQL
# image and the named database volume are deliberately outside this filter.
docker image prune --all --force --filter "label=io.barlingo.cleanup=true"
docker builder prune --force --filter "until=168h"

echo "Cleanup complete. Preserved database volume: ${DATABASE_VOLUME}"

