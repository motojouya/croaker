import { Kysely, NotNull, Null } from 'kysely'
import { add, compareAsc } from 'date-fns';

import { Croak } from '@/rdb/query/croak';
import { Actor } from '@/lib/session'; // TODO
import { create, delete, read } from '@/lib/repository';
import { getRoleAuthority } from '@/lib/role'
import { getLastCroak } from '@/rdb/query/getLastCroak';

const POST_AUTHORITY_TOP = 'TOP';
const POST_AUTHORITY_THREAD = 'THREAD';
const POST_AUTHORITY_DISABLE = 'DISABLE';
const CROAKER_STATUS_BANNED = 'BANNED';
const CROAKER_STATUS_ACTIVE = 'ACTIVE';

export class AuthorityError extends Error {
  constructor(
    readonly croaker_identifier: string,
    readonly authority: string,
    readonly message: string,
  ) {
    super();
  }
}

type PostCroak = (rdb: Kysely, actor: Actor) => (text?: string, filePath?: string, thread?: number) => Promise<Croak | null | AuthorityError>;
const postCroak: PostCroak = (rdb, actor) => async (text, filePath, thread) => {

  if (actor.status == CROAKER_STATUS_BANNED) {
    return new AuthorityError(actor.croaker_identifier, 'banned', 'ブロックされたユーザです');
  }

  if (!actor.form_agreement) {
    return new AuthorityError(actor.croaker_identifier, 'form_agreement', '投稿前にプロフィールの編集とお願いへの同意をしてください');
  }

  if (!text && !filePath) {
    return null;
  }

  if (text && filePath) {
    return null; // TODO 明確にエラーだと思うがそもそもfileをどう投稿するか
  }

  const actorAuthority = read(rdb, 'role', { role_name: actor.role_name });

  if (filePath) {
    if (!actorAuthority.post_file) {
      return new AuthorityError(actor.croaker_identifier, 'post_file', 'ファイルをアップロードすることはできません');
    }
    // TODO do something
    // file投稿するならfile pathがあってるかとか必要。事前にfile tabelがあるなら、primary keyの一致だけでいける
  }

  if (text) {
    if (actorAuthority.post === POST_AUTHORITY_DISABLE) {
      return new AuthorityError(actor.croaker_identifier, 'post_disable', '投稿することはできません');
    }

    if (thread && thread < 1) {
      return null; // TODO error
    }

    if (actorAuthority.post === POST_AUTHORITY_THREAD && !thread) {
      return new AuthorityError(actor.croaker_identifier, 'post_thread', 'スレッド上にのみ投稿することができます');
    }

    const lastCroak = getLastCroak(actor.user_id);
    const duration = getInterval(actorAuthority.top_post_interval);
    const croakTimePassed = !!compareAsc(add(lastCroak.posted_date, duration), new Date());

    if (actorAuthority.post === POST_AUTHORITY_TOP && !croakTimePassed) {
      const durationText = toStringDuration(duration);
      return new AuthorityError(actor.croaker_identifier, 'post_thread', `前回の投稿から${durationText}以上たってから投稿してください`);
    }

    // TODO contentsの中身から、linkを取り出し、OGPを取得してlinkテーブルにいれる

    return await create(rdb, 'croak', {
      user_id: actor.user_id;
      contents: contents,
      file_path: filePath,
      thread: thread,
    });
  }

  throw new Error('到達不可能');
};

// TODO
const getInterval
const toStringDuration

// TODO
type PostFile = (rdb: Kysely, actor: Actor) => (croak?: string, filePath?: string, thread?: number) => Promise<Croak | null>;
const postFile: PostFile = (rdb, actor) => async (croak, filePath, thread) => {
  if (!croak && !filePath) {
    return null;
  }
  return await create(rdb, 'croak', {
    user_id: actor.user_id;
    contents: contents,
    file_path: filePath,
    thread: thread,
  });
};

type DeleteCroak = (rdb: Kysely, actor: Actor) => (croakId: number) => Promise<Croak | AuthorityError>;
const deleteCroak: DeleteCroak = (rdb, actor) => async (croakId) => {

  if (actor.status == CROAKER_STATUS_BANNED) {
    return new AuthorityError(actor.croaker_identifier, 'banned', 'ブロックされたユーザです');
  }

  if (!actor.form_agreement) {
    return new AuthorityError(actor.croaker_identifier, 'form_agreement', '投稿前にプロフィールの編集とお願いへの同意をしてください');
  }

  const croak = read(rdb, 'croak', { croak_id: croakId });
  const actorAuthority = read(rdb, 'role', { role_name: actor.role_name });

  if (!croak.user_id === actor.user_id && !actorAuthority.delete_other_post) {
    return new AuthorityError(actor.croaker_identifier, 'delete_other_post', '自分以外の投稿を削除することはできません');
  }

  return await delete(rdb, 'croak', { croak_id: croakId });
};
