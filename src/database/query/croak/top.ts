import { Kysely } from "kysely";
import { CROAKER_STATUS_ACTIVE, CROAKER_STATUS_BANNED } from "@/database/type/croak";
import { Croak, CroakSimple, complementCroak } from "@/database/query/croak/croak";
import { Database } from "@/database/type";

export type Top = (db: Kysely<Database>) => (reverse: boolean, offsetCursor: number, limit: number) => Promise<Croak[]>;
export const top: Top = (db) => (reverse, offsetCursor, limit) =>
  complementCroak(db, () => getCroaks(db)(reverse, offsetCursor, limit));

type GetCroaks = (
  db: Kysely<Database>,
) => (reverse: boolean, offsetCursor: number, limit: number) => Promise<CroakSimple[]>;
const getCroaks: GetCroaks = (db) => async (reverse, offsetCursor, limit) => {
  return await db
    .selectFrom("croak as k")
    .innerJoin("croaker as ker", "k.croaker_id", "ker.croaker_id")
    .leftJoin(
      (eb) =>
        eb
          .selectFrom("croak as subk")
          .where("subk.thread", "is not", null)
          .groupBy("subk.thread")
          .select(["subk.thread as thread_id"])
          .as("thread"),
      (join) => join.onRef("k.croak_id", "=", "thread.thread_id"),
    )
    .select((eb) => [
      "k.croak_id as croak_id",
      "k.contents as contents",
      "k.thread as thread",
      eb.case().when("thread.thread_id", "is", null).then(false).else(true).end().as("has_thread"),
      "ker.croaker_id as croaker_id",
      "ker.name as croaker_name",
      "k.posted_date as posted_date",
      "k.deleted_date as deleted_date",
    ])
    .where("k.deleted_date", "is not", null)
    .where("ker.status", "=", CROAKER_STATUS_ACTIVE)
    .where("k.thread", "is", null)
    .where("k.croak_id", reverse ? ">" : "<", offsetCursor)
    .orderBy("k.croak_id", reverse ? "asc" : "desc")
    .limit(limit)
    .execute();
};
