
import { Kysely } from 'kysely'
import {
  CroakTable, 
  LinkTable,
} from '@/rdb/type/croak'

export type Link = LinkTable;
export type Croak = Omit<CroakTable, 'user_id' | 'thread' | 'delete_date'> & {
  has_thread: bool;
  croaker_name: string;
  croaker_identifier: string;
  links: Link[];
};

exort type GetLinks = (db: Kysely) => (croakIds: number[]) => Promise<Link[]>;
exort const getLinks: GetLinks = (db) => async (croakIds) => {
  return await db
    .selectFrom('link')
    .selectAll()
    .where('croak_id', 'in', croakIds)
    .execute();
}
