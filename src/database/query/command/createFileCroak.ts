import { Kysely } from 'kysely'
import {
  CroakTable,
  FileTable,
} from '@/rdb/type/croak'

export type ArgCroak = Pick<CroakTable, 'croaker_id' | 'contents'> & {
  thread?: number;
}

// TODO STORAGE_TYPE_GCS
export type ArgFile = Pick<FileTable, 'storage_type' | 'source' | 'name' | 'content_type'>;

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
