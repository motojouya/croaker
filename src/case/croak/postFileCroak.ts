import { getDatabase } from "@/database/base";
import { Croak as CroakFromDB } from "@/database/query/croak/croak";
import { getLastCroak } from "@/database/query/croakSimple/getLastCroak";
import { createFileCroak } from "@/database/query/command/createFileCroak";
import { STORAGE_TYPE_GCS } from "@/database/type/croak";
import { InvalidArgumentsFail } from "@/lib/base/validation";
import { ImageFile, getImageFile } from "@/lib/io/image";
import { ImageCommandFail, ImageInformationFail } from "@/lib/io/imageFail";
import { Storage, getStorage } from "@/lib/io/fileStorage";
import { FileFail } from "@/lib/io/fileStorageFail";
import { ContextFullFunction, setContext } from "@/lib/base/context";
import { Local, getLocal } from "@/lib/io/local";
import { Identifier, AuthorityFail, authorizeCroaker } from "@/domain/authorization/base";
import { Croaker } from "@/database/query/croaker/croaker";
import { getCroakerUser } from "@/database/query/croaker/getCroakerUser";
import { AUTHORIZE_FORM_AGREEMENT } from "@/domain/authorization/validation/formAgreement";
import { AUTHORIZE_BANNED } from "@/domain/authorization/validation/banned";
import { getAuthorizePostCroak } from "@/domain/authorization/validation/postCroak";
import { AUTHORIZE_POST_FILE } from "@/domain/authorization/validation/postFile";
import { trimContents } from "@/domain/croak/croak";
import { nullableId } from "@/domain/id";
import { FileData } from "@/lib/io/file";
import { resolveFileUrl, Croak } from "@/domain/croak/croak";

export type FunctionResult =
  | Croak
  | AuthorityFail
  | InvalidArgumentsFail
  | FileFail
  | ImageCommandFail
  | ImageInformationFail;

const postFileContext = {
  db: () => getDatabase({ getCroakerUser, getLastCroak }, { createFileCroak }),
  storage: getStorage,
  imageFile: getImageFile,
  local: getLocal,
} as const;

export type PostFile = ContextFullFunction<
  typeof postFileContext,
  (identifier: Identifier) => (file: FileData, thread?: number) => Promise<FunctionResult>
>;
export const postFile: PostFile =
  ({ db, storage, local, imageFile }) =>
  (identifier) =>
  async (file, thread) => {
    const nullableThread = nullableId("thread", thread);
    if (nullableThread instanceof InvalidArgumentsFail) {
      return nullableThread;
    }

    const croaker = await getCroaker(identifier, !!nullableThread, local, db);
    if (croaker instanceof AuthorityFail) {
      return croaker;
    }

    const uploadedSource = await uploadImage(file, storage, imageFile);
    if (
      uploadedSource instanceof ImageCommandFail ||
      uploadedSource instanceof ImageInformationFail ||
      uploadedSource instanceof FileFail
    ) {
      return uploadedSource;
    }

    const croakData = {
      croaker_id: croaker.croaker_id,
      contents: null,
      thread: nullableThread || undefined,
    };
    const fileData = {
      storage_type: STORAGE_TYPE_GCS,
      source: uploadedSource,
      name: file.name,
      content_type: file.type,
    };

    const croakResult = await db.transact((trx) => trx.createFileCroak(croakData, fileData));

    const { files, ...rest } = croakResult;
    const croak = {
      ...rest,
      has_thread: false,
      croaker_name: croaker.croaker_name,
      links: [],
    };

    return await resolveFileUrl(storage, croak, files);
  };

setContext(postFile, postFileContext);

type ReadableDB = {
  getCroakerUser: ReturnType<typeof getCroakerUser>;
  getLastCroak: ReturnType<typeof getLastCroak>;
};
type GetCroaker = (
  identifier: Identifier,
  isThread: boolean,
  local: Local,
  db: ReadableDB,
) => Promise<Croaker | AuthorityFail>;
const getCroaker: GetCroaker = async (identifier, isThread, local, db) => {
  const authorizePostCroak = getAuthorizePostCroak(
    isThread,
    async () => local.now(),
    async (croaker_id) => {
      const lastCroak = await db.getLastCroak(croaker_id);
      return lastCroak ? lastCroak.posted_date : null;
    },
  );

  return await authorizeCroaker(identifier, db.getCroakerUser, [
    AUTHORIZE_FORM_AGREEMENT,
    AUTHORIZE_BANNED,
    authorizePostCroak,
    AUTHORIZE_POST_FILE,
  ]);
};

type uploadImage = (
  file: FileData,
  storage: Storage,
  imageFile: ImageFile,
) => Promise<string | ImageCommandFail | ImageInformationFail | FileFail>;
const uploadImage: uploadImage = async (file, storage, imageFile) => {
  const uploadFilePath = await imageFile.convert(file.path);
  if (uploadFilePath instanceof ImageCommandFail || uploadFilePath instanceof ImageInformationFail) {
    return uploadFilePath;
  }

  const uploadedSource = await storage.uploadFile(uploadFilePath, file.extension);
  if (uploadedSource instanceof FileFail) {
    return uploadedSource;
  }

  return uploadedSource;
};
