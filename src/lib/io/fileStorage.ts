import { Storage as GoogleCloudStorage, UploadOptions } from '@google-cloud/storage';
import { v4 } from 'uuid';
import { HandleableError } from '@/lib/base/error';

type StorageConfig = {
  storage: GoogleCloudStorage;
  bucketName: string;
  directory: string;
};

let storage: StorageConfig;

type CreateStorage = () => StorageConfig;
const createStorage: CreateStorage = () => {
  const googleCloudStorage = new GoogleCloudStorage({
    projectId: process.env.GOOGLE_CLOUD_PROJECT,
    keyFilename: process.env.GOOGLE_CLOUD_KEY,
    credentials: { // TODO
      client_email: '',
      private_key: '',
    },
  });
  return {
    storage: googleCloudStorage,
    bucketName: process.env.STORAGE_BUCKET || "",
    directory: process.env.STORAGE_DIRECTORY || "",
  };
}

type UploadFile = (config: StorageConfig) => (localFilePath: string, extension: string) => Promise<string | FileError>;
const uploadFile: UploadFile = ({ storage, bucketName, directory }) => async (localFilePath, extension) => {

  try {
    const storageFileName = `${v4()}.${extension}`;

    const bucket = storage.bucket(bucketName);

    await bucket.upload(localFilePath, { destination: `${directory}/${storageFileName}`, gzip: true });

    return storageFileName;

  } catch (e) {
    if (e instanceof Error) {
      return new FileError(
        'upload',
        localFilePath,
        e,
        'ファイルアップロードできませんでした'
      );
    }
    throw e;
  }
}

type GeneratePreSignedUrl = (config: StorageConfig) => (filePath: string) => Promise<string | FileError>
const generatePreSignedUrl: GeneratePreSignedUrl = ({ storage, bucketName, directory }) => async (filePath) => {

  try {
    const bucket = storage.bucket(bucketName);
    const [ url ] = await bucket.file(`${directory}/${filePath}`).getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: Date.now() + (15 * 60 * 1000), // 15 minutes
    });
    return url;

  } catch (e) {
    if (e instanceof Error) {
      return new FileError(
        'preSignedUrl',
        filePath,
        e,
        '署名付きURLを発行できませんでした'
      );
    }
    throw e;
  }
}

export type Storage = {
  generatePreSignedUrl: ReturnType<GeneratePreSignedUrl>;
  uploadFile: ReturnType<UploadFile>;
}

export type GetStorage = () => Storage;
export const getStorage: GetStorage = () => {

  if (storage) {
    storage = createStorage();
  }

  return {
    uploadFile: uploadFile(storage),
    generatePreSignedUrl: generatePreSignedUrl(storage),
  };
};

export class FileError extends HandleableError {
  override readonly name = 'lib.fileStorage.FileError' as const;
  constructor(
    readonly action: string,
    readonly path: string,
    readonly exception: Error,
    readonly message: string,
  ) {
    super();
  }
}
