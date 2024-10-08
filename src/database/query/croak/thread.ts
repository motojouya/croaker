import { Kysely } from "kysely";
import { CROAKER_STATUS_ACTIVE, CROAKER_STATUS_BANNED } from "@/database/type/croak";
import { Croak, CroakSimple, complementCroak } from "@/database/query/croak/croak";
import { Database } from "@/database/type";

export type Thread = (
  db: Kysely<Database>,
) => (threadId: number, reverse: boolean, offsetCursor: number | null, limit: number) => Promise<Croak[]>;
export const thread: Thread = (db) => (threadId, reverse, offsetCursor, limit) =>
  complementCroak(db, () => getCroaks(db)(threadId, reverse, offsetCursor, limit));

type GetCroaks = (
  db: Kysely<Database>,
) => (threadId: number, reverse: boolean, offsetCursor: number | null, limit: number) => Promise<CroakSimple[]>;
const getCroaks: GetCroaks = (db) => async (threadId, reverse, offsetCursor, limit) => {
  let query = db
    .selectFrom("croak as k")
    .innerJoin("croaker as ker", "k.croaker_id", "ker.croaker_id")
    .select((eb) => [
      "k.croak_id as croak_id",
      "k.contents as contents",
      "k.thread as thread",
      eb.val(0).as("has_thread"),
      "ker.croaker_id as croaker_id",
      "ker.name as croaker_name",
      "k.posted_date as posted_date",
      "k.deleted_date as deleted_date",
    ])
    .where("k.deleted_date", "is", null)
    .where("ker.status", "=", CROAKER_STATUS_ACTIVE)
    .where((eb) => eb.or([eb("k.thread", "=", threadId), eb("k.croak_id", "=", threadId)]))
    .orderBy("k.croak_id", reverse ? "asc" : "desc")
    .limit(limit);

  if (offsetCursor !== null) {
    query = query.where("k.croak_id", reverse ? ">" : "<", offsetCursor);
  }

  return await query.execute();
};
