import { Kysely } from "kysely";
import { Database } from "@/database/type";
import { CroakRecord, FileRecord } from "@/database/type/croak";

export type ArgCroak = Pick<CroakRecord, "croaker_id" | "contents"> & {
  thread?: number;
};

// TODO STORAGE_TYPE_GCS
export type ArgFile = Pick<FileRecord, "storage_type" | "source" | "name" | "content_type">;

export type ReturnCroak = CroakRecord & {
  files: FileRecord[];
};

export type CreateFileCroak = (db: Kysely<Database>) => (croak: ArgCroak, file: ArgFile) => Promise<ReturnCroak>;
export const createFileCroak: CreateFileCroak = (db) => async (croak, file) => {
  const croakRecord = await db.insertInto("croak").values(croak).returningAll().executeTakeFirstOrThrow();

  const fileRecord = await db
    .insertInto("file")
    .values({
      croak_id: croakRecord.croak_id,
      ...file,
    })
    .returningAll()
    .executeTakeFirstOrThrow();

  return { ...croakRecord, files: [fileRecord] };
};
