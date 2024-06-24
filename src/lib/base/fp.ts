import * as E from 'fp-ts/Either';
// import * as T from 'fp-ts/Task';
import * as TE from 'fp-ts/TaskEither';

// export type Nrm<A> = A extends Error ? never : A;
// export type Err<A> = A extends Error ? A : never;
// export type Go<A> = E.Either<Err<A>, Nrm<A>>;
// export type GoT<A> = TE.TaskEither<Err<A>, Nrm<A>>;
// export function go<A>(func: () => A): Go<A> {
//   const result = func();
//   if (result instanceof Error) {
//     return E.left(result);
//   } else {
//     return E.right(result);
//   }
// }

export type Nrm<A> = A extends Error ? never : A;
export type Err<A> = A extends Error ? A : never;
export type ErrorUnion<A, E extends Error = never> = A | E;
export type ErrorReturn<A> = ErrorUnion<Nrm<A>, Err<A>>;

export function go<A>(func: () => ErrorReturn<A>): E.Either<Err<A>, Nrm<A>> {
  const result = func();
  if (result instanceof Error) {
    return E.left(result);
  } else {
    return E.right(result);
  }
}
// export function go<A, E extends Error = never>(func: () => ErrorUnion<A, E>): E.Either<E, A> {
//   const result = func();
//   if (result instanceof Error) {
//     return E.left(result);
//   } else {
//     return E.right(result);
//   }
// }

export function goT<A>(func: () => Promise<ErrorReturn<A>>): TE.TaskEither<Err<A>, Nrm<A>> {
  return async function () {
    const result = await func();
    if (result instanceof Error) {
      return E.left(result);
    } else {
      return E.right(result);
    }
  };
}

// export const goT = <A>(f: () => Promise<ErrorReturn<A>>): TE.TaskEither<Err<A>, Nrm<A>> =>
//   async () => {
//     const result = await f();
//     if (result instanceof Error) {
//       return E.left(result);
//     } else {
//       return E.right(result);
//     }
//   }

// 成功時の結果とエラー時のerrorをunionにして返す関数を扱う。
// 2象限あり、組み合わせは、6通りある
// - sync/async
// - return value/return error/return value | error
// returnの値に関しては、return errorはあんまり想定していない。一応以下にcheckを実装したが、動かなければ捨てる
// return valueのパターンはfp-tsに支援してくれる関数が見つからなかったので、bindで代用。シグネチャ上は問題なさそうだが。TaskEither<never, A>になるだけなので
// なので、bindだけ、TE.bindWを使ってエラーをunionしながら扱っていく。
// 引数として、sync/asyncな関数を受け入れるものを両方用意しておく
//
// あとは、doと最後にstateから結果のみを抽出するmapと、もとの結果とエラーのunionに戻すためのtoUnionをそのまま用意すれば、だいたいのパターンでうまくいくと思う。

// for sync function
export const bind: <N extends string, A, B>(
  name: Exclude<N, keyof A>,
  f: (a: A) => ErrorReturn<B>
) => <E>(fa: TE.TaskEither<E, A>) => TE.TaskEither<Err<B> | E, { readonly [K in N | keyof A]: K extends keyof A ? A[K] : Nrm<B> }> =
  (name, f) => TE.bindW(name, (v) => TE.fromEither(go(() => f(v))));

// A for async function
export const bindA: <N extends string, A, B>(
  name: Exclude<N, keyof A>,
  f: (a: A) => Promise<ErrorReturn<B>>
) => <E>(fa: TE.TaskEither<E, A>) => TE.TaskEither<Err<B> | E, { readonly [K in N | keyof A]: K extends keyof A ? A[K] : Nrm<B> }> =
  (name, f) => TE.bindW(name, (v) => goT(() => f(v)));

export const Do = TE.Do;
export const map = TE.map;
export const toUnion = TE.toUnion;

// export declare const flatMap: {
//   <A, E2, B>(f: (a: A) => TaskEither<E2, B>): <E1>(ma: TaskEither<E1, A>) => TaskEither<E2 | E1, B>
//   <E1, A, E2, B>(ma: TaskEither<E1, A>, f: (a: A) => TaskEither<E2, B>): TaskEither<E1 | E2, B>
// }

// export const check: <A, E2>(f: (a: A) => undefined | E2) => <E1>(ma: TE.TaskEither<E1, A>) => TE.TaskEither<E2 | E1, A> =
//   (f) => TE.flatMap((a) => {
//     const result = f(a);
//     if (result) {
//       return TE.fromEither(E.left(result));
//     } else {
//       return TE.fromEither(E.right(a));
//     }
//   });

// export const checkT: <A, E2>(f: (a: A) => Promise<undefined | E2>) => <E1>(ma: TE.TaskEither<E1, A>) => TE.TaskEither<E2 | E1, A> =
//   (f) => TE.flatMap(async (a) => {
//     const result = f(a);
//     if (result) {
//       return E.left(result);
//     } else {
//       return E.right(a);
//     }
//   });

// TODO test
declare function assertSame<A, B>(
  expect: [A] extends [B] ? ([B] extends [A] ? true : false) : false
): void;

// type A = ErrorReturn<RangeError | ReferenceError, string | number>
// type B = ErrorReturn<string | number | RangeError | ReferenceError>;
// assertSame<A, B>(true);

type C = RangeError | RangeError;
type D = RangeError;
assertSame<C, D>(true);

type E = never | RangeError;
type F = RangeError;
assertSame<E, F>(true);
