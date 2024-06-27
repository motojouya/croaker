import { Kysely } from 'kysely'
import {
  CroakRecord,
  LinkRecord,
} from '@/database/type/croak'
import { Database } from '@/database/type'

export type ArgCroak = Pick<CroakRecord, 'croaker_id' | 'contents'> & {
  thread?: number;
}

export type ArgLink = Pick<LinkRecord, 'source'> & {
  url?: string;
  type?: string;
  title?: string;
  image?: string;
  description?: string;
  site_name?: string;
};

export type ReturnCroak = CroakRecord & {
  links: LinkRecord[]
};

export type CreateTextCroak = (db: Kysely<Database>) => (croak: ArgCroak, links: ArgLink[]) => Promise<ReturnCroak>;
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

  return { ...croakRecord, links: linkRecords, };
};
