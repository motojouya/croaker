import Database from 'better-sqlite3'
import { Kysely, SqliteDialect, Transaction } from 'kysely';
import { Database as DatabaseType } from '@/rdb/type';

let rdb?: Kysely = undefined;

export type GetRdb = () => Kysely;
export const getRdb: GetRdb = () => {
  if (!rdb) {
    rdb = new Kysely<DatabaseType>({
      dialect: new SqliteDialect({
        database: new Database('db.sqlite'),
      })
    });
  }
  return rdb;
};

export async function transact<T>(rdb: Kysely, callback: (trx: Transaction) => Promise<T>): Promise<T> {
  try {
    return db.transaction().execute(trx => {
      const result = callback(trx);

      if (result instanceof Error) {
        throw result;
      }

      return result;
    });

  // kyselyがrollbackはerror throwを想定しているため、callback内で投げて、再度catchする
  } catch (e) {
    return e;
  }
}

export class RecordAlreadyExistError extends Error {
  constructor(
    readonly table: string,
    readonly data: object,
    readonly message: string,
  ) {
    super();
  }
}

export class RecordNotFoundError extends Error {
  constructor(
    readonly table: string,
    readonly keys: object,
    readonly message: string,
  ) {
    super();
  }
}
