import { Kysely, NotNull, Null } from 'kysely'
import { add, compareAsc } from 'date-fns';

import { Session, getSession } from '@/lib/session';
import { DB, getDatabase } from '@/lib/rdb';
import { Croak, CroakMini } from '@/rdb/query/croak';
import { create, delete, read } from '@/rdb/query/base';
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
import { ContextFullFunction, setContext } from '@/lib/context';
import { Actor } from '@/lib/session';
import {
  CHARACTOR_COUNT_MAX,
  trimText,
  charCount,
} from '@/lib/text';
import {
  URL_REG_EXP,
  getLinks,
} from '@/lib/fetch';

export type PostCroak = ContextFullFunction<
  {
    'session': Session,
    'db': DB<
      {
        'read': ReturnType<typeof read>,
        'getLastCroak': ReturnType<typeof getLastCroak>,
      },
      {
        'create': ReturnType<typeof create>
      }
    >,
  },
  (text: string, thread?: number) => Promise<
    | Omit<Croak, 'has_thread' | 'files'>
    | AuthorityError
    | InvalidArgumentsError
  >
>;
const postCroak: PostCroak = ({ session, db }) => async (text, thread) => {

  const actor = session.getActor();

  const lines = trimText(text);

  const charactorCount = charCount(lines);
  if (charactorCount < 1 || CHARACTOR_COUNT_MAX < charactorCount) {
    return new InvalidArgumentsError(actor.croaker_identifier, 'text', text, 'textは1以上140文字までです');
  }

  if (thread && thread < 1) {
    return new InvalidArgumentsError(actor.croaker_identifier, 'thread', thread, 'threadは1以上の整数です');
  }

  const authorizeMutationErr = authorizeMutation(actor);
  if (authorizeMutationErr) {
    return authorizeMutationErr;
  }

  const actorAuthority = await db.read('role', { role_name: actor.role_name });

  const lastCroak = await db.getLastCroak(actor.user_id);
  const authorizePostCroakErr = authorizePostCroak(actor, actorAuthority, lastCroak, !!thread);
  if (authorizePostCroakErr) {
    return authorizePostCroakErr;
  }

  const linkList = getLinks(lines);
  const linkInformations = await createLinks(linkList);

  const { croak, links } = await db.transact((trx) => {

    const croak = await trx.create('croak', {
      user_id: actor.user_id;
      contents: lines.join('\n'),
      thread: thread,
    });

    // TODO 並列化
    const links = [];
    let link;
    for (const linkInfo of linkInformations) {
      link = await trx.create('link', {
        croak_id: croak.croak_id,
        url: linkInfo.url,
        type: linkInfo.type;
        title: linkInfo.title,
        image: linkInfo.image,
        summary: linkInfo.summary,
      });
      links.push(link);
    }

    return { croak, links };
  });

  const { coak_id, contents, thread, posted_date, } = croak;
  const { croaker_identifier, croaker_name, } = actor;
  return {
    coak_id,
    contents,
    thread,
    posted_date,
    croaker_identifier,
    croaker_name,
    links,
  };
};
setContext(postCroak, {
  'db': () => getDatabase({ read, getLastCroak }, { create }),
  'session': getSession,
});
export postCroak;

// TODO Fileにどういう情報が入ってるかよくわかっていない
export type PostFile = (context: Context) => (file: File, thread?: number) => Promise<
  | Omit<Croak, 'has_thread' | 'links'>
  | AuthorityError
  | InvalidArgumentsError
  | FileError
  | ImageCommandError
  | ImageFormatError
>;
export const postFile: PostFile = ({ actor, db, storage }) => async (file, thread) => {

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

  const actorAuthority = await read(db, 'role', { role_name: actor.role_name });

  const lastCroak = await getLastCroak(db)(actor.user_id);
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

  const uploadedSource = await uploadFile(storage)(uploadFilePath, file.extension);
  if (uploadedSource instanceof FileError) {
    return uploadedSource;
  }

  const { croak, file } = await transact(db, (trx) => {

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

    return { croak, file };
  });

  const fileUrl = generatePreSignedUrl(storage)(uploadedSource);
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

export type DeleteCroak = (context: Context) => (croakId: number) => Promise<Croak | AuthorityError>;
export const deleteCroak: DeleteCroak = ({ actor, db, storage }) => async (croakId) => {

  const authorizeMutationErr = authorizeMutation(actor);
  if (authorizeMutationErr) {
    return authorizeMutationErr;
  }

  return await transact(db, (trx) => {
    const actorAuthority = await read(trx, 'role', { role_name: actor.role_name });
    const croak = await read(trx, 'croak', { croak_id: croakId });

    if (!croak.user_id === actor.user_id && !actorAuthority.delete_other_post) {
      return new AuthorityError(actor.croaker_identifier, 'delete_other_post', '自分以外の投稿を削除することはできません');
    }

    return await delete(db, 'croak', { croak_id: croakId });
  });
};

type AuthorizeMutation = (actor?: Actor) => undefined | AuthorityError;
const authorizeMutation: AuthorizeMutation = (actor) => {

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

