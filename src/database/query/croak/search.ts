import { Kysely } from "kysely";
import { CROAKER_STATUS_ACTIVE, CROAKER_STATUS_BANNED } from "@/database/type/croak";
import { Croak, CroakSimple, complementCroak } from "@/database/query/croak/croak";
import { Database } from "@/database/type";

export type Search = (
  db: Kysely<Database>,
) => (search: string, reverse: boolean, offsetCursor: number, limit: number) => Promise<Croak[]>;
export const search: Search = (db) => (search, reverse, offsetCursor, limit) =>
  complementCroak(db, () => getCroaks(db)(search, reverse, offsetCursor, limit));

type GetCroaks = (
  db: Kysely<Database>,
) => (search: string, reverse: boolean, offsetCursor: number, limit: number) => Promise<CroakSimple[]>;
const getCroaks: GetCroaks = (db) => async (search, reverse, offsetCursor, limit) => {
  return await db
    .selectFrom("croak as k")
    .innerJoin("croaker as ker", "k.croaker_id", "ker.croaker_id")
    .leftJoin(
      (eb) =>
        eb
          .selectFrom("croak as subk")
          .select((ebs) => [
            "subk.thread as thread_id",
            ebs.fn.sum(ebs.case().when("subk.contents", "like", `%${search}%`).then(1).else(0).end()).as("exist_count"),
          ])
          .where("subk.thread", "is not", null)
          .groupBy("subk.thread")
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
    .where((eb) => eb.or([eb("k.contents", "like", `%${search}%`), eb("thread.exist_count", ">", 0)]))
    .orderBy("k.croak_id", reverse ? "asc" : "desc")
    .limit(limit)
    .execute();
};
