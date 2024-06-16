import { Kysely } from 'kysely'
import {
  CroakTable,
  LinkTable,
} from '@/rdb/type/croak'

export type ArgCroak = {
  user_id: string;
  contents: string;
  thread?: number;
};

export type ArgLink = {
  url: string;
  type?: string;
  title?: string;
  image?: string;
  summary?: string;
};

export type ReturnCroak = CroakTable & {
  links: LinkTable[]
};

export const CreateTextCroak = (db: Kysely) => (croak: ArgCroak, links: ArgLink[]) => Promise<ReturnCroak>;
export const createTextCroak: CreateTextCroak = (db) => async (croak, links) => {

  const croakRecord = await db.insertInto('croak')
      .values(croak)
      .returningAll()
      .executeTakeFirstOrThrow();

  const linkRecords = [];
  let linkRecord;

  // TODO 並列化
  for (const link of links) {
    linkRecord = await db.insertInto('link')
        .values({
          croak_id: croakRecord.croak_id,
          ...link
        })
        .returningAll()
        .executeTakeFirstOrThrow();

    linkRecords.push(linkRecord);
  }

  return { ...croakRecord, links: linkRecord, };
};
