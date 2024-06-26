import { z } from 'zod';
import { HandleableError } from '@/lib/base/error';

export function parse<S extends z.ZodTypeAny>(schema: S, data: unknown): z.infer<S> | ZodSchemaError {

  const result = schema.safeParse(data);

  if (result.success) {
    return result.data;
  } else {
    return new ZodSchemaError(result.error);
  }
}

// TODO S extends z.SomeZodObjectしてるけど、stringとかnumber定義がコンパイルエラーになるか検証
// parseがz.ZodTypeAnyを受け入れるようにしてるけどbodySchemaはz.SomeZodObjectになるようにしておく
export type GetKeyValue<E> = (key: string) => string | null | E;
export function parseKeyValue<S extends z.SomeZodObject, E extends HandleableError>(schema: S, get: GetKeyValue<E>): z.infer<S> | ZodSchemaError | E {

  const keys = Object.keys(schema.keyof().Values);

  let data = {};
  for (const key of keys) {

    const val = get(key);
    if (val instanceof Error) {
      return val;
    }

    data = {
      ...data,
      key: val,
    };
  }

  return parse(schema, data);
}

export class ValueTypeError extends HandleableError {
  override readonly name = 'lib.schema.ValueTypeError' as const;
  constructor(
    readonly property_name: string,
    readonly expected: string,
    readonly actual: string,
    readonly message: string,
  ) {
    super();
  }
}

export type Issue = {
  code: string;
  path: string;
  message: string;
};

export class ZodSchemaError extends HandleableError {

  override readonly name = 'lib.schema.ZodSchemaError' as const;

  readonly issues: Issue[];
  readonly error: z.ZodError;
  readonly message: string;

  constructor(error: z.ZodError) {
    super();
    this.error = error;
    this.issues = error.issues.map(({ code, path, message }) => ({
      code,
      path: path.map(v => String(v)).join('.'),
      message,
    }));
    this.message = this.issues.map(issue => issue.message).join('\n');
  }
}
