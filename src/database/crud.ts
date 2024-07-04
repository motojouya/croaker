import {
  Kysely,
  Insertable,
  Selectable,
  Updateable,
  InsertObject,
  UpdateObject,
  AnyColumn,
  ExtractTypeFromReferenceExpression,
  ReferenceExpression,
  OperandValueExpressionOrList,
  FilterObject,
} from 'kysely'
import { Database } from '@/database/type';

// TODO 型推論が途中で止まっている気がする。
// ALEのtscだと限界あるのかな。とりあえずほっておいて、実際にコンパイルしてみて結果を見る。
// 型としては、見る限りあってそうで、大丈夫そうならignoreしてしまう
//
// ExtractTableAliasがストッパーになってる気がする。ExtractTableAlias<DB, T>するとaliasが渡されるけど、ここでtableが型情報から落ちる。
// でも呼び出した先のSelectQueryBuilderはaliasというよりtableを欲しがっているように読めるので、混乱する

// type NonSpaceString<T> = T extends `${string} as ${string}` ? never : T;
// export type ExtractTableAlias<DB, TE> = TE extends keyof DB ? TE :
//   TE extends `${string} as ${infer TA}` ?
//     TA extends keyof DB ? TA : never :
//     never;

export const getSqlNow = (db: Kysely<Database>) => () => db.fn('datetime', ['now', 'localtime']);

export function create(db: Kysely<Database>) {
  return async function <T extends keyof Database & string>(tableName: T, newRecords: ReadonlyArray<Insertable<Database[T]>>): Promise<Selectable<Database[T]>[]> {
    return await db.insertInto(tableName)
      .values(newRecords)
      .returningAll()
      .execute();
  };
}

export function read(db: Kysely<Database>) {
  // return async function <T extends keyof Database & string>(tableName: T, criteria: Partial<Selectable<Database[T]>>): Promise<Selectable<Database[T]>[]> {
  return async function <T extends keyof Database & string>(tableName: T, criteria: FilterObject<Database, T>): Promise<Selectable<Database[T]>[]> {
    return await db
      .selectFrom(tableName)
      .where((eb) => eb.and(criteria))
      .selectAll()
      .execute();
  };
}

export function update(db: Kysely<Database>) {
  // return async function <T extends keyof Database & string>(tableName: T, criteria: Partial<Selectable<Database[T]>>, updateWith: Updateable<Database[T]>): Promise<Database[T][]> {
  return async function <T extends keyof Database & string>(tableName: T, criteria: FilterObject<Database, T>, updateWith: UpdateObject<Database, T>): Promise<Selectable<Database[T]>[]> {
    return await db
      .updateTable(tableName)
      .set(updateWith)
      .where((eb) => eb.and(criteria))
      .returningAll()
      .execute();
  };
}

export function destroy(db: Kysely<Database>) {
  // return async function <T extends keyof Database & string>(tableName: T, criteria: Partial<Selectable<Database[T]>>): Promise<Selectable<Database[T]>[]> {
  return async function <T extends keyof Database & string>(tableName: T, criteria: FilterObject<Database, T>): Promise<Selectable<Database[T]>[]> {
    return await db
      .deleteFrom(tableName)
      .where((eb) => eb.and(criteria))
      .returningAll()
      .execute();
  };
}
