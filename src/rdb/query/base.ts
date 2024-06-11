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

export async function create<TE extends TableExpression<DB, keyof DB>>(
  db: Kysely,
  tableName: TE,
  newRecord: Insertable<FromTables<DB, never, TE>>
): Promise<FromTables<DB, never, TE>[]> {

  return await db.insertInto(tableName)
    .values(newRecord)
    .returningAll()
    .executeTakeFirstOrThrow();
}

export async function read<TE extends TableExpression<DB, keyof DB>>(
  db: Kysely,
  tableName: TE,
  criteria: Partial<Selectable<FromTables<DB, never, TE>>>
): Promise<FromTables<DB, never, TE>[]> {

  let query = db.selectFrom(tableName);

  for (const prop in criteria) {
    query = query.where(prop, '=', criteria[prop]);
  }

  return await query.selectAll().execute();
}

export async function update<TE extends TableExpression<DB, keyof DB>>(
  db: Kysely,
  tableName: TE,
  criteria: Partial<Selectable<FromTables<DB, never, TE>>>,
  updateWith: Updateable<FromTables<DB, never, TE>>
): Promise<FromTables<DB, never, TE>[]> {

  let command = db.updateTable(tableName).set(updateWith);

  for (const prop in criteria) {
    command = command.where(prop, '=', criteria[prop]);
  }

  return await command.returningAll().execute();
}

export async function delete<TE extends TableExpression<DB, keyof DB>>(
  db: Kysely,
  tableName: TE,
  criteria: Partial<Selectable<FromTables<DB, never, TE>>>
): Promise<FromTables<DB, never, TE>[]> {

  let command = db.deleteFrom(tableName);

  for (const prop in criteria) {
    command = command.where(prop, '=', criteria[prop]);
  }

  return await command.returningAll().execute();
}
