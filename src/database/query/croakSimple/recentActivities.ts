import { Kysely, sql, NotNull } from "kysely";
import { CROAKER_STATUS_ACTIVE } from "@/database/type/croak";
import { CroakSimple } from "@/database/query/croakSimple/croakSimple";
import { Database } from "@/database/type";

export type RecentActivities = (db: Kysely<Database>) => (croakerId: string, days: number) => Promise<CroakSimple[]>;
export const recentActivities: RecentActivities = (db) => async (croakerId, days) => {
  const daysAgo = db.fn("strftime", [db.fn("datetime", ["now", "localtime", `-${days} days`])]);

  return await db
    .selectFrom("croak as k")
    .innerJoin("croaker as ker", "k.croaker_id", "ker.croaker_id")
    .innerJoin(
      (eb) =>
        eb
          .selectFrom("croak as subk")
          .groupBy("subk.croaker_id")
          .where((ebs) => ebs.fn("strftime", ["subk.posted_date"]), ">", daysAgo)
          .where("subk.deleted_date", "is not", null)
          .select((ebs) => ["subk.croaker_id as croaker_id", ebs.fn.max<number>("subk.croak_id").as("max_croak_id")])
          .as("su"),
      (join) => join.onRef("k.croak_id", "=", "su.max_croak_id"),
    )
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
    .where((ebs) => ebs.fn("strftime", ["k.posted_date"]), ">", daysAgo)
    .where("k.deleted_date", "is not", null)
    .where("ker.status", "=", CROAKER_STATUS_ACTIVE)
    .where("ker.croaker_id", "<>", croakerId)
    .orderBy(["k.croak_id desc"])
    .execute();
};
