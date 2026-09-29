$ErrorActionPreference = 'Stop'
$projectName = if ($env:COMPOSE_PROJECT_NAME) { $env:COMPOSE_PROJECT_NAME } else { 'alcohol-bar-game' }
$databaseVolume = if ($env:DATABASE_VOLUME) { $env:DATABASE_VOLUME } else { 'alcohol_bar_postgres_data' }

docker compose down --remove-orphans

$volumes = docker volume ls -q --filter "label=com.docker.compose.project=$projectName"
foreach ($volume in $volumes) {
  if ($volume -and $volume -ne $databaseVolume) {
    docker volume rm $volume
  }
}

docker image prune --all --force --filter 'label=io.barlingo.cleanup=true'
docker builder prune --force --filter 'until=168h'

Write-Host "Cleanup complete. Preserved database volume: $databaseVolume"

