import Sqlite from "better-sqlite3";
import { Kysely, SqliteDialect } from "kysely";
import { Database } from "@/database/type";
import { KyselyAuth } from "@auth/kysely-adapter";
import fs from "fs";

export type GetKysely = () => Kysely<Database>;
export const getKysely: GetKysely = () => {
  const exists = fs.existsSync(process.env.SQLITE_FILE || "");
  console.log("db path: ", process.env.SQLITE_FILE, exists);
  const stat = fs.statSync(process.env.SQLITE_FILE || "");
  console.log("db stat: ", stat);
  // @ts-ignore
  const permission = (stat.mode & parseInt(777, 8)).toString(8);
  console.log("db permission: ", permission);
  return new KyselyAuth<Database>({
    dialect: new SqliteDialect({
      database: new Sqlite(process.env.SQLITE_FILE),
    }),
  });
};
