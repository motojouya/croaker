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
} from 'kysely'
import { Database } from '@/database/type';
import { MutationFail } from '@/database/base';

// TODO 型推論が途中で止まっている気がする。
// ALEのtscだと限界あるのかな。とりあえずほっておいて、実際にコンパイルしてみて結果を見る。
// 型としては、見る限りあってそうで、大丈夫そうならignoreしてしまう
//
// ExtractTableAliasがストッパーになってる気がする。ExtractTableAlias<DB, T>するとaliasが渡されるけど、ここでtableが型情報から落ちる。
// でも呼び出した先のSelectQueryBuilderはaliasというよりtableを欲しがっているように読めるので、混乱する

type KeyValue<T extends keyof Database & string> = [ReferenceExpression<Database, T>, OperandValueExpressionOrList<Database, T, ReferenceExpression<Database, T>>];

export function create(db: Kysely<Database>) {
  return async function <T extends keyof Database & string>(tableName: T, newRecords: ReadonlyArray<Insertable<Database[T]>>): Promise<Selectable<Database[T]>[] | MutationFail> {

    const recordCount = newRecords.length;

    const result = await db.insertInto(tableName)
      .values(newRecords)
      .returningAll()
      .execute();

    if (result.length !== recordCount) {
      return new MutationFail('insert', tableName, newRecords, `${tableName}テーブルへのinsertに失敗しました`);
    }

    return result;
  };
}

export function read(db: Kysely<Database>) {
  return async function <T extends keyof Database & string>(tableName: T, criteria: Partial<Selectable<Database[T]>>): Promise<Selectable<Database[T]>[]> {
    let query = db.selectFrom(tableName);

    // @ts-ignore
    Object.entries(criteria).forEach(([key, value]: KeyValue<T>) => {
      // @ts-ignore
      if (Object.hasOwn(criteria, key)) {
        query = query.where(key, '=', value);
      }
    });

    return await query.selectAll().execute();
  };
}

export function update(db: Kysely<Database>) {
  return async function <T extends keyof Database & string>(tableName: T, criteria: Partial<Selectable<Database[T]>>, updateWith: Updateable<Database[T]>): Promise<Selectable<Database[T]>[]> {
    let command = db.updateTable(tableName).set(updateWith);

    // @ts-ignore
    Object.entries(criteria).forEach(([key, value]: KeyValue<T>) => {
      // @ts-ignore
      if (Object.hasOwn(criteria, key)) {
        command = command.where(key, '=', value);
      }
    });

    return await command.returningAll().execute();
  };
}

export function updateObject(db: Kysely<Database>) {
  return async function <T extends keyof Database & string>(tableName: T, criteria: Partial<Selectable<Database[T]>>, updateWith: UpdateObject<Database, T>): Promise<Selectable<Database[T]>[]> {
    let command = db.updateTable(tableName).set(updateWith);

    // @ts-ignore
    Object.entries(criteria).forEach(([key, value]: KeyValue<T>) => {
      // @ts-ignore
      if (Object.hasOwn(criteria, key)) {
        command = command.where(key, '=', value);
      }
    });

    return await command.returningAll().execute();
  };
}

export function destroy(db: Kysely<Database>) {
  return async function <T extends keyof Database & string>(tableName: T, criteria: Partial<Selectable<Database[T]>>): Promise<Selectable<Database[T]>[]> {
    let command = db.deleteFrom(tableName);

    // @ts-ignore
    Object.entries(criteria).forEach(([key, value]: KeyValue<T>) => {
      // @ts-ignore
      if (Object.hasOwn(criteria, key)) {
        command = command.where(key, '=', value);
      }
    });

    return await command.returningAll().execute();
  };
}
