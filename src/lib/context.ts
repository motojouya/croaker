import { Kysely } from 'kysely'
import { getRdb, transact } from '@/lib/rdb'
import { Actor, getRdb } from '@/lib/rdb' // TODO session
import { Storage, getStorage } from '@/lib/fileStorage';

export type Context = {
  db: Kysely,
  actor?: Actor,
  storage: Storage;
};

export type BindFunction = () => void;
export const bundFunction: BindFunction = (func: any, wouldBind: any) => {
  func._would_bind_functions_in_di_container = wouldBind;
};

const injectionKeys = [
  'db',
  'storage',
  'http',
  'local', // TODO Date, local Files, Random を含むがどうする？
];


type GetArgNames = (func: Function) => string[]
const getArgNames: GetArgNames = (func) => {
  const source = func.toString()
    .replace(/\/\/.*$|\/\*[\s\S]*?\*\/|\s/gm, ''); // strip comments
  const argNames = source.match(/\((.*?)\)/)[1].split(',');

  if (argNames.length === 1 && argNames[0] === '') {
    return [];
  }
  return argNames;
}

// TODO 未完成
export type ContextBinder<T> = (func: T) => ReturnType<T>
export const contextBinder: ContextBinder = (func) => {

  const { transactionFunctions, ...rest } = func._would_bind_functions_in_di_container;

  const db = getRdb();
  const actor = getRdb(); // TODO from session. nullable
  const storage = getStorage();

  const bindedFuncs = {};
  for (const funcIndex in rest) {
    const func = rest[funcIndex];
    const argNames = getArgNames(func);

    const args = [];
    for (const argName of argNames) {
      switch (argName) {
        case 'db': args.push(db); break;
        case 'storage': args.push(db); break;
        default: return null; // TODO error 型作る
      }
    }
    bindedFuncs[funcIndex] = func(...args)
  }

  const inject = {
    actor,
    transact: transact(db, transactionFunctions),
    ...bindedFuncs,
  };

  return func(bindedFuncs);
}

export type ContextBinder<T> = (func: T) => ReturnType<T>
export const contextBinder: ContextBinder = (func) => {
  const db = getRdb();
  const actor = getRdb(); // TODO from session. nullable
  const storage = getStorage();
  return func({ db, storage, actor, });
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
