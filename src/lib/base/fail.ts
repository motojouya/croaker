/*
 * エラーは、利用者ユーザがハンドリングできるものに関しては、コード上で取り扱う。具体的にはreturnする。
 * ユーザがハンドリングできないもの、例えばDBのコネクションなどの問題はそのままthrowし、サーバとしては500を返す形とする。
 *
 * returnするエラーはすべてFail型をextendsし、各関数はそれらのエラーと正常値を含んだUnion型をReturn Typeとして定義する。
 * エラーか否かを呼び出しもとで判断する際にはinstanceofを利用する。
 *
 * ユーザがハンドリング可能なエラーは、サーバとしては200を返し、フロントアプリケーション上でハンドリングする。
 * その際、Fail classのオブジェクトはJSONに変換され、フロント側ではJSONの拡張オブジェクトとして利用される。
 */
export type ErrorJSON = {
  name: string;
  message: string;
};

export type FailJSON<F extends Fail> = {
  [K in Exclude<keyof F, "toJSON">]: F[K] extends Fail
    ? FailJSON<F[K]>
    : F[K] extends Error
      ? ErrorJSON
      : F[K] extends Function
        ? never
        : F[K];
};

export type ResultJson<T> = T extends Fail ? FailJSON<T> : T;

export abstract class Fail {
  constructor(public readonly _prototype_fail_name: string) {}

  toJSON(): FailJSON<this> {
    // FailがErrorを継承したとき用にgetOwnPropertyNamesを用いているが、基本的にはkeysで十分
    return Object.getOwnPropertyNames(this).reduce((acc, key) => {
      if (!Object.hasOwn(this, key)) {
        if (key === "_prototype_fail_name") {
          return {
            ...acc,
            _prototype_fail_name: this._prototype_fail_name,
          };
        } else {
          return acc;
        }
      }

      // @ts-ignore
      const val = this[key];

      if (val instanceof Fail) {
        return {
          ...acc,
          [key]: val.toJSON(),
        };
      }

      if (val instanceof Error) {
        return {
          ...acc,
          [key]: {
            name: val.name,
            message: val.message,
          },
        };
      }

      if (val instanceof Function) {
        return acc;
      }

      return {
        ...acc,
        [key]: val,
      };
    }, {}) as FailJSON<this>;
  }
}

export function isFailJSON<F extends Fail>(fail: F) {
  return function (value: any): value is FailJSON<F> {
    if (!value) {
      return false;
    }
    if (typeof value !== "object") {
      return false;
    }
    return fail._prototype_fail_name === value._prototype_fail_name;
  };
}
