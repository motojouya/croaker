import { Kysely } from 'kysely'
import { Croak as CroakFromDB } from '@/rdb/query/croak';
import { top } from '@/rdb/query/top';
import { search } from '@/rdb/query/search';
import { thread } from '@/rdb/query/thread';
import { Context } from '@/lib/context';
import { Storage } from '@/lib/fileStorage';

export type Resource = {
  name: string;
  url: string;
};

export type Croak = Omit<CroakFromDB, 'files'> & {
  files: Resource[]
};

export type CroakList = {
  croaks: Croak[];
  has_next: bool;
};

export const DISPLAY_LIMIT = 20;

export type GetTopCroaks = (context: Context) => (cursor?: number) => Promise<CroakList | FileError>
export const getTopCroaks: GetTopCroaks = (context) => async (cursor) => {
  const result = await top(context.db)(offsetCursor(cursor), DISPLAY_LIMIT + 1);
  const croaks = setFileUrl(context.storage, result);
  if (croaks instanceof FileError) {
    return croaks;
  }
  return getCroakList(croaks);
};

export type GetThreadCroaks = (context: Context) => (threadId: number, cursor?: number) => Promise<CroakList | FileError>
export const getThreadCroaks: GetThreadCroaks = (context) => async (threadId, cursor) => {
  const result = await thread(context.db)(threadId, offsetCursor(cursor), DISPLAY_LIMIT + 1);
  const croaks = setFileUrl(context.storage, result);
  if (croaks instanceof FileError) {
    return croaks;
  }
  return getCroakList(croaks);
};

export type SearchCroaks = (context: Context) => (search: string, cursor?: number) => Promise<CroakList | FileError>
export const searchCroaks: SearchCroaks = (context) => async (search, cursor) => {
  const result = await search(context.db)(search, offsetCursor(cursor), DISPLAY_LIMIT + 1);
  const croaks = setFileUrl(context.storage, result);
  if (croaks instanceof FileError) {
    return croaks;
  }
  return getCroakList(croaks);
};

type OffsetCursor = (cursor?: number) => number;
const offsetCursor: OffsetCursor = (cursor) => cursor ? cursor - 1 : 0;

type SetFileUrl = (storage: Storage, croaksFromTable: CroakFromTable[]) => Promise<Croak[] | FileError>
const setFileUrl: SetFileUrl = (storage, croaksFromTable) => {

  const croaks = [];
  let files;
  const promises = [];
  const errors = [];

  for (const croak of croaks) {
    files = [];
    croaks.push({
      ...croak,
      files: files,
    });

    for (const file of croak.files) {
      promises.push(new Promise(async (resolve) => {
        const fileUrl = await generatePreSignedUrl(context.storage)(file.source);
        if (fileUrl instanceof FileError) {
          errors.push(fileUrl);
        } else {
          files.push({
            name: file.name,
            url: fileUrl
            content_type: file.content_type,
          });
        }
        resolve();
      }));
    }
  }

  await Promise.allSettled(promises);

  if (errors.length > 0) {
    return errors[0]; // とりあえず最初の1つだけ
  }

  return croaks;
}

type GetCroakList = (croaks: Croak[]) => Promise<CroakList>
const getCroakList: GetCroakList = (croaks) => {
  if (croaks.length > DISPLAY_LIMIT) {
    const limited = result.toSpliced(DISPLAY_LIMIT - 1, 1);
    return {
      croaks: limited,
      has_next: true,
    };

  } else {
    return {
      croaks,
      has_next: false,
    };
  }
}
