import { Kysely } from "kysely";
import { CroakSimple } from "@/database/query/croakSimple/croakSimple";
import { Database } from "@/database/type";

export type GetLastCroak = (db: Kysely<Database>) => (croakerId: string) => Promise<CroakSimple | null>;
export const getLastCroak: GetLastCroak = (db) => async (croakerId) => {
  const result = await db
    .selectFrom("croak as k")
    .innerJoin("croaker as ker", "k.croaker_id", "ker.croaker_id")
    .select((eb) => [
      "k.croak_id as croak_id",
      "k.contents as contents",
      "k.thread as thread",
      "k.posted_date as posted_date",
      "k.deleted_date as deleted_date",
      eb.val(false).as("has_thread"),
      "ker.croaker_id as croaker_id",
      "ker.name as croaker_name",
    ])
    .where("k.deleted_date", "is not", null)
    .where("ker.croaker_id", "=", croakerId)
    .orderBy(["k.croak_id desc"])
    .limit(1)
    .execute();

  if (result.length === 0) {
    return null;
  }

  return result[0];
};
