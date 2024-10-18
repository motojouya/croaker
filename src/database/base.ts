import { Kysely } from "kysely";
import { Database } from "@/database/type";
import { Fail } from "@/lib/base/fail";
import { getKysely } from "@/database/kysely";

/*
 * DBは、各Query,Update文ごとに名前空間を切り、独立したモジュールとして扱う。
 * 利用時は、複数のQueryモジュールを利用することになるが、getDatabase関数を利用して一つのオブジェクトとし、Caseにbindされる形を取る。
 * getDatabaseの第一引数はトランザクション外、第二引数はトランザクション内で呼び出すもの。
 * トランザクションは、Case上の任意のタイミングで呼び出せる形を取る。
 */
export type GetQuery = Record<string, (db: Kysely<Database>) => unknown>;

let db: Kysely<Database>;

export type Query<Q extends GetQuery> = {
  [K in keyof Q]: Q[K] extends (db: Kysely<Database>) => infer F ? F : never;
};

export type Transact<T extends GetQuery> = <R>(callback: (trx: Query<T>) => Promise<R>) => Promise<R>;

// T extends Record<never, never> だと普通に成立するので逆にしておく
export type DB<Q extends GetQuery, T extends GetQuery> = Query<Q> & {
  transact: Record<never, never> extends T ? undefined : Transact<T>;
};

export function getDatabase<T extends GetQuery>(queries: null, transactionQueries: T): DB<Record<never, never>, T>;
export function getDatabase<Q extends GetQuery>(queries: Q, transactionQueries: null): DB<Q, Record<never, never>>;
export function getDatabase<Q extends GetQuery, T extends GetQuery>(queries: Q, transactionQueries: T): DB<Q, T>;
export function getDatabase<Q extends GetQuery, T extends GetQuery>(
  queries: Q | null,
  transactionQueries: T | null,
): DB<Q, T> {
  if (!db) {
    db = getKysely();
  }
  let dbAccess = {};

  if (queries) {
    dbAccess = getQueries(db, queries, dbAccess);
  }

  if (transactionQueries) {
    dbAccess = {
      ...dbAccess,
      transact: getTransact(db, transactionQueries),
    };
  }

  return dbAccess as DB<Q, T>; // FIXME as!
}

function getTransact<T extends GetQuery>(db: Kysely<Database>, queries: T): Transact<T> {
  return async function <R>(callback: (trx: Query<T>) => Promise<R>): Promise<R> {
    try {
      return db.transaction().execute((trx) => {
        const transactedQueries = getQueries(trx, queries, {});

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
  };
}

function getQueries<T extends GetQuery>(db: Kysely<Database>, queries: T, acc: object): Query<T> {
  return Object.entries(queries).reduce((acc, [key, val]) => {
    if (typeof val !== "function") {
      throw new Error("programmer should set context function!");
    }

    if (!Object.hasOwn(queries, key)) {
      return acc;
    }

    return {
      ...acc,
      [key]: val(db),
    };
  }, acc) as Query<T>; // FIXME as!
}

// export class DatabaseFail extends Fail {
//   constructor(
//     readonly cause: Error,
//     readonly message: string,
//   ) {
//     super("lib.db.DatabaseFail");
//   }
// }
// export const isDatabaseFail = isFailJSON(new DatabaseFail(new Error('demo') ""));
//
// export type Query<Q extends GetQuery> = {
//   [K in keyof Q]: Q[K] extends (db: Kysely<Database>) => infer F
//     ? F extends (...args: [...(infer A)]) => Promise<infer R>
//       ? (...args: [...A]) => Promise<R | DatabaseFail>
//       : F
//     : never;
// };
// function tryCatchQuery(db: Kysely<Database>, getQuery: (db: Kysely<Database>) => unknown) {
//
//   const query = getQuery(db);
//
//   if (typeof query !== 'function') {
//     return query;
//   }
//
//   // @ts-ignore
//   return async (...args) => {
//     try {
//       return await query(...args);
//     } catch(e) {
//       if (e instanceof Error) {
//         return new DatabaseFail(e, 'something happened on database');
//       } else {
//         return new DatabaseFail(new Error(), 'something happened. but not on database');
//       }
//     }
//   };
// }
