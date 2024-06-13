import Database from 'better-sqlite3'
import { Kysely, SqliteDialect, Transaction } from 'kysely';
import { Database as DatabaseType } from '@/rdb/type';

// This adapter exports a wrapper of the original `Kysely` class called `KyselyAuth`,
// that can be used to provide additional type-safety.
// While using it isn't required, it is recommended as it will verify
// that the database interface has all the fields that Auth.js expects.
// import { KyselyAuth } from "@auth/kysely-adapter"

let db?: Kysely = undefined;

type GetKysely = () => Kysely;
const getKysely: GetKysely = () => {
  if (!db) {
    db = new Kysely<DatabaseType>({
      dialect: new SqliteDialect({
        database: new Database(process.env.SQLITE_FILE),
      })
    });
    // rdb = new KyselyAuth<DatabaseType>({
    //   dialect: new SqliteDialect({
    //     database: new Database('db.sqlite'),
    //   })
    // });
  }
  return db;
};

export type Query<T extends object> = {
  [K in keyof Q]: (
    Q[K] extends ((db: Kyseky) => infer Q)
      ? Q
      : never
  )
};
// export type GetQuery<Q extends object> = { [K in keyof Q]: (db: Kyseky) => Q[K] };

export type Transact<T extends object> = <R>(callback: (trx: Query<T>) => Promise<R>) => Promise<R>;

export type DB<Q extends object, T extends object> = Query<Q> & {
  transact: (
    T extends Record<never, never>
      ? undefined
      : Transact<T>
  )
};

export function getDatabase<T extends object>(queries: null, transactionQueries: T): DB<Record<never, never>, T>;
export function getDatabase<Q extends object>(queries: Q, transactionQueries: null): DB<Q, Record<never, never>>;
export function getDatabase<Q extends object, T extends object>(queries: Q | null, transactionQueries: T | null): DB<Q, T> {

  const db = getKysely();
  let dbAccess = {};

  if (queries) {
    dbAccess = Object.entries(queries).reduce((acc, [key, val]) => ({
      ...acc,
      [key]: val(db),
    }), dbAccess);
  }

  if (transactionQueries) {
    dbAccess['transact'] = getTransact(db, transactionQueries);
  }

  return dbAccess;
};

function getTransact<T extends object>(db: Kysely, queries: T): Transact<T> {
  return async function <R>(callback: (trx: Query<T>) => Promise<R>): Promise<R> {

    try {
      return db.transaction().execute(trx => {

        const transactedQueries = Object.entries(queries).reduce((acc, [key, val]) => ({
          ...acc,
          [key]: val(trx),
        }), {});

        const result = callback(transactedQueries);

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
}

export class RecordAlreadyExistError extends Error {
  override readonly name = 'lib.db.RecordAlreadyExistError' as const;
  constructor(
    readonly table: string,
    readonly data: object,
    readonly message: string,
  ) {
    super();
  }
}

export class RecordNotFoundError extends Error {
  override readonly name = 'lib.db.RecordNotFoundError' as const;
  constructor(
    readonly table: string,
    readonly keys: object,
    readonly message: string,
  ) {
    super();
  }
}
