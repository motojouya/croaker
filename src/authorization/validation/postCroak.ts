import { add, compareAsc } from 'date-fns';
import {
  getDuration,
  toStringDuration,
} from '@/lib/interval';
import {
  POST_AUTHORITY_TOP,
  POST_AUTHORITY_THREAD,
  POST_AUTHORITY_DISABLE,
} from '@/rdb/type/master';
import { AuthorizeValidation, AuthorityError } from '@/authorization/base';

type PostCroakConfig = {
  type: 'post_croak',
  isThread: bool,
  getNow: () => Promise<Date>,
  getLastCroakTime: () => Promise<Date | null>,
};
type AuthorizePostCroak = (
  croaker: Croaker,
  config: PostCroakConfig,
) => Promise<undefined | AuthorityError>;
const authorizePostCroak: AuthorizePostCroak = async (croaker, config) => {

  if (croaker.role.post === POST_AUTHORITY_DISABLE) {
    return new AuthorityError(croaker.croaker_id, 'post_disable', '投稿することはできません');
  }

  if (croaker.role.post === POST_AUTHORITY_THREAD && !config.isThread) {
    return new AuthorityError(croaker.croaker_id, 'post_thread', 'スレッド上にのみ投稿することができます');
  }

  const lastCroakDate = await config.getLastCroak();
  if (lastCroakDate) {
    const nowDate = await config.getNow();

    const duration = getDuration(croaker.role.top_post_interval);
    const croakTimePassed = !!compareAsc(add(lastCroakDate, duration), nowDate);

    if (croaker.role.post === POST_AUTHORITY_TOP && !croakTimePassed) {
      const durationText = toStringDuration(duration);
      return new AuthorityError(croaker.croaker_id, 'post_thread', `前回の投稿から${durationText}以上たってから投稿してください`);
    }
  }
};

export type PostCroak = PostCroakConfig & {
  validation: AuthorizePostCroak,
};

export const GetAuthorizePostCroak = (
  isThread: bool,
  getNow: () => Promise<Date>,
  getLastCroakTime: () => Promise<Date>
) => PostCroak;
export const getAuthorizePostCroak = (isThread, getNow, getLastCroakTime) => {
  return {
    type: 'post_croak',
    isThread,
    getNow,
    getLastCroakTime,
    validation: authorizePostCroak,
  }
};
