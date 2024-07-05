import { add, compareAsc } from "date-fns";
import { getDuration, toStringDuration } from "@/domain/interval";
import { POST_AUTHORITY_TOP, POST_AUTHORITY_THREAD, POST_AUTHORITY_DISABLE } from "@/database/type/master";
import { AuthorizeValidation, AuthorityFail } from "@/domain/authorization/base";
import { Croaker } from "@/database/query/croaker/croaker";

type PostCroakConfig = {
  type: "post_croak";
  isThread: boolean;
  getNow: () => Promise<Date>;
  getLastCroakTime: (croaker_id: string) => Promise<Date | null>;
};

type AuthorizePostCroak = (croaker: Croaker, config: PostCroakConfig) => Promise<undefined | AuthorityFail>;
const authorizePostCroak: AuthorizePostCroak = async (croaker, config) => {
  if (croaker.role.post === POST_AUTHORITY_DISABLE) {
    return new AuthorityFail(croaker.croaker_id, "post_disable", "投稿することはできません");
  }

  if (croaker.role.post === POST_AUTHORITY_THREAD && !config.isThread) {
    return new AuthorityFail(croaker.croaker_id, "post_thread", "スレッド上にのみ投稿することができます");
  }

  const lastCroakDate = await config.getLastCroakTime(croaker.croaker_id);
  if (lastCroakDate) {
    const duration = getDuration(croaker.role.top_post_interval);
    if (duration) {
      const nowDate = await config.getNow();
      const croakTimePassed = !!compareAsc(add(lastCroakDate, duration), nowDate);

      if (croaker.role.post === POST_AUTHORITY_TOP && !croakTimePassed) {
        let durationText = "";
        if (duration) {
          durationText = toStringDuration(duration);
        }
        return new AuthorityFail(
          croaker.croaker_id,
          "post_thread",
          `前回の投稿から${durationText}以上たってから投稿してください`,
        );
      }
    }
  }
};

export type PostCroak = PostCroakConfig & {
  validation: AuthorizePostCroak;
};

export type GetAuthorizePostCroak = (
  isThread: boolean,
  getNow: () => Promise<Date>,
  getLastCroakTime: (croaker_id: string) => Promise<Date | null>,
) => PostCroak;
export const getAuthorizePostCroak: GetAuthorizePostCroak = (isThread, getNow, getLastCroakTime) => {
  return {
    type: "post_croak",
    isThread,
    getNow,
    getLastCroakTime,
    validation: authorizePostCroak,
  };
};
