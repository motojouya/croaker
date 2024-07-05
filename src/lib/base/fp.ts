import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";
import { Fail } from "@/lib/base/fail";

export type Result<A, E extends Fail = never> = A | E;

// for sync function
export function execute<A, E extends Fail = never>(func: () => Result<A, E>): E.Either<E, A> {
  const result = func();
  if (result instanceof Fail) {
    return E.left(result);
  } else {
    return E.right(result);
  }
}

// A for async function
export function executeA<A, E extends Fail = never>(func: () => Promise<Result<A, E>>): TE.TaskEither<E, A> {
  return async function () {
    const result = await func();
    if (result instanceof Fail) {
      return E.left(result);
    } else {
      return E.right(result);
    }
  };
}

// for sync function
// prettier-ignore
export const bind: <N extends string, A, B, E2 extends Fail = never>(
  name: Exclude<N, keyof A>,
  f: (a: A) => Result<B, E2>,
) => <E1 extends Fail>(fa: TE.TaskEither<E1, A>) => TE.TaskEither<E2 | E1, { readonly [K in N | keyof A]: K extends keyof A ? A[K] : B }> =
  (name, f) => TE.bindW(name, (v) => TE.fromEither(execute(() => f(v))));

// A for async function
// prettier-ignore
export const bindA: <N extends string, A, B, E2 extends Fail = never>(
  name: Exclude<N, keyof A>,
  f: (a: A) => Promise<Result<B, E2>>,
) => <E1 extends Fail>(fa: TE.TaskEither<E1, A>) => TE.TaskEither<E2 | E1, { readonly [K in N | keyof A]: K extends keyof A ? A[K] : B }> =
  (name, f) => TE.bindW(name, (v) => executeA(() => f(v)));

export const Do = TE.Do;
export const map = TE.map;
export const toUnion = TE.toUnion;

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

// for test
// declare function assertSame<A, B>(expect: [A] extends [B] ? ([B] extends [A] ? true : false) : false): void;
