import { Kysely } from 'kysely'
import { getRdb } from '@/lib/rdb'
import { Actor, getRdb } from '@/lib/rdb' // TODO session
import { Storage, getStorage } from '@/lib/fileStorage';

export type Context = {
  db: Kysely,
  actor: Actor,
  storage: Storage;
};

export type ContextBinder<T> = (func: T) => ReturnType<T>
export const contextBinder: ContextBinder = (func) => (...argments) => {
  const db = getRdb();
  const actor = getRdb(); // TODO from session. nullable
  const storage = getStorage();
  return func({ db, storage, actor, })(...argments);
}

// export function contextBinder<T>(func: T): ReturnType<T> {
//   return function (...argments) {
//     const rdb = getRdb();
//     const actor = getRdb(); // TODO from session. nullable
//     return func(rdb, actor)(...argments);
//   }
// }

// example
//
// import { Kysely } from 'kysely';
// import { Actor } from '@/lib/session';
//
// type Func = (rdb: Kysely, actor: Actor) => (arg1: string, arg2: number) => Promise<Something>;
// const func: Func = (rdb, actor) => (arg1, arg2) => {
//   return null; // something
// };
