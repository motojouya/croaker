import { AuthorizeValidation, AuthorityFail } from "@/domain/authorization/base";
import { Croaker } from "@/database/query/croaker/croaker";

type AuthorizeDeleteOtherPostConfig = {
  type: "delete_other_post";
  post_croaker_id: string;
};

type AuthorizeDeleteOtherPost = (croaker: Croaker, config: AuthorizeDeleteOtherPostConfig) => AuthorityFail | undefined;
const authorizeDeleteOtherPost: AuthorizeDeleteOtherPost = (croaker, config) => {
  if (config.post_croaker_id !== croaker.croaker_id && !croaker.role.delete_other_post) {
    return new AuthorityFail(croaker.croaker_id, "delete_other_post", "自分以外の投稿を削除することはできません");
  }
};

export type DeleteOtherPost = AuthorizeDeleteOtherPostConfig & {
  validation: AuthorizeDeleteOtherPost;
};

export type GetAuthorizeDeleteOtherPost = (postCroakerId: string) => DeleteOtherPost;
export const getAuthorizeDeleteOtherPost: GetAuthorizeDeleteOtherPost = (postCroakerId) => ({
  type: "delete_other_post",
  post_croaker_id: postCroakerId,
  validation: authorizeDeleteOtherPost,
});
