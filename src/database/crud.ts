import {
  Kysely,
  Insertable,
  Selectable,
  Updateable
} from 'kysely'
import { Database } from '@/database/type';

// TODO 型推論が途中で止まっている気がする。
// ALEのtscだと限界あるのかな。とりあえずほっておいて、実際にコンパイルしてみて結果を見る。
// 型としては、見る限りあってそうで、大丈夫そうならignoreしてしまう

export function create(db: Kysely<Database>) {
  return async function <T extends keyof Database & string>(tableName: T, newRecord: Insertable<Database[T]>): Promise<Database[T][]> {
    return await db.insertInto(tableName)
      .values(newRecord)
      .returningAll()
      .executeTakeFirstOrThrow();
  };
}

export function read(db: Kysely<Database>) {
  return async function <T extends keyof Database & string>(tableName: T, criteria: Partial<Selectable<Database[T]>>): Promise<Database[T][]> {
    let query = db.selectFrom(tableName);

    Object.entries(criteria).forEach(([key, value]) => {
      if (Object.hasOwn(criteria, key)) {
        command = command.where(key, '=', value);
      }
    });

    return await query.selectAll().execute();
  };
}

export function update(db: Kysely<Database>) {
  return async function <T extends keyof Database & string>(tableName: T, criteria: Partial<Selectable<Database[T]>>, updateWith: Updateable<Database[T]>): Promise<Database[T][]> {
    let command = db.updateTable(tableName).set(updateWith);

    Object.entries(criteria).forEach(([key, value]) => {
      if (Object.hasOwn(criteria, key)) {
        command = command.where(key, '=', value);
      }
    });

    return await command.returningAll().execute();
  };
}

export function destroy(db: Kysely<Database>) {
  return async function <T extends keyof Database & string>(tableName: T, criteria: Partial<Selectable<Database[T]>>): Promise<Database[T][]> {
    let command = db.deleteFrom(tableName);

    Object.entries(criteria).forEach(([key, value]) => {
      if (Object.hasOwn(criteria, key)) {
        command = command.where(key, '=', value);
      }
    });

    return await command.returningAll().execute();
  };
}
