import { Kysely } from 'kysely'
import {
  CroakTable,
  FileTable,
} from '@/rdb/type/croak'

export type ArgCroak = {
  user_id: string;
  contents: null;
  thread?: number;
};

export type ArgFile = {
  storage_type: string, // TODO STORAGE_TYPE_GCS
  source: string,
  name: string,
  content_type: string;
};

export type ReturnCroak = CroakTable & {
  files: FileTable[]
};

export const CreateFileCroak = (db: Kysely) => (croak: ArgCroak, file: ArgFile) => Promise<ReturnCroak>;
export const createFileCroak: CreateFileCroak = (db) => async (croak, file) => {

  const croakRecord = await db.insertInto('croak')
      .values(croak)
      .returningAll()
      .executeTakeFirstOrThrow();

  const fileRecord = await db.insertInto('file')
      .values({
        croak_id: croakRecord.croak_id,
        ...file,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

  return { ...croakRecord, files: [fileRecord] };
};
