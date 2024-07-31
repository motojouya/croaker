import { z } from "zod";
import { Fail, isFailJSON } from "@/lib/base/fail";

export function parse<S extends z.ZodTypeAny>(schema: S, data: unknown): z.infer<S> | ZodSchemaFail {
  const result = schema.safeParse(data);

  if (result.success) {
    return result.data;
  } else {
    return new ZodSchemaFail(result.error);
  }
}

// TODO S extends z.SomeZodObjectしてるけど、stringとかnumber定義がコンパイルエラーになるか検証
// parseがz.ZodTypeAnyを受け入れるようにしてるけどbodySchemaはz.SomeZodObjectになるようにしておく
export type GetKeyValue<E> = (key: string) => string | null | E;
export function parseKeyValue<S extends z.SomeZodObject, E extends Fail>(
  schema: S,
  get: GetKeyValue<E>,
): z.infer<S> | ZodSchemaFail | E {
  const keys = Object.keys(schema.keyof().Values);

  let data = {};
  for (const key of keys) {
    const val = get(key);
    if (val instanceof Fail) {
      return val;
    }

    data = {
      ...data,
      [key]: val,
    };
  }

  return parse(schema, data);
}

export class ValueTypeFail extends Fail {
  constructor(
    public readonly property_name: string,
    public readonly expected: string,
    public readonly actual: string,
    public readonly message: string,
  ) {
    super("lib.schema.ValueTypeFail");
  }
}
export const isValueTypeFail = isFailJSON(new ValueTypeFail("", "", "", ""));

export type Issue = {
  code: string;
  path: string;
  message: string;
};

export class ZodSchemaFail extends Fail {
  public readonly issues: Issue[];
  public readonly error: z.ZodError;
  public readonly message: string;

  constructor(error: z.ZodError) {
    super("lib.schema.ZodSchemaFail");
    this.error = error;
    this.issues = error.issues.map(({ code, path, message }) => ({
      code,
      path: path.map((v) => String(v)).join("."),
      message,
    }));
    this.message = this.issues.map((issue) => issue.message).join("\n");
  }
}
export const isZodSchemaFail = isFailJSON(new ZodSchemaFail(new z.ZodError([])));
