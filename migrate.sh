#!/bin/bash

MIGRATE_COMMAND=$1
DATABASE_PATH=$2
DATABASE_FILE=$3
DB_BACKET_NAME=$4
DB_BACKET_PATH=$5

if [ "$MIGRATE_COMMAND" != "latest" ] && [ "$MIGRATE_COMMAND" != "rollback" ]; then
  echo "migrate command incorrect"
  exit 1;
fi

litestream restore -o "$DATABASE_PATH/$DATABASE_FILE" "gcs://$DB_BACKET_NAME/$DB_BACKET_PATH/$DATABASE_FILE" -if-db-not-exists -if-replica-exists
RESTORE_PID=$!
echo "$RESTORE_PID"

litestream replicate  "$DATABASE_PATH/$DATABASE_FILE" "gcs://$DB_BACKET_NAME/$DB_BACKET_PATH/$DATABASE_FILE" &
REPLICATE_PID=$!
echo "$REPLICATE_PID"

npx kysely migrate:$MIGRATE_COMMAND
echo "migrated!"
sleep 10
kill $REPLICATE_PID
