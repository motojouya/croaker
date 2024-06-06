import { Kysely, NotNull, Null } from 'kysely'
import { add, compareAsc } from 'date-fns';

import { Croak } from '@/rdb/query/croak';
import { create, delete, read } from '@/lib/repository';
import { getRoleAuthority } from '@/lib/role'
import { getLastCroak } from '@/rdb/query/getLastCroak';
import {
  Duration,
  getDuration,
  toStringDuration,
} from '@/lib/interval';
import {
  POST_AUTHORITY_TOP,
  POST_AUTHORITY_THREAD,
  POST_AUTHORITY_DISABLE,
  CROAKER_STATUS_BANNED,
  CROAKER_STATUS_ACTIVE,
} from '@/rdb/type/master';
import { STORAGE_TYPE_GCS } from '@/rdb/type/croak';
import { InvalidArgumentsError, AuthorityError } from '@/lib/validation';
import { convert } from '@/lib/image';
import { Storage, uploadFile, FileError } from '@/lib/fileStorage';
import { Context } from '@/lib/context';

export type PostCroak = (context: Context) => (text: string, thread?: number) => Promise<
  | Omit<Croak, 'has_thread' | 'files'>
  | AuthorityError
  | InvalidArgumentsError
>;
export const postCroak: PostCroak = (context) => async (text, thread) => {

  const actor = context.actor;

  if (!text) {
    return new InvalidArgumentsError(actor.croaker_identifier, 'text', text, 'textが空です');
  }

  if (actor.status == CROAKER_STATUS_BANNED) {
    return new AuthorityError(actor.croaker_identifier, 'banned', 'ブロックされたユーザです');
  }

  if (!actor.form_agreement) {
    return new AuthorityError(actor.croaker_identifier, 'form_agreement', '投稿前にプロフィールの編集とお願いへの同意をしてください');
  }

  const actorAuthority = read(context.db, 'role', { role_name: actor.role_name });

  if (actorAuthority.post === POST_AUTHORITY_DISABLE) {
    return new AuthorityError(actor.croaker_identifier, 'post_disable', '投稿することはできません');
  }

  if (thread && thread < 1) {
    return new InvalidArgumentsError(actor.croaker_identifier, 'thread', thread, 'threadは1以上の整数です');
  }

  if (actorAuthority.post === POST_AUTHORITY_THREAD && !thread) {
    return new AuthorityError(actor.croaker_identifier, 'post_thread', 'スレッド上にのみ投稿することができます');
  }

  const lastCroak = getLastCroak(context.db)(actor.user_id);
  const duration = getDuration(actorAuthority.top_post_interval);
  const croakTimePassed = !!compareAsc(add(lastCroak.posted_date, duration), new Date());

  if (actorAuthority.post === POST_AUTHORITY_TOP && !croakTimePassed) {
    const durationText = toStringDuration(duration);
    return new AuthorityError(actor.croaker_identifier, 'post_thread', `前回の投稿から${durationText}以上たってから投稿してください`);
  }

  // TODO contentsの中身から、linkを取り出し、OGPを取得してlinkテーブルにいれる

  const croak = await create(context.db, 'croak', {
    user_id: actor.user_id;
    contents: contents,
    thread: thread,
  });

  const links = [];
  let link;
  for (const linkData of linkDataList) {
    link = await create(context.db, 'link', {
      croak_id: croak.croak_id,
      storage_type: STORAGE_TYPE_GCS,
      source: uploadedSource,
      name: file.name,
      content_type: file.type;
    });
    links.push(link);
  }

  const { coak_id, contents, thread, posted_date, } = croak;
  return {
    coak_id,
    contents,
    thread,
    posted_date,
    croaker_identifier: actor.croaker_identifier,
    croaker_name: actor.croaker_name,
    links,
  };
};

// TODO Fileにどういう情報が入ってるかよくわかっていない
export type PostFile = (context: Context) => (file: File, thread?: number) => Promise<
  | Omit<Croak, 'has_thread' | 'links'>
  | AuthorityError
  | InvalidArgumentsError
  | FileError
  | ImageCommandError
  | ImageFormatError
>;
export const postFile: PostFile = (context) => async (file, thread) => {

  const actor = context.actor;

  if (!file) {
    return null;
  }

  if (actor.status == CROAKER_STATUS_BANNED) {
    return new AuthorityError(actor.croaker_identifier, 'banned', 'ブロックされたユーザです');
  }

  if (!actor.form_agreement) {
    return new AuthorityError(actor.croaker_identifier, 'form_agreement', '投稿前にプロフィールの編集とお願いへの同意をしてください');
  }

  const actorAuthority = read(context.db, 'role', { role_name: actor.role_name });

  if (actorAuthority.post === POST_AUTHORITY_DISABLE) {
    return new AuthorityError(actor.croaker_identifier, 'post_disable', '投稿することはできません');
  }

  if (thread && thread < 1) {
    return new InvalidArgumentsError(actor.croaker_identifier, 'thread', thread, 'threadは1以上の整数です');
  }

  if (actorAuthority.post === POST_AUTHORITY_THREAD && !thread) {
    return new AuthorityError(actor.croaker_identifier, 'post_thread', 'スレッド上にのみ投稿することができます');
  }

  const lastCroak = getLastCroak(actor.user_id);
  const duration = getDuration(actorAuthority.top_post_interval);
  const croakTimePassed = !!compareAsc(add(lastCroak.posted_date, duration), new Date());

  if (actorAuthority.post === POST_AUTHORITY_TOP && !croakTimePassed) {
    const durationText = toStringDuration(duration);
    return new AuthorityError(actor.croaker_identifier, 'post_thread', `前回の投稿から${durationText}以上たってから投稿してください`);
  }

  if (!actorAuthority.post_file) {
    return new AuthorityError(actor.croaker_identifier, 'post_file', 'ファイルをアップロードすることはできません');
  }

  const uploadFilePath = convert(file.name);
  if (
    converted instanceof ImageCommandError ||
    converted instanceof ImageFormatError
  ) {
    return converted;
  }

  const uploadedSource = await uploadFile(context.storage)(uploadFilePath, file.extension);
  if (uploadedSource instanceof FileError) {
    return uploadedSource;
  }

  const croak = await create(context.db, 'croak', {
    user_id: actor.user_id;
    contents: null,
    thread: thread,
  });

  const file = await create(context.db, 'file', {
    croak_id: croak.croak_id,
    storage_type: STORAGE_TYPE_GCS,
    source: uploadedSource,
    name: file.name,
    content_type: file.type;
  });

  // TODO presigned urlを発行して、見えるようにする必要がある

  const { coak_id, contents, thread, posted_date, } = croak;
  return {
    coak_id,
    contents,
    thread,
    posted_date,
    croaker_identifier: actor.croaker_identifier,
    croaker_name: actor.croaker_name,
    files: [file],
  };
};

// import { NextResponse } from "next/server";
// import { postFile } from "@/case/postCroaks";
//
// export async function POST(request: Request) {
//
//   const formData = await request.formData();
//   const file = formData.get("file") as File;
//
//   // const arrayBuffer = await file.arrayBuffer();
//   // const buffer = Buffer.from(arrayBuffer);
//   // const buffer = new Uint8Array(arrayBuffer);
//   // await fs.writeFile(`./public/uploads/${file.name}`, buffer);
//
//   const croak = postFile(file);
//
//   return NextResponse.json(croak);
// }

type DeleteCroak = (context: Context) => (croakId: number) => Promise<Croak | AuthorityError>;
const deleteCroak: DeleteCroak = (context) => async (croakId) => {

  const actor = context.actor;

  if (actor.status == CROAKER_STATUS_BANNED) {
    return new AuthorityError(actor.croaker_identifier, 'banned', 'ブロックされたユーザです');
  }

  if (!actor.form_agreement) {
    return new AuthorityError(actor.croaker_identifier, 'form_agreement', '投稿前にプロフィールの編集とお願いへの同意をしてください');
  }

  const croak = read(context.db, 'croak', { croak_id: croakId });
  const actorAuthority = read(context.db, 'role', { role_name: actor.role_name });

  if (!croak.user_id === actor.user_id && !actorAuthority.delete_other_post) {
    return new AuthorityError(actor.croaker_identifier, 'delete_other_post', '自分以外の投稿を削除することはできません');
  }

  return await delete(context.db, 'croak', { croak_id: croakId });
};
