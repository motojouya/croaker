import { Kysely } from 'kysely'
import { Croak as CroakFromDB } from '@/rdb/query/croak';
import { top } from '@/rdb/query/top';
import { search } from '@/rdb/query/search';
import { thread } from '@/rdb/query/thread';
import { Context } from '@/lib/context';
import { Storage } from '@/lib/fileStorage';
import { ContextFullFunction, setContext } from '@/lib/context';

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

type SetFileUrl = (storage: Storage, croaksFromTable: CroakFromTable[]) => Promise<Croak[] | FileError>
const setFileUrl: SetFileUrl = async (storage, croaksFromTable) => {

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

type GetCroaks = (storage: Storage, query: () => Promise<CroakFromDB>) => Promise<CroakList | FileError>;
const getCroaks: GetCroaks = async (storage, query) => {

  const result = await query();
  if (!result || result.length === 0) {
    return [];
  }

  const croaks = await setFileUrl(storage, result);
  if (croaks instanceof FileError) {
    return croaks;
  }

  return getCroakList(croaks);
};

export type FunctionResult = CroakList | FileError;

/*
 * top
 */
const getTopCroakContext = {
  db: () => getDatabase({ top }),
  storage: getStorage,
} as const;

export type GetTopCroak = ContextFullFunction<
  typeof getTopCroakContext,
  (reverse?: boolean, offsetCursor?: number) => Promise<FunctionResult>
>;
export const getTopCroaks: GetTopCroak =
  ({ storage, db }) =>
  (reverse = false, offsetCursor = 0) =>
  getCroaks(storage, () => db.top(reverse, offsetCursor, DISPLAY_LIMIT + 1));

setContext(getTopCroaks, getTopCroakContext);

/*
 * thread
 */
const getThreadCroaksContext = {
  db: () => getDatabase({ thread }),
  storage: getStorage,
} as const;

export type GetThreadCroaks = ContextFullFunction<
  typeof getThreadCroaksContext,
  (threadId: number, reverse?: boolean, offsetCursor?: number) => Promise<FunctionResult>
>;
export const getThreadCroaks: GetThreadCroaks =
  ({ storage, db }) =>
  (threadId, reverse = false, offsetCursor = 0) =>
  getCroaks(storage, () => db.thread(threadId, reverse, offsetCursor, DISPLAY_LIMIT + 1));

setContext(getThreadCroaks, getThreadCroaksContext);

/*
 * search
 */
const searchCroaksContext = {
  db: () => getDatabase({ search }),
  storage: getStorage,
} as const;

export type SearchCroaks = ContextFullFunction<
  typeof searchCroaksContext,
  (text: number, reverse?: boolean, offsetCursor?: number) => Promise<FunctionResult>
>;
export const searchCroaks: SearchCroaks =
  ({ storage, db }) =>
  (text, reverse = false, offsetCursor = 0) =>
  getCroaks(storage, () => db.search(text, reverse, offsetCursor, DISPLAY_LIMIT + 1));

setContext(searchCroaks, searchCroaksContext);
