import {
  kysely,
  Insertable,
  Selectable,
  Updateable
} from 'kysely'
import {
  TableExpression,
  FromTables,
} from 'kysely/parser/table-parser';
import { Database } from '@/rdb/type';

export function create(db: Kysely) {
  return async function <TE extends TableExpression<Database, keyof Database>>(tableName: TE, newRecord: Insertable<FromTables<Database, never, TE>>): Promise<FromTables<Database, never, TE>[]> {
    return await db.insertInto(tableName)
      .values(newRecord)
      .returningAll()
      .executeTakeFirstOrThrow();
  };
}

export function read(db: Kysely) {
  return async function <TE extends TableExpression<Database, keyof Database>>(tableName: TE, criteria: Partial<Selectable<FromTables<Database, never, TE>>>): Promise<FromTables<Database, never, TE>[]> {
    let query = db.selectFrom(tableName);

    for (const prop in criteria) {
      query = query.where(prop, '=', criteria[prop]);
    }

    return await query.selectAll().execute();
  };
}

export function update(db: Kysely) {
  return async function <TE extends TableExpression<Database, keyof Database>>(tableName: TE, criteria: Partial<Selectable<FromTables<Database, never, TE>>>, updateWith: Updateable<FromTables<Database, never, TE>>): Promise<FromTables<Database, never, TE>[]> {
    let command = db.updateTable(tableName).set(updateWith);

    for (const prop in criteria) {
      command = command.where(prop, '=', criteria[prop]);
    }

    return await command.returningAll().execute();
  };
}

export async function delete(db: Kysely) {
  return async function <TE extends TableExpression<Database, keyof Database>>(tableName: TE, criteria: Partial<Selectable<FromTables<Database, never, TE>>>): Promise<FromTables<Database, never, TE>[]> {
    let command = db.deleteFrom(tableName);

    for (const prop in criteria) {
      command = command.where(prop, '=', criteria[prop]);
    }

    return await command.returningAll().execute();
  };
}
