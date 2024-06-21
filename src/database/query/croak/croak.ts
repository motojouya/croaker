import { Kysely } from 'kysely'
import {
  CroakTable,
  LinkTable,
  FileTable,
} from '@/database/type/croak'

export type Link = LinkTable;
export type File = FileTable;
export type Croak = Omit<CroakTable, 'user_id'> & {
  has_thread: bool;
  croaker_name: string;
  links: Link[];
  files: File[];
};

export type CroakSimple = Omit<Croak, 'links' | 'files'>;

type GetLinks = (db: Kysely) => (croakIds: number[]) => Promise<Link[]>;
const getLinks: GetLinks = (db) => async (croakIds) => {
  return await db
    .selectFrom('link')
    .selectAll()
    .where('croak_id', 'in', croakIds)
    .execute();
}

type GetFiles = (db: Kysely) => (croakIds: number[]) => Promise<Link[]>;
const getFiles: GetFiles = (db) => async (croakIds) => {
  return await db
    .selectFrom('file')
    .selectAll()
    .where('croak_id', 'in', croakIds)
    .execute();
}

export type ComplementCroak = (db: Kysely, getCroaks: () => Promise<CroakSimple[]>) => Promise<Croak[]>;
export const complementCroak: ComplementCroak = (db, getCroaks) => {

  const croaks = await getCroaks();

  const croakIds = croaks.map(croak => croak.croak_id);

  const links = await getLinks(db)(croakIds);
  const croakIdLinkDic = Object.groupBy('croak_id', links);

  const files = await getFiles(db)(croakIds);
  const croakIdFileDic = Object.groupBy('croak_id', files);

  return croaks.map(croak => ({
    ...croak,
    links: croakIdLinkDic[croak.id] || [],
    files: croakIdFileDic[croak.id] || [],
  }));
};
