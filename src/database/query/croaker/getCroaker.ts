import { Kysely } from "kysely";
import { Croaker, createCroaker } from "@/database/query/croaker/croaker";
import { Database } from "@/database/type";

export type GetCroaker = (db: Kysely<Database>) => (croakerId: string) => Promise<Croaker | null>;
export const getCroaker: GetCroaker = (db) => async (croakerId) => {
  const results = await db
    .selectFrom("croaker as ker")
    .innerJoin("role as r", "ker.role_id", "r.role_id")
    .select([
      "ker.croaker_id as croaker_id",
      "ker.name as croaker_name",
      "ker.description as description",
      "ker.status as status",
      "ker.form_agreement as form_agreement",
      "ker.created_date as created_date",
      "ker.updated_date as updated_date",
      "r.name as role_name",
      "r.ban_power as role_ban_power",
      "r.delete_other_post as role_delete_other_post",
      "r.post as role_post",
      "r.post_file as role_post_file",
      "r.top_post_interval as role_top_post_interval",
      "r.show_other_activities as role_show_other_activities",
    ])
    .where("ker.croaker_id", "=", croakerId)
    .execute();

  return createCroaker(results);
};
