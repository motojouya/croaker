// TODO 関数の引数にしてしまう
// import { Actor, getSession } from '@/lib/rdb' // TODO session
// const actor = getSession(); // TODO from session. nullable

export type DependedFunctions = Record<string, () => unknown>; // TODO any? unknown?

export type BindFunction = (func: any, wouldBind: DependedFunctions) => void;
export const bindFunction: BindFunction = (func: any, wouldBind: DependedFunctions) => {
  func._functions_would_bind_context = wouldBind;
};

// TODO funcの型をもっとちゃんと書いたほうがいいはず
// DependedFunctionsとかでてくるはず
export type BindContext<T> = (func: T) => ReturnType<T>;
export const bindContext: BindContext = (func) => {
  const bindedFuncs = Object.entries(func._functions_would_bind_context).reduce((acc, [key, val]) => {
    return {
      ...acc,
      [key]: val(),
    };
  }, {});
  return func(bindedFuncs);
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
