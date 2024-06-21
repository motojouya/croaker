type AuthorizeDeleteOtherPostConfig = {
  type: 'delete_other_post_config';
  post_croaker_id: string;
};

type AuthorizeDeleteOtherPost = (croaker: Croaker, config: AuthorizeDeleteOtherPostConfig) => AuthorityError | undefined;
const authorizeDeleteOtherPost = (croaker, config) => {
  if (!config.post_croaker_id === croaker.croaker_id && !croaker.role.delete_other_post) {
    return new AuthorityError(croaker.croaker_identifier, 'delete_other_post', '自分以外の投稿を削除することはできません');
  }
};

export type DeleteOtherPost = AuthorizeDeleteOtherPostConfig & {
  validation: AuthorizeDeleteOtherPost;
};

export const GetAuthorizeDeleteOtherPost = (postCroakerId: string) => DeleteOtherPost;
export const getAuthorizeDeleteOtherPost: GetAuthorizeDeleteOtherPost = (postCroakerId) => ({
  type: 'delete_other_post_config';
  post_croaker_id: postCroakerId;
  validation: authorizeDeleteOtherPost;
});
