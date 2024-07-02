import Sqlite from 'better-sqlite3'
import { Kysely, SqliteDialect, Transaction, sql, expressionBuilder } from 'kysely';
import { Database } from '@/database/type';
import { Fail, isFailJSON } from '@/lib/base/fail';
import { KyselyAuth } from "@auth/kysely-adapter";

export type GetQuery = Record<string, (db: Kysely<Database>) => unknown>;

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

export type Query<Q extends GetQuery> = {
  [K in keyof Q]: (
    Q[K] extends ((db: Kysely<Database>) => infer Q)
      ? Q
      : never
  )
};

export type Transact<T extends GetQuery> = <R>(callback: (trx: Query<T>) => Promise<R>) => Promise<R>;

// T extends Record<never, never> だと普通に成立するので逆にしておく
export type DB<Q extends GetQuery, T extends GetQuery> = Query<Q> & {
  transact: (
    Record<never, never> extends T
      ? undefined
      : Transact<T>
  )
};

export function getDatabase<T extends GetQuery>(queries: null, transactionQueries: T): DB<Record<never, never>, T>;
export function getDatabase<Q extends GetQuery>(queries: Q, transactionQueries: null): DB<Q, Record<never, never>>;
export function getDatabase<Q extends GetQuery, T extends GetQuery>(queries: Q, transactionQueries: T): DB<Q, T>;
export function getDatabase<Q extends GetQuery, T extends GetQuery>(queries: Q | null, transactionQueries: T | null): DB<Q, T> {

  const db = getKysely();
  let dbAccess = {};

  if (queries) {
    dbAccess = getQuery(db, queries, dbAccess);
  }

  if (transactionQueries) {
    dbAccess = {
      ...dbAccess,
      transact: getTransact(db, transactionQueries),
    };
  }

  return dbAccess as DB<Q, T>; // FIXME as!
};

function getTransact<T extends GetQuery>(db: Kysely<Database>, queries: T): Transact<T> {
  return async function <R>(callback: (trx: Query<T>) => Promise<R>): Promise<R> {

    try {
      return db.transaction().execute(trx => {

        const transactedQueries = getQuery(db, queries, {});

        const result = callback(transactedQueries);

        if (result instanceof Fail) {
          throw result;
        }

        return result;
      });

    // kyselyがrollbackはerror throwを想定しているため、callback内で投げて、再度catchする
    } catch (e) {
      if (e instanceof Fail) {
        // @ts-ignore
        return e;
      }
      throw e;
    }
  }
}

function getQuery<T extends GetQuery>(db: Kysely<Database>, queries: T, acc: object): Query<T> {

  return Object.entries(queries).reduce((acc, [key, val]) => {

    if (typeof val !== 'function') {
      throw new Error('programmer should set context function!');
    }

    if (!Object.hasOwn(queries, key)) {
      return acc;
    }

    return {
      ...acc,
      [key]: val(db),
    };
  }, acc) as Query<T>; // FIXME as!
};

export const getSqlNow = (db: Kysely<Database>) => () => db.fn('datetime', ['now', 'localtime']);

export class RecordAlreadyExistFail extends Fail {
  constructor(
    readonly table: string,
    readonly data: object,
    readonly message: string,
  ) {
    super('lib.db.RecordAlreadyExistFail');
  }
}

export class RecordNotFoundFail extends Fail {
  constructor(
    readonly table: string,
    readonly keys: object,
    readonly message: string,
  ) {
    super('lib.db.RecordNotFoundFail');
  }
}

export class MutationFail extends Fail {
  constructor(
    readonly action: string,
    readonly table: string,
    readonly value: object,
    readonly message: string,
  ) {
    super('lib.db.MutationFail');
  }
}
