// TODO 関数の引数にしてしまうか、そもそもgetSessionをbindするかで解決できるはず
// import { Actor, getSession } from '@/lib/rdb' // TODO session
// const actor = getSession(); // TODO from session. nullable

export type GetContext<C> = { [K in keyof C]: () => C[K] };

export type ContextFullFunction<C, R> = {
  _context_setting?: GetContext<C>;
  (context: C): R;
};

export function setContext<C, R>(
  func: ContextFullFunction<C, R>,
  contextSetting: GetContext<C>
): void {
  func._context_setting = contextSetting;
};

export function bindContext<C, R>(func: ContextFullFunction<C, R>): R {

  if (!func._context_setting) {
    return func({});
  }

  const context = Object.entries(func._context_setting).reduce((acc, [key, val]) => {
    return {
      ...acc,
      [key]: val(),
    };
  }, {});
  return func(context);
}

// import { Kysely } from 'kysely'
// import { getRdb, transact } from '@/lib/rdb'
// import { Storage, getStorage } from '@/lib/fileStorage';

// type GetArgNames = (func: Function) => string[]
// const getArgNames: GetArgNames = (func) => {
//   const source = func.toString()
//     .replace(/\/\/.*$|\/\*[\s\S]*?\*\/|\s/gm, ''); // strip comments
//   const argNames = source.match(/\((.*?)\)/)[1].split(',');
// 
//   if (argNames.length === 1 && argNames[0] === '') {
//     return [];
//   }
//   return argNames;
// }

// export type ContextBinder<T> = (func: T) => ReturnType<T>
// export const contextBinder: ContextBinder = (func) => {
//   const db = getRdb();
//   const actor = getRdb(); // TODO from session. nullable
//   const storage = getStorage();
//   return func({ db, storage, actor, });
// }

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
