import { Croak as CroakFromDB } from "@/database/query/croak/croak";
import { top } from "@/database/query/croak/top";
import { search } from "@/database/query/croak/search";
import { thread } from "@/database/query/croak/thread";
import { Storage, getStorage } from "@/lib/io/fileStorage";
import { FileFail } from "@/lib/io/fileStorageFail";
import { Context, ContextFullFunction, setContext } from "@/lib/base/context";
import { Identifier } from "@/domain/authorization/base";
import { FileRecord } from "@/database/type/croak";
import { getDatabase } from "@/database/base";
import { resolveFileUrl, Croak } from "@/domain/croak/croak";

export const DISPLAY_LIMIT = 20;

type SetFileUrl = (storage: Storage, croaksFromTable: CroakFromDB[]) => Promise<Croak[] | FileFail>;
const setFileUrl: SetFileUrl = async (storage, croaksFromTable) => {
  const promises = [];
  const croaks: Croak[] = [];
  const errors: FileFail[] = [];

  for (const croak of croaksFromTable) {
    const { files, ...rest } = croak;
    promises.push(
      new Promise(async (resolve) => {
        const resolvedCroak = await resolveFileUrl(storage, rest, files);
        if (resolvedCroak instanceof FileFail) {
          errors.push(resolvedCroak);
        } else {
          croaks.push(resolvedCroak);
        }
        resolve(null);
      }),
    );
  }

  await Promise.allSettled(promises);

  if (errors.length > 0) {
    return errors[0]; // とりあえず最初の1つだけ
  }

  return croaks;
};

type GetCroaks = (storage: Storage, query: () => Promise<CroakFromDB[]>) => Promise<Croak[] | FileFail>;
const getCroaks: GetCroaks = async (storage, query) => {
  const result = await query();
  if (!result || result.length === 0) {
    return [];
  }

  const croaks = await setFileUrl(storage, result);
  if (croaks instanceof FileFail) {
    return croaks;
  }

  return croaks;
};

export type FunctionResult = Croak[] | FileFail;

/*
 * top
 */
const getTopCroakContext = {
  db: () => getDatabase({ top }, null),
  storage: getStorage,
} as const;

export type GetTopCroak = ContextFullFunction<
  typeof getTopCroakContext,
  (identifier: Identifier) => (reverse?: boolean, offsetCursor?: number) => Promise<FunctionResult>
>;
export const getTopCroaks: GetTopCroak =
  ({ storage, db }) =>
  (identifier) =>
  (reverse = false, offsetCursor = 0) =>
    getCroaks(storage, () => db.top(reverse, offsetCursor, DISPLAY_LIMIT));

setContext(getTopCroaks, getTopCroakContext);

/*
 * thread
 */
const getThreadCroaksContext = {
  db: () => getDatabase({ thread }, null),
  storage: getStorage,
} as const;

export type GetThreadCroaks = ContextFullFunction<
  typeof getThreadCroaksContext,
  (identifier: Identifier) => (threadId: number, reverse?: boolean, offsetCursor?: number) => Promise<FunctionResult>
>;
export const getThreadCroaks: GetThreadCroaks =
  ({ storage, db }) =>
  (identifier) =>
  (threadId, reverse = false, offsetCursor = 0) =>
    getCroaks(storage, () => db.thread(threadId, reverse, offsetCursor, DISPLAY_LIMIT));

setContext(getThreadCroaks, getThreadCroaksContext);

/*
 * search
 */
const searchCroaksContext = {
  db: () => getDatabase({ search }, null),
  storage: getStorage,
} as const;

export type SearchCroaks = ContextFullFunction<
  typeof searchCroaksContext,
  (identifier: Identifier) => (text: string, reverse?: boolean, offsetCursor?: number) => Promise<FunctionResult>
>;
export const searchCroaks: SearchCroaks =
  ({ storage, db }) =>
  (identifier) =>
  (text, reverse = false, offsetCursor = 0) =>
    getCroaks(storage, () => db.search(text, reverse, offsetCursor, DISPLAY_LIMIT));

setContext(searchCroaks, searchCroaksContext);
