export type Context<T extends object> = {
  [K in keyof T]: (
    T[K] extends (() => infer C)
      ? C
      : never
  )
};

export type ContextFullFunction<T extends object, F> = {
  _context_setting?: T;
  (context: Context<T>): F;
};

export function setContext<T extends object, F>(
  func: ContextFullFunction<T, F>,
  contextSetting: T
): void {
  func._context_setting = contextSetting;
};

export function bindContext<T extends object, F>(func: ContextFullFunction<T, F>): F {

  if (!func._context_setting) {
    throw new Error('programmer should set context!');
  }

  const context = Object.entries(func._context_setting).reduce((acc, [key, val]) => ({
    ...acc,
    [key]: val(),
  }), {}) as Context<T>; // TODO ここas大丈夫？

  return func(context);
}

// export type GetContext<C extends object> = { [K in keyof C]: () => C[K] };
// 
// export type ContextFullFunction<C extends object, F> = {
//   _context_setting?: GetContext<C>;
//   (context: C): F;
// };
// 
// export function setContext<C extends object, F>(
//   func: ContextFullFunction<C, F>,
//   contextSetting: GetContext<C>
// ): void {
//   func._context_setting = contextSetting;
// };
// 
// export function bindContext<C extends object, F>(func: ContextFullFunction<C, F>): F {
// 
//   if (!func._context_setting) {
//     throw new Error('programmer should set context!');
//   }
// 
//   const context = Object.entries(func._context_setting).reduce((acc, [key, val]) => ({
//     ...acc,
//     [key]: val(),
//   }), {});
// 
//   return func(context);
// }

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
