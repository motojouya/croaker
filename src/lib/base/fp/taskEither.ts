import * as T from 'fp-ts/Task';
import * as TE from 'fp-ts/TaskEither';

export type Nrm<T> = T extends Error ? never : T;
export type Err<T> = T extends Error ? T : never;
export type In<T> = TE.TaskEither<Err<T>, Nrm<T>>;

export function in<A, B>(func: (a: A) => Promise<B>): In<B> {
  return async function (a: A) {
    const result = await func(a);
    if (result instanceof Error) {
      return TE.left(result);
    } else {
      return TE.right(result);
    }
  };
}

export function inS<A, B>(func: (a: A) => B): In<B> {
  return async function (a: A) {
    const result = func(a);
    if (result instanceof Error) {
      return TE.left(result);
    } else {
      return TE.right(result);
    }
  };
}

// export type OnRight<B> = <E, A>(a: A) => Out<E, B>;
// export type OnLeft<B> = <E, A>(e: E) => Out<E, B>;
// type MatchReturn<E, A, B> = (ma: TaskEither<E, A>) => T.Task<B>; // TODO いらんと思うが、たぶんこう

export type Out<L, R> = L | R;
export function out<E, A, B>(onRight: (a: A) => B) {
  return TE.match<E, A, Out<E, B>>((e) => e, onRight);
}

// TODO test
declare function assertSame<A, B>(
  expect: [A] extends [B] ? ([B] extends [A] ? true : false) : false
): void;

type A = TE.TaskEither<RangeError | ReferenceError, string | number>
type B = In<string | number | RangeError | ReferenceError>;
assertSame<A, B>(true);
