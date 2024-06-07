import { Storage as GoogleCloudStorage, UploadOptions } from '@google-cloud/storage';
import { v4 } from 'uuid';

export class FileError extends Error {
  constructor(
    readonly action: string,
    readonly path: string,
    readonly exception: Error,
    readonly message: string,
  ) {
    super();
  }
}

// TODO contentTypeを判定するロジックも必要
// 判定したあとに、何を呼び出すかはcaseロジックの中でやればいい
// contentType 'text/plain' 'application/zip' 'image/jpeg' ...

type Upload = (from: string, to: string) => Promise<void>;
type Bucket = {
  upload: Upload;
};
type Storage = {
  getUploadFileBucket: () => Bucket;
}

let storage?: Storage = undefined;

type CreateStorage = () => Storage;
const createStorage: CreateStorage = () => {

  const googleCloudStorage = new GoogleCloudStorage({
    projectId: 'user-projectId',
    keyFilename: './key.json',
    credentials: {
      client_email,
      private_key,
    },
  });

  const getUploadFileBucket = () => {
    const innerBucket = googleCloudStorage.bucket('createbucket-69fd9e10-25eb-4311-aac3-9641fa49c247')
    return {
      upload: async (from, to) => {
        const dir = 'files';
        const destination = dir + '/' + to;
        await innerBucket.upload(from, { destination, gzip: true, });
      },
      getPreSignedUrl: async (fileName, options) => {
        const [ url ] = await innerBucket.file(fileName).getSignedUrl(options);
        return url;
      },
    }
  };

  return {
    getUploadFileBucket,
  }
}

export type GetStorage = () => Storage;
export const getStorage: GetStorage = () => {
  if (!storage) {
    storage = createStorage();
  }
  return storage;
};

export type UploadFile = (storage: Storage) => (localFilePath: string, extension: string) => Promise<string | FileError>;
export const uploadFile: UploadFile = async (localFilePath, extension) => {

  try {
    const storageFileName = `${v4()}.${extension}`;

    const bucket = storage.getUploadFileBucket();

    await bucket.upload(localFilePath, storageFileName);

    return storageFileName;

  } catch (e) {
    return new FileError(
      'upload',
      file_path,
      e,
      'ファイルアップロードできませんでした'
    );
  }
}

export type GeneratePreSignedUrl = (storage: storage, filePath: string) => Promise<string | FileError>
export const generatePreSignedUrl: GeneratePreSignedUrl = (storage, filePath) => {

  try {
    const bucket = storage.getUploadFileBucket();
    return await bucket.getPreSignedUrl(filePath, {
      version: 'v4',
      action: 'read',
      expires: Date.now() + (15 * 60 * 1000), // 15 minutes
    });

  } catch (e) {
    return new FileError(
      'preSignedUrl',
      filePath,
      e,
      '署名付きURLを発行できませんでした'
    );
  }
}
