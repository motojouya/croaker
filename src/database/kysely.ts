import Sqlite from "better-sqlite3";
import { Kysely, SqliteDialect } from "kysely";
import { Database } from "@/database/type";

export type GetKysely = () => Kysely<Database>;
export const getKysely: GetKysely = () => {
  return new Kysely<Database>({
    dialect: new SqliteDialect({
      database: new Sqlite(process.env.SQLITE_FILE),
    })
  });
};
