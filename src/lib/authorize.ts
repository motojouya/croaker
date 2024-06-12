import { add, compareAsc } from 'date-fns';

import { CroakMini } from '@/rdb/query/croak';
import {
  getDuration,
  toStringDuration,
} from '@/lib/interval';
import {
  POST_AUTHORITY_TOP,
  POST_AUTHORITY_THREAD,
  POST_AUTHORITY_DISABLE,
  CROAKER_STATUS_BANNED,
  CROAKER_STATUS_ACTIVE,
  RoleTable as Role,
} from '@/rdb/type/master';
import { Actor } from '@/lib/session';

export class AuthorityError extends Error {
  override readonly name = 'lib.authorize.AuthorityError' as const;
  constructor(
    readonly croaker_identifier: string,
    readonly authority: string,
    readonly message: string,
  ) {
    super();
  }
}

export type AuthorizeMutation = (actor?: Actor) => undefined | AuthorityError;
export const authorizeMutation: AuthorizeMutation = (actor) => {

  if (!actor) {
    return new AuthorityError(null, 'none', 'ログインしてください');
  }

  if (actor.status == CROAKER_STATUS_BANNED) {
    return new AuthorityError(actor.croaker_identifier, 'banned', 'ブロックされたユーザです');
  }

  if (!actor.form_agreement) {
    return new AuthorityError(actor.croaker_identifier, 'form_agreement', '投稿前にプロフィールの編集とお願いへの同意をしてください');
  }
};

export type AuthorizePostCroak = (actor: Actor, actorAuthority: Role, lastCroak: CroakMini, now: Date, isThread: bool) => undefined | AuthorityError;
export const authorizePostCroak: AuthorizePostCroak = (actor, actorAuthority, lastCroak, isThread) => {

  if (actorAuthority.post === POST_AUTHORITY_DISABLE) {
    return new AuthorityError(actor.croaker_identifier, 'post_disable', '投稿することはできません');
  }

  if (actorAuthority.post === POST_AUTHORITY_THREAD && !isThread) {
    return new AuthorityError(actor.croaker_identifier, 'post_thread', 'スレッド上にのみ投稿することができます');
  }

  const duration = getDuration(actorAuthority.top_post_interval);
  const croakTimePassed = !!compareAsc(add(lastCroak.posted_date, duration), now);

  if (actorAuthority.post === POST_AUTHORITY_TOP && !croakTimePassed) {
    const durationText = toStringDuration(duration);
    return new AuthorityError(actor.croaker_identifier, 'post_thread', `前回の投稿から${durationText}以上たってから投稿してください`);
  }
};

export type AuthorizePostFile = (actor: Actor, actorAuthority: Role) => undefined | AuthorityError;
export const authorizePostFile: AuthorizePostFile = (actor, actorAuthority) => {
  if (!actorAuthority.post_file) {
    return new AuthorityError(actor.croaker_identifier, 'post_file', 'ファイルをアップロードすることはできません');
  }
};
