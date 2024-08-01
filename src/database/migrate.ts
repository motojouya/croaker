import * as path from 'path'
import { promises as fs } from 'fs'
import Sqlite from "better-sqlite3";
import {
  Kysely,
  SqliteDialect,
  Migrator,
  FileMigrationProvider,
  KyselyPlugin,
  OperationNodeTransformer,
  ValueNode,
  PluginTransformResultArgs,
  PluginTransformQueryArgs,
  RootOperationNode,
  QueryResult,
  UnknownRow,
} from "kysely";
// import { Database } from "@/database/type";
// TODO __dirnameはesmで使えないため。tsからcompileする際にどうするかは検討
// というかbuildしてdeploy時に使うほうがいいのでbuildしてesmかcommonjsになり、その後の動きが大事か
// const __dirname = import.meta.dirname;

export class SqliteBooleanPlugin implements KyselyPlugin {
  readonly transformer = new SqliteBooleanTransformer()

  transformQuery(args: PluginTransformQueryArgs): RootOperationNode {
    console.log('transformQuery');
    return this.transformer.transformNode(args.node)
  }

  transformResult(
    args: PluginTransformResultArgs
  ): Promise<QueryResult<UnknownRow>> {
    return Promise.resolve(args.result)
  }
}

class SqliteBooleanTransformer extends OperationNodeTransformer {
  transformValue(node: ValueNode): ValueNode {
    console.log('transformValue', node);
    return {
      ...super.transformValue(node),
      value: typeof node.value === 'boolean' ? (node.value ? 1 : 0) : node.value
    }
  }
}

async function migrateToLatest() {
  // const db = new Kysely<Database>({
  // FIXME baseのgetKyselyで共通化したいが、余計な依存ファイルが増えるので、別ファイルに出さないといけない
  const db = new Kysely({
    dialect: new SqliteDialect({
      database: new Sqlite(process.env.SQLITE_FILE),
    }),
    plugins: [new SqliteBooleanPlugin()],
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
