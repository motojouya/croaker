import Database from 'better-sqlite3'
import { Kysely, SqliteDialect, Transaction } from 'kysely';
import { Database as DatabaseType } from '@/rdb/type';

// This adapter exports a wrapper of the original `Kysely` class called `KyselyAuth`,
// that can be used to provide additional type-safety.
// While using it isn't required, it is recommended as it will verify
// that the database interface has all the fields that Auth.js expects.
// import { KyselyAuth } from "@auth/kysely-adapter"

let rdb?: Kysely = undefined;

type GetRdb = () => Kysely;
const getRdb: GetRdb = () => {
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

export type GetDatabase = (funcs?: DbDependedFunctions, transactionFuncs?: DbDependedFunctions) => 
export const getDatabase: GetDatabase = (funcs, transactionFuncs) => {

  const db = getRdb();
  let dbAccess = {};

  if (funcs) {
    dbAccess = Object.entries(funcs).reduce((acc, [key, val]) => {
      return {
        ...acc,
        [key]: val(db),
      };
    }, dbAccess);
  }

  if (transactionFuncs) {
    dbAccess['transact'] = transact(db, transactionFuncs);
  }

  return dbAccess;
};

export type DbDependedFunctions = Record<string, (db: Kyseky) => unknown>; // TODO any? unknown?

async function transact(db: Kysely, funcs: DbDependedFunctions) {
  return function <T>(callback: (trx: Transaction) => Promise<T>): Promise<T> {

    try {
      return db.transaction().execute(trx => {

        const transactedFuncs = Object.entries(funcs).reduce((acc, [key, val]) => {
          return {
            ...acc,
            [key]: val(trx),
          };
        }, {});

        const result = callback(transactedFuncs);

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
