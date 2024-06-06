import { Kysely } from 'kysely'
import {
  CroakTable,
  LinkTable,
  FileTable,
} from '@/rdb/type/croak'

export type Link = LinkTable;
export type File = FileTable;
export type Croak = Omit<CroakTable, 'user_id' | 'delete_date'> & {
  has_thread: bool;
  croaker_name: string;
  croaker_identifier: string;
  links: Link[];
  files: File[];
};

export type CroakMini = Omit<Croak, 'has_thread' | 'links' | 'files'>;

exort type GetLinks = (db: Kysely) => (croakIds: number[]) => Promise<Link[]>;
exort const getLinks: GetLinks = (db) => async (croakIds) => {
  return await db
    .selectFrom('link')
    .selectAll()
    .where('croak_id', 'in', croakIds)
    .execute();
}

exort type GetFiles = (db: Kysely) => (croakIds: number[]) => Promise<Link[]>;
exort const getFiles: GetFiles = (db) => async (croakIds) => {
  return await db
    .selectFrom('file')
    .selectAll()
    .where('croak_id', 'in', croakIds)
    .execute();
}
