import * as path from 'path'
import { promises as fs } from 'fs'
import Sqlite from "better-sqlite3";
import { Kysely, SqliteDialect, Migrator, FileMigrationProvider } from "kysely";
import { Database } from "@/database/type";
// import { getKysely } from '@/database/base';
// TODO __dirnameはesmで使えないため。tsからcompileする際にどうするかは検討
// というかbuildしてdeploy時に使うほうがいいのでbuildしてesmかcommonjsになり、その後の動きが大事か
const __dirname = import.meta.dirname;

async function migrateToLatest() {
  // const db = getKysely();
  const db = new Kysely<Database>({
    dialect: new SqliteDialect({
      database: new Sqlite(process.env.SQLITE_FILE),
    }),
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

migrateToLatest()
