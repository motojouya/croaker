import { AuthorizeValidation, AuthorityFail } from "@/domain/authorization/base";

export type PostFile = {
  type: "post_file";
  validation: AuthorizeValidation;
};

const authorizePostFile: AuthorizeValidation = (croaker) => {
  if (!croaker.role.post_file) {
    return new AuthorityFail(croaker.croaker_id, "post_file", "ファイルをアップロードすることはできません");
  }
};

export const AUTHORIZE_POST_FILE: PostFile = {
  type: "post_file",
  validation: authorizePostFile,
};
