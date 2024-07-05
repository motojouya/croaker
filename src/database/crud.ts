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
} from "kysely";
import { Database } from "@/database/type";

export const getSqlNow = (db: Kysely<Database>) => () => db.fn("datetime", ["now", "localtime"]);

export function create(db: Kysely<Database>) {
  return async function <T extends keyof Database & string>(
    tableName: T,
    newRecords: ReadonlyArray<Insertable<Database[T]>>,
  ): Promise<Selectable<Database[T]>[]> {
    return await db.insertInto(tableName).values(newRecords).returningAll().execute();
  };
}

export function read(db: Kysely<Database>) {
  // return async function <T extends keyof Database & string>(
  //   tableName: T,
  //   criteria: Partial<Selectable<Database[T]>>
  // ): Promise<Selectable<Database[T]>[]> {
  return async function <T extends keyof Database & string>(
    tableName: T,
    criteria: FilterObject<Database, T>,
  ): Promise<Selectable<Database[T]>[]> {
    // @ts-ignore
    return await db
      .selectFrom(tableName)
      // @ts-ignore
      .where((eb) => eb.and(criteria))
      .selectAll()
      .execute();
  };
}

export function update(db: Kysely<Database>) {
  // return async function <T extends keyof Database & string>(
  //   tableName: T,
  //   criteria: Partial<Selectable<Database[T]>>,
  //   updateWith: Updateable<Database[T]>
  // ): Promise<Database[T][]> {
  return async function <T extends keyof Database & string>(
    tableName: T,
    criteria: FilterObject<Database, T>,
    updateWith: UpdateObject<Database, T>,
  ): Promise<Selectable<Database[T]>[]> {
    // @ts-ignore
    return await db
      .updateTable(tableName)
      // @ts-ignore
      .set(updateWith)
      // @ts-ignore
      .where((eb) => eb.and(criteria))
      .returningAll()
      .execute();
  };
}

export function destroy(db: Kysely<Database>) {
  // return async function <T extends keyof Database & string>(
  //   tableName: T,
  //   criteria: Partial<Selectable<Database[T]>>
  // ): Promise<Selectable<Database[T]>[]> {
  return async function <T extends keyof Database & string>(
    tableName: T,
    criteria: FilterObject<Database, T>,
  ): Promise<Selectable<Database[T]>[]> {
    // @ts-ignore
    return await db
      .deleteFrom(tableName)
      // @ts-ignore
      .where((eb) => eb.and(criteria))
      .returningAll()
      .execute();
  };
}
