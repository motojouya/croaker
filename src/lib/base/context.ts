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
