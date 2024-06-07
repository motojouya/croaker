import { Kysely, NotNull, Null } from 'kysely'
import { add, compareAsc } from 'date-fns';

import { transact } from '@/lib/rdb';
import { Croak, CroakMini } from '@/rdb/query/croak';
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
  RoleTable as Role,
} from '@/rdb/type/master';
import { STORAGE_TYPE_GCS } from '@/rdb/type/croak';
import { InvalidArgumentsError, AuthorityError } from '@/lib/validation';
import { convert } from '@/lib/image';
import { Storage, uploadFile, generatePreSignedUrl, FileError } from '@/lib/fileStorage';
import { Context } from '@/lib/context';
import { Actor } from '@/lib/session';

type AuthorizeMutation = (actor: Actor) => undefined | AuthorityError;
const authorizeMutation: AuthorizeMutation = (actor) => {

  if (actor.status == CROAKER_STATUS_BANNED) {
    return new AuthorityError(actor.croaker_identifier, 'banned', 'ブロックされたユーザです');
  }

  if (!actor.form_agreement) {
    return new AuthorityError(actor.croaker_identifier, 'form_agreement', '投稿前にプロフィールの編集とお願いへの同意をしてください');
  }
};

type AuthorizePostCroak = (actor: Actor, actorAuthority: Role, lastCroak: CroakMini, isThread: bool) => undefined | AuthorityError;
const authorizePostCroak: AuthorizePostCroak = (actor, actorAuthority, lastCroak, isThread) => {

  if (actorAuthority.post === POST_AUTHORITY_DISABLE) {
    return new AuthorityError(actor.croaker_identifier, 'post_disable', '投稿することはできません');
  }

  if (actorAuthority.post === POST_AUTHORITY_THREAD && !isThread) {
    return new AuthorityError(actor.croaker_identifier, 'post_thread', 'スレッド上にのみ投稿することができます');
  }

  const duration = getDuration(actorAuthority.top_post_interval);
  const croakTimePassed = !!compareAsc(add(lastCroak.posted_date, duration), new Date());

  if (actorAuthority.post === POST_AUTHORITY_TOP && !croakTimePassed) {
    const durationText = toStringDuration(duration);
    return new AuthorityError(actor.croaker_identifier, 'post_thread', `前回の投稿から${durationText}以上たってから投稿してください`);
  }

};

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

  if (thread && thread < 1) {
    return new InvalidArgumentsError(actor.croaker_identifier, 'thread', thread, 'threadは1以上の整数です');
  }

  const authorizeMutationErr = authorizeMutation(actor);
  if (authorizeMutationErr) {
    return authorizeMutationErr;
  }

  const actorAuthority = await read(context.db, 'role', { role_name: actor.role_name });
  const lastCroak = await getLastCroak(context.db)(actor.user_id);
  const authorizePostCroakErr = authorizePostCroak(actor, actorAuthority, lastCroak, !!thread);
  if (authorizePostCroakErr) {
    return authorizePostCroakErr;
  }

  // TODO contentsの中身から、linkを取り出し、OGPを取得してlinkテーブルにいれる
  // fetchする
  const links = getLinks(contents.split('\n'));

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

const regexps = [
  new RegExp('^(https:\/\/)\S+$'g),
  new RegExp('^.*\s(https:\/\/)\S+$'g),
  new RegExp('^(https:\/\/)\S+\s.*$'g),
  new RegExp('^.*\s(https:\/\/)\S+\s.*$'g),
];

type GetLinks = (lines: string[]) => string[];
const getLinks = (lines) => lines.flatMap(line => {
  return regexps.flatMap(regexp => {
    // TODO 途中
    const result = regexps.exec(line);
  })
});

// const nl2br = (text) => {
//   const texts = text.split('\n').map((item, index) => {
//     return (
//       <React.Fragment key={index}>
//         {item}<br />
//       </React.Fragment>
//     );
//   });
//   return <div>{texts}</div>;
// }
// 
// import { createElement, type ReactNode } from 'react'
// const nl2br = (text: string): ReactNode[] =>
//   text
//     .split('\n')
//     .map((line, index) => [line, createElement('br', { key: index })])
//     .flat()
//     .slice(0, -1)

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

  if (thread && thread < 1) {
    return new InvalidArgumentsError(actor.croaker_identifier, 'thread', thread, 'threadは1以上の整数です');
  }

  const authorizeMutationErr = authorizeMutation(actor);
  if (authorizeMutationErr) {
    return authorizeMutationErr;
  }

  const actorAuthority = await read(context.db, 'role', { role_name: actor.role_name });

  const lastCroak = await getLastCroak(context.db)(actor.user_id);
  const authorizePostCroakErr = authorizePostCroak(actor, actorAuthority, lastCroak, !!thread);
  if (authorizePostCroakErr) {
    return authorizePostCroakErr;
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

  const { croak, file } = transact(context.db, (trx) => {
    const croak = await create(trx, 'croak', {
      user_id: actor.user_id;
      contents: null,
      thread: thread,
    });
    const file = await create(trx, 'file', {
      croak_id: croak.croak_id,
      storage_type: STORAGE_TYPE_GCS,
      source: uploadedSource,
      name: file.name,
      content_type: file.type;
    });
    return {
      croak,
      file,
    };
  });

  const fileUrl = generatePreSignedUrl(context.storage)(uploadedSource);
  if (fileUrl instanceof FileError) {
    return fileUrl;
  }

  const { coak_id, contents, thread, posted_date, } = croak;
  const { croaker_identifier, croaker_name, } = actor;
  return {
    coak_id,
    contents,
    thread,
    posted_date,
    croaker_identifier,
    croaker_name,
    files: [{
      name: file.name,
      url: fileUrl,
      content_type: file.content_type,
    }],
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

  const authorizeMutationErr = authorizeMutation(actor);
  if (authorizeMutationErr) {
    return authorizeMutationErr;
  }

  const actorAuthority = await read(context.db, 'role', { role_name: actor.role_name });
  const croak = await read(context.db, 'croak', { croak_id: croakId });

  if (!croak.user_id === actor.user_id && !actorAuthority.delete_other_post) {
    return new AuthorityError(actor.croaker_identifier, 'delete_other_post', '自分以外の投稿を削除することはできません');
  }

  return await delete(context.db, 'croak', { croak_id: croakId });
};
