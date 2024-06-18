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
import { HandleableError } from '@/lib/error';

export type AuthorizeMutation = (actor?: Actor) => undefined | AuthorityError;
export const authorizeMutation: AuthorizeMutation = (actor) => {

  const basicErr = authorizeBasically(actor);
  if (basicErr) {
    return new AuthorityError(null, 'none', 'ログインしてください');
  }

  if (actor.status == CROAKER_STATUS_BANNED) {
    return new AuthorityError(actor.croaker_identifier, 'banned', 'ブロックされたユーザです');
  }

  if (!actor.form_agreement) {
    return new AuthorityError(actor.croaker_identifier, 'form_agreement', '投稿前にプロフィールの編集とお願いへの同意をしてください');
  }
};

export type AuthorizePostCroak = (
  actor: Actor,
  actorAuthority: Role,
  lastCroak: CroakMini | null,
  now: Date, isThread: bool
) => undefined | AuthorityError;
export const authorizePostCroak: AuthorizePostCroak = (actor, actorAuthority, lastCroak, isThread) => {

  if (actorAuthority.post === POST_AUTHORITY_DISABLE) {
    return new AuthorityError(actor.croaker_identifier, 'post_disable', '投稿することはできません');
  }

  if (actorAuthority.post === POST_AUTHORITY_THREAD && !isThread) {
    return new AuthorityError(actor.croaker_identifier, 'post_thread', 'スレッド上にのみ投稿することができます');
  }

  if (lastCroak) {
    const duration = getDuration(actorAuthority.top_post_interval);
    const croakTimePassed = !!compareAsc(add(lastCroak.posted_date, duration), now);

    if (actorAuthority.post === POST_AUTHORITY_TOP && !croakTimePassed) {
      const durationText = toStringDuration(duration);
      return new AuthorityError(actor.croaker_identifier, 'post_thread', `前回の投稿から${durationText}以上たってから投稿してください`);
    }
  }
};

export type AuthorizePostFile = (actor: Actor, actorAuthority: Role) => undefined | AuthorityError;
export const authorizePostFile: AuthorizePostFile = (actor, actorAuthority) => {
  if (!actorAuthority.post_file) {
    return new AuthorityError(actor.croaker_identifier, 'post_file', 'ファイルをアップロードすることはできません');
  }
};

export type AuthorizeShowOtherActivities = (actor: Actor, actorAuthority: Role) => undefined | AuthorityError;
export const authorizeShowOtherActivities: AuthorizeShowOtherActivities = (actor, actorAuthority) => {
  if (!actorAuthority.show_other_activities) {
    return new AuthorityError(actor.croaker_identifier, 'show_other_activities', '他のユーザの活動まとめを参照することはできません');
  }
};

export type AuthorizeBanPower = (actor: Actor, actorAuthority: Role) => undefined | AuthorityError;
export const authorizeBanPower: AuthorizeBanPower = (actor, actorAuthority) => {
  if (!actorAuthority.ban_power) {
    return new AuthorityError(actor.croaker_identifier, 'ban_power', '他のユーザのアカウントを停止することはできません');
  }
};

export type AuthorizeBasically = (actor?: Actor) => undefined | AuthorityError;
export const authorizeBasically: AuthorizeBasically = (actor) => {
  if (!actor) {
    return new AuthorityError(null, 'none', 'ログインしてください');
  }
};

export class AuthorityError extends HandleableError {
  override readonly name = 'lib.authorize.AuthorityError' as const;
  constructor(
    readonly croaker_identifier: string,
    readonly authority: string,
    readonly message: string,
  ) {
    super();
  }
}
