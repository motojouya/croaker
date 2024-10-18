/*
 * # 使い方
 * いわゆるDIコンテナを代替する機能。
 * 1,2はCaseのそれぞれの名前空間で行い、3,4はCaseを利用するモジュール側で行う。
 *
 * 1. Caseそれぞれに、bindしたい依存関係を解決する設定(GetContext型)を定義する
 * 2. setContextを使い、Caseのメイン関数(ContextFullFunction型)に1で定義した設定を組み込む
 * 3. API RoutesやServer Actions上で、bindContextを使ってCaseの関数にDIを行って、実行関数を取得する
 * 4. Case関数を実行する
 *
 * # コンセプト
 * Caseの名前空間に依存の設定を記載する形になるので、依存性の解決というと違う感じもする。
 *
 * 状態を取り扱うライブラリはアプリケーション上で直接使うのではなく、IOモジュールでwrapして使うルールとする。
 * そのため、それらのライブラリや状態を依存すくなく、疎結合に扱うことに関しては、IOモジュールに頼る形を取る。
 *
 * 上記の前提に立つため、基本的にはテストをモックしやすくすることを目的としており、コード上での疎結合性を完璧に実現するためのものではない。
 * 逆にCaseの名前空間に依存しているモジュールを記載するので、何を使っているか、一覧性は高いはず。
 *
 * 使用感の違いとしては、DIコンテナとは機能的にかなり違い、多重でDIを解決したりはしない。
 * 依存する状態を組み合わせて実行するのはCase側の責任としている。
 */
export type GetContext = Record<string, () => unknown>;

export type Context<T extends GetContext> = {
  [K in keyof T]: T[K] extends () => infer C ? C : never;
};

export type ContextFullFunction<T extends GetContext, F> = {
  _context_setting?: T;
  (context: Context<T>): F;
};

// prettier-ignore
export function setContext<T extends GetContext, F>(
  func: ContextFullFunction<T, F>,
  contextSetting: T
): void {
  func._context_setting = contextSetting;
}

export function bindContext<T extends GetContext, F>(func: ContextFullFunction<T, F>): F {
  if (!func._context_setting) {
    throw new Error("programmer should set context!");
  }

  // Object.entriesのスコープでundefinedがないという推論が消えてしまう
  // なので別の変数に入れ直して、その変数で型を推論させてやる必要がある
  const contextSetting = func._context_setting;

  const context = Object.entries(contextSetting).reduce((acc, [key, val]) => {
    if (typeof val !== "function") {
      throw new Error("programmer should set context function!");
    }

    if (!Object.hasOwn(contextSetting, key)) {
      return acc;
    }

    return {
      ...acc,
      [key]: val(),
    };
  }, {}) as Context<T>; // FIXME as!

  return func(context);
}
