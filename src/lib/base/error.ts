export abstract class HandleableError extends Error {

  override readonly name = 'lib.error.HandleableError' as const;

  constructor() {
    super();
  }

  toJson() {

    let json = {};
    for (const key in Object.keys(this)) {

      if (!Object.hasOwn(this, key)) {
        continue;
      }

      // TODO 大丈夫？
      // @ts-ignore
      const val = this[key];

      if (val instanceof HandleableError) {
        json = {
          ...json,
          [key]: val.toJson(),
        };
        continue;
      }

      if (val instanceof Error) {
        json = {
          ...json,
          [key]: val.message,
        };
        continue;
      }

      json = {
        ...json,
        [key]: val,
      };
    }

    return json;
  }

  eq(arg: any): arg is this {
    if (!arg) {
      return false;
    }
    if (typeof arg !== 'object') {
      return false;
    }
    return this.name === arg.name;
  }
}

export function eq<E extends HandleableError>(error: E, value: any): value is E {
  if (!value) {
    return false;
  }
  if (typeof value !== 'object') {
    return false;
  }
  return error.name === value.name;
}
