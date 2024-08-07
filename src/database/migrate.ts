import * as path from 'path'
import { promises as fs } from 'fs'
import { Kysely, SqliteDialect, Migrator, FileMigrationProvider } from "kysely";
import Sqlite from "better-sqlite3";

async function migrateToLatest() {
  const db = new Kysely({
    dialect: new SqliteDialect({
      database: new Sqlite(process.env.SQLITE_FILE),
    })
  });

  const migrator = new Migrator({
    db,
    provider: new FileMigrationProvider({
      fs,
      path,
      migrationFolder: path.join(__dirname, './migration'),
    }),
  })

  const { error, results } = await migrator.migrateToLatest()

  if (results) {
    results.forEach((it) => {
      if (it.status === 'Success') {
        console.log(`migration "${it.migrationName}" was executed successfully`)
      } else if (it.status === 'Error') {
        console.error(`failed to execute migration "${it.migrationName}"`)
      }
    })
  }

  if (error) {
    console.error('failed to migrate')
    console.error(error)
    process.exit(1)
  }

  await db.destroy()
}

migrateToLatest();
