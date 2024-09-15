#!/bin/bash

set -Ceux

MIGRATE_COMMAND=$1
DATABASE_FILE=$2
DB_BUCKET_NAME=$3
DB_BUCKET_PATH=$4

if [ "$MIGRATE_COMMAND" != "latest" ] && [ "$MIGRATE_COMMAND" != "rollback" ]; then
  echo "migrate command incorrect"
  exit 1;
fi

litestream restore -if-db-not-exists -if-replica-exists -o "$DATABASE_FILE" "gcs://$DB_BUCKET_NAME/$DB_BUCKET_PATH/$DATABASE_FILE"
litestream replicate "$DATABASE_FILE" "gcs://$DB_BUCKET_NAME/$DB_BUCKET_PATH/$DATABASE_FILE" &
REPLICATE_PID=$!

npx kysely migrate:$MIGRATE_COMMAND
sleep 10
kill $REPLICATE_PID
