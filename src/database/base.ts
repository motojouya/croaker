import Sqlite from 'better-sqlite3'
import { Kysely, SqliteDialect, Transaction, sql } from 'kysely';
import { Database } from '@/database/type';
import { HandleableError } from '@/lib/base/error';
import { KyselyAuth } from "@auth/kysely-adapter";

export type GetQuery = Record<string, (db: Kysely<Database>) => any>;
// const a = { a: () => 'a', b: () => 1 } as const satisfies GetQuery;
// GetQueryをsatisfiesできるがextendedなわけではないっぽいので、extends GetQueryはだめっぽ
// 実コードでコンパイルできるか試しながらやる

let db: Kysely<Database>;

export type GetKysely = () => Kysely<Database>;
export const getKysely: GetKysely = () => {
  if (!db) {
    db = new KyselyAuth<Database>({
      dialect: new SqliteDialect({
        database: new Sqlite(process.env.SQLITE_FILE),
      })
    });
  }
  return db;
};

export type Query<Q extends object> = {
  [K in keyof Q]: (
    Q[K] extends ((db: Kysely<Database>) => infer Q)
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
    dbAccess = Object.entries(queries).reduce((acc, [key, val]) => {

      if (typeof val !== 'function') {
        throw new Error('programmer should set context function!');
      }

      return {
        ...acc,
        [key]: val(db),
      };
    }, dbAccess);
  }

  if (transactionQueries) {
    dbAccess = {
      ...dbAccess,
      transact: getTransact(db, transactionQueries),
    };
  }

  return dbAccess as DB<Q, T>; // TODO as!
};

function getTransact<T extends object>(db: Kysely<Database>, queries: T): Transact<T> {
  return async function <R>(callback: (trx: Query<T>) => Promise<R>): Promise<R> {

    try {
      return db.transaction().execute(trx => {

        const transactedQueries = Object.entries(queries).reduce((acc, [key, val]) => {

          if (typeof val !== 'function') {
            throw new Error('programmer should set context function!');
          }

          return {
            ...acc,
            [key]: val(trx),
          };
        }, {}) as Query<T>;

        const result = callback(transactedQueries);

        if (result instanceof Error) {
          throw result;
        }

        return result;
      });

    // kyselyがrollbackはerror throwを想定しているため、callback内で投げて、再度catchする
    } catch (e) {
      if (e instanceof HandleableError) {
        // @ts-ignore
        return e;
      }
      throw e;
    }
  }
}

export const sqlNow = () => sql`now()`;

export class RecordAlreadyExistError extends HandleableError {
  override readonly name = 'lib.db.RecordAlreadyExistError' as const;
  constructor(
    readonly table: string,
    readonly data: object,
    readonly message: string,
  ) {
    super();
  }
}

export class RecordNotFoundError extends HandleableError {
  override readonly name = 'lib.db.RecordNotFoundError' as const;
  constructor(
    readonly table: string,
    readonly keys: object,
    readonly message: string,
  ) {
    super();
  }
}
