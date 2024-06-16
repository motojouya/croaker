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

      const val = this[key];

      if (val instanceof Error) {
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
    return this.name === arg.name;
  }
}

export function eq<E extends HandleableError>(error: E, value: any): value is E {
  return error.name === value.name;
}
