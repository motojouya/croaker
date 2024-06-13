import { Kysely, NotNull, Null } from 'kysely'
import { add, compareAsc } from 'date-fns';

import { Session, getSession } from '@/lib/session';
import { DB, getDatabase } from '@/lib/rdb';
import { Croak, CroakMini } from '@/rdb/query/croak';
import { create, delete, read } from '@/rdb/query/base';
import { getRoleAuthority } from '@/lib/role'
import { getLastCroak } from '@/rdb/query/getLastCroak';
import { createTextCroak } from '@/rdb/command/createTextCroak';
import { createFileCroak } from '@/rdb/command/createFileCroak';
import { deleteCroak } from '@/rdb/command/deleteCroak';
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
import { InvalidArgumentsError } from '@/lib/validation';
import { ImageFile, getImageFile } from '@/lib/image';
import { Storage, getStorage, FileError } from '@/lib/fileStorage';
import { ContextFullFunction, setContext } from '@/lib/context';
import { Actor } from '@/lib/session';
import {
  CHARACTOR_COUNT_MAX,
  trimText,
  charCount,
} from '@/lib/text';
import {
  getLinks,
  Fetcher,
  getFetcher,
} from '@/lib/fetch';
import {
  AuthorityError,
  authorizeMutation,
  authorizePostCroak,
  authorizePostFile,
} from '@/lib/authorize';
import {
  Local,
  getLocal,
} from '@/lib/local';

// export type PostCroak = ContextFullFunction<
//   {
//     session: Session,
//     fetcher: Fetcher,
//     local: Local,
//     db: DB<
//       {
//         read: ReturnType<typeof read>,
//         getLastCroak: ReturnType<typeof getLastCroak>,
//       },
//       {
//         create: ReturnType<typeof create>
//       }
//     >,
//   },
//   (text: string, thread?: number) => Promise<
//     | Omit<Croak, 'has_thread' | 'files'>
//     | AuthorityError
//     | InvalidArgumentsError
//   >
// >;

const postCroakContext = {
  db: () => getDatabase({ read, getLastCroak }, { createTextCroak }),
  session: getSession,
  fetcher: getFetcher,
  local: getLocal,
} as const;

export type PostCroak = ContextFullFunction<
  typeof postCroakContext,
  (text: string, thread?: number) => Promise<
    | Omit<Croak, 'has_thread' | 'files'>
    | AuthorityError
    | InvalidArgumentsError
  >
>;
export const postCroak: PostCroak = ({ session, db, local, fetcher }) => async (text, thread) => {

  const actor = session.getActor();

  const lines = trimText(text);

  const charactorCount = charCount(lines);
  if (charactorCount < 1 || CHARACTOR_COUNT_MAX < charactorCount) {
    return new InvalidArgumentsError(actor.croaker_identifier, 'text', text, `textは1以上${CHARACTOR_COUNT_MAX}文字までです`);
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
  // TODO RecordNotFoundErrorが出るはず

  const authorizePostCroakErr = authorizePostCroak(actor, actorAuthority, lastCroak, local.now(), !!thread);
  if (authorizePostCroakErr) {
    return authorizePostCroakErr;
  }

  const linkList = getLinks(lines);
  const ogps = await fetcher.fetchOgp(linkList);

  const createCroak = {
    user_id: actor.user_id;
    contents: lines.join('\n'),
    thread: thread,
  };
  const createLinks = ogps.map(ogp => ({
    url: ogp.url,
    type: ogp.type;
    title: ogp.title,
    image: ogp.image,
    summary: ogp.summary,
  }));

  const croak = await db.transact((trx) => trx.createTextCroak(createCroak, createLinks));

  const { coak_id, contents, thread, posted_date, links } = croak;
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

setContext(postCroak, postCroakContext);

// export type PostFile = ContextFullFunction<
//   {
//     session: Session,
//     imageFile: ImageFile,
//     storage: Storage,
//     local: Local,
//     db: DB<
//       {
//         read: ReturnType<typeof read>,
//         getLastCroak: ReturnType<typeof getLastCroak>,
//       },
//       {
//         create: ReturnType<typeof create>
//       }
//     >,
//   },
//   (file: File, thread?: number) => Promise<
//     | Omit<Croak, 'has_thread' | 'links'>
//     | AuthorityError
//     | InvalidArgumentsError
//     | FileError
//     | ImageCommandError
//     | ImageFormatError
//   >,
// >;

const postFileContext = {
  db: () => getDatabase({ read, getLastCroak }, { createFileCroak }),
  session: getSession,
  storage: getStorage,
  imageFile: getImageFile,
  local: getLocal,
} as const;

export type PostFile = ContextFullFunction<
  typeof postFileContext,
  (file: File, thread?: number) => Promise<
    | Omit<Croak, 'has_thread' | 'links'>
    | AuthorityError
    | InvalidArgumentsError
    | FileError
    | ImageCommandError
    | ImageFormatError
  >,
>;
// TODO Fileにどういう情報が入ってるかよくわかっていない
export const postFile: PostFile = ({ session, db, storage, local, imageFile }) => async (file, thread) => {

  const actor = session.getActor();

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

  const actorAuthority = await db.read('role', { role_name: actor.role_name });
  const lastCroak = await db.getLastCroak(actor.user_id);
  // TODO RecordNotFoundErrorが出るはず

  const authorizePostCroakErr = authorizePostCroak(actor, actorAuthority, lastCroak, local.now(), !!thread);
  if (authorizePostCroakErr) {
    return authorizePostCroakErr;
  }

  const authorizePostFileErr = authorizePostFile(actor, actorAuthority);
  if (authorizePostFileErr) {
    return authorizePostFileErr;
  }

  const uploadFilePath = await imageFile.convert(file.name);
  if (
    converted instanceof ImageCommandError ||
    converted instanceof ImageFormatError
  ) {
    return converted;
  }

  const uploadedSource = await storage.uploadFile(uploadFilePath, file.extension);
  if (uploadedSource instanceof FileError) {
    return uploadedSource;
  }

  const createCroak = {
    user_id: actor.user_id;
    contents: null,
    thread: thread,
  };
  const createFile = {
    storage_type: STORAGE_TYPE_GCS,
    source: uploadedSource,
    name: file.name,
    content_type: file.type;
  };

  const croak = await db.transact((trx) => trx.createFileCroak(createCroak, createFile));

  const fileUrl = storage.generatePreSignedUrl(uploadedSource);
  if (fileUrl instanceof FileError) {
    return fileUrl;
  }

  const { coak_id, contents, thread, posted_date, files, } = croak;
  const { croaker_identifier, croaker_name, } = actor;
  return {
    coak_id,
    contents,
    thread,
    posted_date,
    croaker_identifier,
    croaker_name,
    files: files.map(file => {
      name: file.name,
      url: fileUrl,
      content_type: file.content_type,
    }),
  };
};

setContext(postFile, postFileContext);

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

// export type DeleteCroak = ContextFullFunction<
//   {
//     session: Session,
//     db: DB<{}, {
//       read: ReturnType<typeof read>,
//       update: ReturnType<typeof update>,
//     }>,
//   },
//   (croakId: number) => Promise<Croak | AuthorityError>
// >;

const deleteCroakContext = {
  db: () => getDatabase(null, { read, deleteCroak }),
  session: getSession,
} as const;

export type DeleteCroak = ContextFullFunction<
  typeof deleteCroakContext,
  (croakId: number) => Promise<Croak | AuthorityError>,
>;
export const deleteCroak: DeleteCroak = ({ session, db }) => async (croakId) => {

  const actor = session.getActor();

  const authorizeMutationErr = authorizeMutation(actor);
  if (authorizeMutationErr) {
    return authorizeMutationErr;
  }

  return await db.transact((trx) => {
    const actorAuthority = await trx.read('role', { role_name: actor.role_name });
    const croak = await trx.read('croak', { croak_id: croakId });
    // TODO RecordNotFoundErrorが出るはず

    if (!croak.user_id === actor.user_id && !actorAuthority.delete_other_post) {
      return new AuthorityError(actor.croaker_identifier, 'delete_other_post', '自分以外の投稿を削除することはできません');
    }

    return await trx.deleteCroak(croakId);
  });
};

setContext(deleteCroak, deleteCroakContext);
