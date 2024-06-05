import { Kysely, NotNull, Null } from 'kysely'
import { add, compareAsc } from 'date-fns';

import { Croak } from '@/rdb/query/croak';
import { Actor } from '@/lib/session'; // TODO
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
import { InvalidArgumentsError, AuthorityError } from '@/lib/validation';
import { convert } from '@/lib/image';
import { Storage, uploadFile } from '@/lib/file';
import { Context } from '@/lib/context';

type PostCroak = (context: Context) => (text: string, thread?: number) => Promise<Croak | AuthorityError | InvalidArgumentsError>;
const postCroak: PostCroak = (context) => async (text, thread) => {

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

  return await create(context.db, 'croak', {
    user_id: actor.user_id;
    contents: contents,
    file_path: filePath,
    thread: thread,
  });
};

type PostFile = (context: Context) => (filePath: string, thread?: number) => Promise<Croak | AuthorityError | InvalidArgumentsError>;
const postFile: PostFile = (context) => async (filePath, thread) => {

  const actor = context.actor;

  if (!filePath) {
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

  // TODO do something
  // file投稿するならfile pathがあってるかとか必要。事前にfile tabelがあるなら、primary keyの一致だけでいける

  // content typeが入ってこないので、常にconvertを呼び出し、imageじゃなければ、nullを返す
  let uploadFile = filePath;
  const converted = convert(filePath);
  if (converted) {
    uploadFile = converted;
  }

  await uploadFile(context.storage)(uploadFile);
  // TODO file テーブルを作って、そっちにいれる
  // create table file (
  //  id
  //  croak_id
  //  path
  //  name
  // )
  // croakテーブルからは、file_pathは消す

  return await create(context.db, 'croak', {
    user_id: actor.user_id;
    contents: contents,
    file_path: filePath,
    thread: thread,
  });
};

// import { type NextRequest } from 'next/server'
//  
// export async function GET(request: NextRequest) {
//   const requestHeaders = new Headers(request.headers)
// }
// import { headers } from 'next/headers'
// 
// export async function GET(request: Request) {
//   const headersList = headers()
//   const referer = headersList.get('referer')
//  
//   return new Response('Hello, Next.js!', {
//     status: 200,
//     headers: { referer: referer },
//   })
// }

// import { NextResponse } from "next/server";
// import { postFile } from "@/case/postCroaks";
//
// export async function POST(request: Request) {
//
//   const formData = await request.formData();
//   const file = formData.get("file") as File;
//   const arrayBuffer = await file.arrayBuffer();
//
//   const buffer = Buffer.from(arrayBuffer);
//   const buffer = new Uint8Array(arrayBuffer);
//
//   await fs.writeFile(`./public/uploads/${file.name}`, buffer);
//
//   const croak = postFile(buffer, file);
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
