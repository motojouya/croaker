#!/bin/bash

set -Ceux

MIGRATE_COMMAND=$1
DATABASE_FILE=$3
DB_BACKET_NAME=$4
DB_BACKET_PATH=$5

if [ "$MIGRATE_COMMAND" != "latest" ] && [ "$MIGRATE_COMMAND" != "rollback" ]; then
  echo "migrate command incorrect"
  exit 1;
fi

litestream restore -if-db-not-exists -if-replica-exists -o "$DATABASE_FILE" "gcs://$DB_BACKET_NAME/$DB_BACKET_PATH/$DATABASE_FILE"
litestream replicate "$DATABASE_FILE" "gcs://$DB_BACKET_NAME/$DB_BACKET_PATH/$DATABASE_FILE" &
REPLICATE_PID=$!

npx kysely migrate:$MIGRATE_COMMAND
sleep 10
kill $REPLICATE_PID
