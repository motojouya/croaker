import { Kysely, SelectQueryBuilder } from "kysely";
import { Database } from "@/database/type";

type Post = {
  post_user_id: string;
  post_contents: string;
}

export type GetPost = (db: Kysely<Database>) => (userId: string) => Promise<Post[]>;
export const getPost: GetPost = (db) => async (userId) => {
  return await db
    .selectFrom("post as p")
    .innerJoin("comment as c", "p.post_id", "c.post_id")
    .select((eb) => [
      "p.user_id as post_user_id",
      "p.contents as post_contents",
    ])
    .where("p.deleted_date", "is", null)
    .where("c.deleted_date", "is", null)
    .where("c.user_id", "=", userId)
    .orderBy(["p.posted_date desc"])
    .execute();
};

export const getPost2: GetPost = (db) => async (userId) => {
  return await db
    .selectFrom("post as p")
    .select((eb) => [
      "p.user_id as post_user_id",
      "p.contents as post_contents",
    ])
    .where("p.deleted_date", "is", null)
    .where(
      "p.post_id",
      "in",
      eb => eb
        .selectFrom('comment as c')
        .where("c.user_id", "=", userId)
        .where("c.deleted_date", "is", null)
        .select(['c.post_id as post_id'])
    )
    .orderBy(["p.posted_date desc"])
    .execute();
};

export const getPost3: GetPost = (db) => async (userId) => {
  return await db
    .selectFrom("post as p")
    .select((eb) => [
      "p.user_id as post_user_id",
      "p.contents as post_contents",
    ])
    .where("p.deleted_date", "is", null)
    .where(
      "p.post_id",
      "in",
      getCommentId(db).where("c.user_id", "=", userId)
    )
    .orderBy(["p.posted_date desc"])
    .execute();
};

type GetCommentId = (db: Kysely<Database>) => SelectQueryBuilder<Database & { c: Database['comment']; }, "c", { post_id: number; }>;
const getCommentId: GetCommentId = (db) => {
  return db
    .selectFrom('comment as c')
    .where("c.deleted_date", "is", null)
    .select(['c.post_id as post_id']);
};

