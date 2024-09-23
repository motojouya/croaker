import Sqlite from "better-sqlite3";
import { Kysely, SqliteDialect } from "kysely";
import { Database } from "@/database/type";
import { KyselyAuth } from "@auth/kysely-adapter";

export type GetKysely = () => Kysely<Database>;
export const getKysely: GetKysely = () => {
  console.log('db path: ', process.env.SQLITE_FILE);
  return new KyselyAuth<Database>({
    dialect: new SqliteDialect({
      database: new Sqlite(process.env.SQLITE_FILE),
    }),
  });
};
