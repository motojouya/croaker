import Database from 'better-sqlite3'
import { Kysely, SqliteDialect, Transaction } from 'kysely';
import { Database as DatabaseType } from '@/rdb/type';

// This adapter exports a wrapper of the original `Kysely` class called `KyselyAuth`,
// that can be used to provide additional type-safety.
// While using it isn't required, it is recommended as it will verify
// that the database interface has all the fields that Auth.js expects.
// import { KyselyAuth } from "@auth/kysely-adapter"

let rdb?: Kysely = undefined;

type GetKysely = () => Kysely;
const getKysely: GetKysely = () => {
  if (!rdb) {
    rdb = new Kysely<DatabaseType>({
      dialect: new SqliteDialect({
        database: new Database('db.sqlite'),
      })
    });
    // rdb = new KyselyAuth<DatabaseType>({
    //   dialect: new SqliteDialect({
    //     database: new Database('db.sqlite'),
    //   })
    // });
  }
  return rdb;
};




export type GetQuery<Q> = { [K in keyof Q]: (db: Kyseky) => Q[K] };

export type DB<Q, T, R extends unknown> = Q & { transact: Transact<T, R> };

export type Transact<Q, R extends unknown> = (callback: (trx: Q) => Promise<R>) => Promise<R>;

export type DbDependedFunctions = Record<string, (db: Kyseky) => unknown>; // TODO any? unknown?

export function getDatabase<Q, T>(queries?: GetQuery<Q>, transactionQueries?: GetQuery<T>): DB<Q, T> {

  const db = getKysely();
  let dbAccess = {};

  if (queries) {
    dbAccess = Object.entries(queries).reduce((acc, [key, val]) => {
      return {
        ...acc,
        [key]: val(db),
      };
    }, dbAccess);
  }

  if (transactionQueries) {
    dbAccess['transact'] = getTransact(db, transactionQueries);
  }

  return dbAccess;
};

async function getTransact<Q, R extends unknown>(db: Kysely, queries: GetQuery<Q>): Transact<Q, R> {
  return function <R>(callback: (trx: Q) => Promise<R>): Promise<R> {

    try {
      return db.transaction().execute(trx => {

        const transactedQueries = Object.entries(queries).reduce((acc, [key, val]) => {
          return {
            ...acc,
            [key]: val(trx),
          };
        }, {});

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

// export async function transact<T>(db: Kysely, callback: (trx: Transaction) => Promise<T>): Promise<T> {
//   try {
//     return db.transaction().execute(trx => {
//       const result = callback(trx);
// 
//       if (result instanceof Error) {
//         throw result;
//       }
// 
//       return result;
//     });
// 
//   // kyselyがrollbackはerror throwを想定しているため、callback内で投げて、再度catchする
//   } catch (e) {
//     return e;
//   }
// }

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
