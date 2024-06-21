import { getDatabase } from '@/lib/database/base';
import { Croak } from '@/database/query/croak';
import { getLastCroak } from '@/database/query/getLastCroak';
import { createFileCroak } from '@/database/command/createFileCroak';
import { STORAGE_TYPE_GCS } from '@/database/type/croak';
import { InvalidArgumentsError } from '@/lib/base/validation';
import { getImageFile } from '@/lib/io/image';
import { getStorage, FileError } from '@/lib/io/fileStorage';
import { ContextFullFunction, setContext } from '@/lib/base/context';
import { getLocal } from '@/lib/io/local';
import { Identifier, AuthorityError, authorizeCroaker } from '@/authorization/base';
import { getCroakerUser } from '@/database/getCroakerUser';
import { AUTHORIZE_FORM_AGREEMENT } from '@/authorization/validation/formAgreement';
import { AUTHORIZE_BANNED } from '@/authorization/validation/banned';
import { getAuthorizePostCroak } from '@/authorization/validation/postCroak';
import { AUTHORIZE_POST_FILE } from '@/authorization/validation/postFile';
import { trimContents } from '@/domain/text/contents';
import { nullableThread } from '@/domain/id';

import { pipe } from "fp-ts/function";
import * as TE from 'fp-ts/TaskEither';
// import { pipe } from "fp-ts/lib/function";
// import * as TE from "fp-ts/lib/TaskEither";
import { in, out } from '@/lib/base/fp/taskEither';

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
  db: () => getDatabase({ getCroakerUser, getLastCroak }, { createFileCroak }),
  storage: getStorage,
  imageFile: getImageFile,
  local: getLocal,
} as const;

export type PostFile = ContextFullFunction<
  typeof postFileContext,
  (identifier: Identifier) => (file: File, thread?: number) => Promise<FunctionResult>
>;
// TODO Fileにどういう情報が入ってるかよくわかっていない
export const postFile: PostFile = ({ db, storage, local, imageFile }) => (identifier) => async (file, thread) => {

  if (!file) {
    return null;
  }

  const nullableThread = nullableId(thread, 'thread');
  if (nullableThread instanceof InvalidArgumentsError) {
    return nullableThread;
  }

  const croaker = await getCroaker(identifier, !!nullableThread, local, db);
  if (croaker instanceof AuthorityError) {
    return croaker;
  }

  const uploadFilePath = await imageFile.convert(file.name);
  if (
    uploadFilePath instanceof ImageCommandError ||
    uploadFilePath instanceof ImageFormatError
  ) {
    return uploadFilePath;
  }

  const uploadedSource = await storage.uploadFile(uploadFilePath, file.extension);
  if (uploadedSource instanceof FileError) {
    return uploadedSource;
  }

  const croakData = {
    croaker_id: croaker.croaker_id,
    contents: null,
    thread: nullableThread,
  };
  const fileData = {
    storage_type: STORAGE_TYPE_GCS,
    source: uploadedSource,
    name: file.name,
    content_type: file.type,
  };

  const croak = await db.transact((trx) => trx.createFileCroak(croakData, fileData));

  const fileUrl = await storage.generatePreSignedUrl(uploadedSource);
  if (fileUrl instanceof FileError) {
    return fileUrl;
  }

  const { files, ...rest } = croak;
  return {
    ...rest,
    croaker_name: croaker.name,
    files: files.map(file => {
      name: file.name,
      url: fileUrl,
      content_type: file.content_type,
    }),
  };
};

setContext(postFile, postFileContext);

export const postFileFP: PostFile = ({ db, storage, local, imageFile }) => (identifier) => async (file, thread) => {

  // TODO 仕様がわからんので今は外側だが、ちゃんとpipeに組み込む
  if (!file) {
    return null;
  }

  return await pipe(
    TE.Do,
    TE.bind("nullableThread", inS(() => nullableId(thread, 'thread'))),
    TE.bind("croaker", in(
      ({ nullableThread }) => getCroaker(identifier, !!nullableThread, local, db)
    )),
    TE.bind("uploadFilePath", in(() => imageFile.convert(file.name))),
    TE.bind("uploadedSource", in(
      ({ uploadFilePath }) => storage.uploadFile(uploadFilePath, file.extension)
    )),

    TE.bind("croakData", inS(({ croaker, nullableThread }) => ({
      croaker_id: croaker.croaker_id,
      contents: null,
      thread: nullableThread,
    }))),
    TE.bind("fileData", inS(({ uploadedSource }) => ({
      storage_type: STORAGE_TYPE_GCS,
      source: uploadedSource,
      name: file.name,
      content_type: file.type,
    }))),
    TE.bind("croak", in(({ croakData, fileData }) => db.transact((trx) => trx.createFileCroak(croakData, fileData)))),

    TE.bind("fileUrl", in(({ uploadedSource }) => storage.generatePreSignedUrl(uploadedSource))),
    out(({ croak, fileUrl, croaker, }) => {
      const { files, ...rest } = croak;
      return {
        ...rest,
        croaker_name: croaker.name,
        files: files.map(file => {
          name: file.name,
          url: fileUrl,
          content_type: file.content_type,
        }),
      };
    }),
  )();
};

setContext(postFileFP, postFileContext);

type ReadableDB = {
  getCroakerUser: ReturnType<typeof getCroakerUser>,
  getLastCroak: ReturnType<typeof getLastCroak>,
};
type GetCroaker = (identifier: Identifier, isThread: boolean, local: Local, db: ReadableDB) => Promise<Croaker | AuthorityError>;
const getCroaker: GetCroaker = async (identifier, isThread, local, db) => {

  const authorizePostCroak = getAuthorizePostCroak(
    isThread,
    local.now,
    async (croaker_id) => {
      const lastCroak = await db.getLastCroak(croaker_id);
      return lastCroak ? lastCroak.posted_date : null;
    },
  );

  return await authorizeCroaker(
    identifier,
    db.getCroakerUser,
    [AUTHORIZE_FORM_AGREEMENT, AUTHORIZE_BANNED, authorizePostCroak, AUTHORIZE_POST_FILE]
  );
};
