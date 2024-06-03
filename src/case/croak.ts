import { Kysely, NotNull, Null } from 'kysely'
import { Croak } from '@/rdb/query/croak';
import { top } from '@/rdb/query/top';
import { search } from '@/rdb/query/search';
import { thread } from '@/rdb/query/thread';
import { Actor } from '@/lib/session'; // TODO

export type CroakList = {
  croaks: Croak[];
  has_next: bool;
};

export const DISPLAY_LIMIT = 20;

export type GetTopCroaks = (rdb: Kysely, actor: Actor) => (cursor?: number) => Promise<CroakList>
export const getTopCroaks: GetTopCroaks = (rdb, actor) => async (cursor) => {
  const offsetCursor = cursor ? cursor - 1 : 0;
  const result = await top(rdb)(offsetCursor, DISPLAY_LIMIT + 1);
  return getCroakList(result);
};

export type GetThreadCroaks = (rdb: Kysely, actor: Actor) => (threadId: number, cursor?: number) => Promise<CroakList>
export const getThreadCroaks: GetThreadCroaks = (rdb, actor) => async (threadId, cursor) => {
  const offsetCursor = cursor ? cursor - 1 : 0;
  const result = await thread(rdb)(threadId, offsetCursor, DISPLAY_LIMIT + 1);
  return getCroakList(result);
};

export type SearchCroaks = (rdb: Kysely, actor: Actor) => (search: string, cursor?: number) => Promise<CroakList>
export const searchCroaks: SearchCroaks = (rdb, actor) => async (search, cursor) => {
  const offsetCursor = cursor ? cursor - 1 : 0;
  const result = await search(rdb)(search, offsetCursor, DISPLAY_LIMIT + 1);
  return getCroakList(result);
};

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
