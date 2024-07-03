import { Storage, FileFail } from '@/lib/io/fileStorage';
import {
  CroakRecord,
  LinkRecord,
  FileRecord,
} from '@/database/type/croak'

export type FileResource = {
  name: string;
  url: string;
  content_type: string;
};

export type Link = LinkRecord;
export type File = FileRecord;
export type Croak = Omit<CroakRecord, 'user_id'> & {
  has_thread: boolean;
  croaker_name: string;
  links: Link[];
  files: FileResource[];
};

export type ResolveFileUrl = (storage: Storage, croak: Omit<Croak, 'files'>, files: File[]) => Promise<Croak | FileFail>;
export const resolveFileUrl: ResolveFileUrl = async (storage, croak, files) => {

  const promises = [];
  const fileResources: FileResource[] = [];
  const errors: FileFail[] = [];
  for (const file of files) {
    promises.push(new Promise(async (resolve) => {
      const fileUrl = await storage.generatePreSignedUrl(file.source);
      if (fileUrl instanceof FileFail) {
        errors.push(fileUrl);
      } else {
        fileResources.push({
          name: file.name,
          url: fileUrl,
          content_type: file.content_type,
        });
      }
      resolve(null);
    }));
  }

  await Promise.allSettled(promises);

  if (errors.length > 0) {
    return errors[0]; // TODO とりあえず最初の1つ
  }

  return {
    ...croak,
    files: fileResources,
  };
};
