import { Kysely } from "kysely";
import { CroakRecord, LinkRecord, FileRecord } from "@/database/type/croak";
import { Database } from "@/database/type";

export type Link = LinkRecord;
export type File = FileRecord;
export type Croak = Omit<CroakRecord, "user_id"> & {
  has_thread: boolean;
  croaker_name: string;
  links: Link[];
  files: File[];
};

export type CroakSimple = Omit<Croak, "links" | "files">;

type GetLinks = (db: Kysely<Database>) => (croakIds: number[]) => Promise<Link[]>;
const getLinks: GetLinks = (db) => async (croakIds) => {
  return await db.selectFrom("link").selectAll().where("croak_id", "in", croakIds).execute();
};

type GetFiles = (db: Kysely<Database>) => (croakIds: number[]) => Promise<File[]>;
const getFiles: GetFiles = (db) => async (croakIds) => {
  return await db.selectFrom("file").selectAll().where("croak_id", "in", croakIds).execute();
};

export type ComplementCroak = (db: Kysely<Database>, getCroaks: () => Promise<CroakSimple[]>) => Promise<Croak[]>;
export const complementCroak: ComplementCroak = async (db, getCroaks) => {
  const croaks = await getCroaks();

  const croakIds = croaks.map((croak) => croak.croak_id);

  const links = await getLinks(db)(croakIds);
  const croakIdLinkDic = Object.groupBy(links, (link) => link.croak_id);

  const files = await getFiles(db)(croakIds);
  const croakIdFileDic = Object.groupBy(files, (file) => file.croak_id);

  return croaks.map((croak) => ({
    ...croak,
    links: croakIdLinkDic[croak.croak_id] || [],
    files: croakIdFileDic[croak.croak_id] || [],
  }));
};
