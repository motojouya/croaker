import { getSession } from '@/lib/session';
import { getDatabase } from '@/lib/rdb';
import { Croak } from '@/rdb/query/croak';
import { read } from '@/rdb/query/base';
import { getLastCroak } from '@/rdb/query/getLastCroak';
import { createFileCroak } from '@/rdb/command/createFileCroak';
import { STORAGE_TYPE_GCS } from '@/rdb/type/croak';
import { InvalidArgumentsError } from '@/lib/validation';
import { getImageFile } from '@/lib/image';
import { getStorage, FileError } from '@/lib/fileStorage';
import { ContextFullFunction, setContext } from '@/lib/context';
import {
  AuthorityError,
  authorizeMutation,
  authorizePostCroak,
  authorizePostFile,
} from '@/lib/authorize';
import { getLocal } from '@/lib/local';

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

export type FunctionResult =
  | Omit<Croak, 'has_thread' | 'links'>
  | AuthorityError
  | InvalidArgumentsError
  | FileError
  | ImageCommandError
  | ImageFormatError;

const postFileContext = {
  db: () => getDatabase({ read, getLastCroak }, { createFileCroak }),
  session: getSession,
  storage: getStorage,
  imageFile: getImageFile,
  local: getLocal,
} as const;

export type PostFile = ContextFullFunction<
  typeof postFileContext,
  (file: File, thread?: number) => Promise<FunctionResult>
>;
// TODO Fileにどういう情報が入ってるかよくわかっていない
export const postFile: PostFile = ({ session, db, storage, local, imageFile }) => async (file, thread) => {

  const actor = session.getActor();

  if (!file) {
    return null;
  }

  if (thread && thread < 1) {
    return new InvalidArgumentsError('thread', thread, 'threadは1以上の整数です');
  }

  const authorizeMutationErr = authorizeMutation(actor);
  if (authorizeMutationErr) {
    return authorizeMutationErr;
  }

  const actorAuthority = await db.read('role', { role_name: actor.role_name });
  if (!actorAuthority) {
    throw new Error('user role is not assigned!');
  }

  const lastCroak = await db.getLastCroak(actor.croaker_identifier);
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
    uploadFilePath instanceof ImageCommandError ||
    uploadFilePath instanceof ImageFormatError
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
