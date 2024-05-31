import {
  kysely,
  Insertable,
  Selectable,
  Updateable
} from 'kysely'

export async function create<T>(
  db: Kysely,
  tableName: string,
  newRecord: Insertable<T>
): Promise<T[]> {

  return await db.insertInto(tableName)
    .values(newRecord)
    .returningAll()
    .executeTakeFirstOrThrow();
}

export async function read<T>(
  db: Kysely,
  tableName: string,
  criteria: Partial<Selectable<T>>
): Promise<T[]> {

  let query = db.selectFrom(tableName);

  for (const prop in criteria) {
    query = query.where(prop, '=', criteria[prop]);
  }

  return await query.selectAll().execute();
}

export async function update<T>(
  db: Kysely,
  tableName: string,
  criteria: Partial<Selectable<T>>,
  updateWith: Updateable<T>
): Promise<T[]> {

  let command = db.updateTable(tableName).set(updateWith);

  for (const prop in criteria) {
    command = command.where(prop, '=', criteria[prop]);
  }

  return await command.returningAll().execute();
}

export async function delete<T>(
  db: Kysely,
  tableName: string,
  criteria: Partial<Selectable<T>>
): Promise<T[]> {

  let command = db.deleteFrom(tableName);

  for (const prop in criteria) {
    command = command.where(prop, '=', criteria[prop]);
  }

  return await command.returningAll().execute();
}
