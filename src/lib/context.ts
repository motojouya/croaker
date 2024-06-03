import { getRdb } from '@/lib/rdb'
import { getRdb } from '@/lib/rdb' // TODO session

export type ContextBinder<T> = (func: T) => ReturnType<T>
export const contextBinder: ContextBinder = (func) => (...argments) => {
  const rdb = getRdb();
  const actor = getRdb(); // TODO from session. nullable
  return func(rdb, actor)(...argments);
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
