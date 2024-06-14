import { NextRequest, NextResponse } from "next/server";
import type { FromSchema, JSONSchema } from "json-schema-to-ts";
import { getJsonSchema, getKeyValue, JsonSchemaError } from '@/lib/jsonSchema'
import { InvalidArgumentsError } from '@/lib/validation';
import { HandleableError } from '@/lib/error';

export class FormFileError extends HandleableError {
  override readonly name = 'lib.routeHandler.FileError' as const;
  constructor(
    readonly property_name: string,
    readonly message: string,
  ) {
    super();
  }
}

function getRouteHandler<S extends JSONSchema, Q extends JSONSchema, B extends JSONSchema, F extends JSONSchema, R>(
  ss: S, qs: Q, bs: B, fs: F, fn: string, cb: (s: FromSchema<S>, q: FromSchema<Q>, b: FromSchema<B>, f: FromSchema<F>, file: File) => Promise<R>
);
function getRouteHandler<S extends JSONSchema, Q extends JSONSchema, B extends JSONSchema, F extends JSONSchema, R>(
  ss: S, qs: Q, bs: B, fs: F, fn: null, cb: (s: FromSchema<S>, q: FromSchema<Q>, b: FromSchema<B>, f: FromSchema<F>, file: null) => Promise<R>
);
function getRouteHandler<S extends JSONSchema, Q extends JSONSchema, B extends JSONSchema, R>(
  ss: S, qs: Q, bs: B, fs: null, fn: string, cb: (s: FromSchema<S>, q: FromSchema<Q>, b: FromSchema<B>, f: null, file: File) => Promise<R>
);
function getRouteHandler<S extends JSONSchema, Q extends JSONSchema, B extends JSONSchema, R>(
  ss: S, qs: Q, bs: B, fs: null, fn: null, cb: (s: FromSchema<S>, q: FromSchema<Q>, b: FromSchema<B>, f: null, file: null) => Promise<R>
);
function getRouteHandler<S extends JSONSchema, Q extends JSONSchema, F extends JSONSchema, R>(
  ss: S, qs: Q, bs: null, fs: F, fn: string, cb: (s: FromSchema<S>, q: FromSchema<Q>, b: null, f: FromSchema<F>, file: File) => Promise<R>
);
function getRouteHandler<S extends JSONSchema, Q extends JSONSchema, F extends JSONSchema, R>(
  ss: S, qs: Q, bs: null, fs: F, fn: null, cb: (s: FromSchema<S>, q: FromSchema<Q>, b: null, f: FromSchema<F>, file: null) => Promise<R>
);
function getRouteHandler<S extends JSONSchema, Q extends JSONSchema, R>(
  ss: S, qs: Q, bs: null, fs: null, fn: string, cb: (s: FromSchema<S>, q: FromSchema<Q>, b: null, f: null, file: File) => Promise<R>
);
function getRouteHandler<S extends JSONSchema, Q extends JSONSchema, R>(
  ss: S, qs: Q, bs: null, fs: null, fn: null, cb: (s: FromSchema<S>, q: FromSchema<Q>, b: null, f: null, file: null) => Promise<R>
);
function getRouteHandler<S extends JSONSchema, B extends JSONSchema, F extends JSONSchema, R>(
  ss: S, qs: null, bs: B, fs: F, fn: string, cb: (s: FromSchema<S>, q: null, b: FromSchema<B>, f: FromSchema<F>, file: File) => Promise<R>
);
function getRouteHandler<S extends JSONSchema, B extends JSONSchema, F extends JSONSchema, R>(
  ss: S, qs: null, bs: B, fs: F, fn: null, cb: (s: FromSchema<S>, q: null, b: FromSchema<B>, f: FromSchema<F>, file: null) => Promise<R>
);
function getRouteHandler<S extends JSONSchema, B extends JSONSchema, R>(
  ss: S, qs: null, bs: B, fs: null, fn: string, cb: (s: FromSchema<S>, q: null, b: FromSchema<B>, f: null, file: File) => Promise<R>
);
function getRouteHandler<S extends JSONSchema, B extends JSONSchema, R>(
  ss: S, qs: null, bs: B, fs: null, fn: null, cb: (s: FromSchema<S>, q: null, b: FromSchema<B>, f: null, file: null) => Promise<R>
);
function getRouteHandler<S extends JSONSchema, F extends JSONSchema, R>(
  ss: S, qs: null, bs: null, fs: F, fn: string, cb: (s: FromSchema<S>, q: null, b: null, f: FromSchema<F>, file: File) => Promise<R>
);
function getRouteHandler<S extends JSONSchema, F extends JSONSchema, R>(
  ss: S, qs: null, bs: null, fs: F, fn: null, cb: (s: FromSchema<S>, q: null, b: null, f: FromSchema<F>, file: null) => Promise<R>
);
function getRouteHandler<S extends JSONSchema, R>(
  ss: S, qs: null, bs: null, fs: null, fn: string, cb: (s: FromSchema<S>, q: null, b: null, f: null, file: File) => Promise<R>
);
function getRouteHandler<S extends JSONSchema, R>(
  ss: S, qs: null, bs: null, fs: null, fn: null, cb: (s: FromSchema<S>, q: null, b: null, f: null, file: null) => Promise<R>
);
function getRouteHandler<Q extends JSONSchema, B extends JSONSchema, F extends JSONSchema, R>(
  ss: null, qs: Q, bs: B, fs: F, fn: string, cb: (s: null, q: FromSchema<Q>, b: FromSchema<B>, f: FromSchema<F>, file: File) => Promise<R>
);
function getRouteHandler<Q extends JSONSchema, B extends JSONSchema, F extends JSONSchema, R>(
  ss: null, qs: Q, bs: B, fs: F, fn: null, cb: (s: null, q: FromSchema<Q>, b: FromSchema<B>, f: FromSchema<F>, file: null) => Promise<R>
);
function getRouteHandler<Q extends JSONSchema, B extends JSONSchema, R>(
  ss: null, qs: Q, bs: B, fs: null, fn: string, cb: (s: null, q: FromSchema<Q>, b: FromSchema<B>, f: null, file: File) => Promise<R>
);
function getRouteHandler<Q extends JSONSchema, B extends JSONSchema, R>(
  ss: null, qs: Q, bs: B, fs: null, fn: null, cb: (s: null, q: FromSchema<Q>, b: FromSchema<B>, f: null, file: null) => Promise<R>
);
function getRouteHandler<Q extends JSONSchema, F extends JSONSchema, R>(
  ss: null, qs: Q, bs: null, fs: F, fn: string, cb: (s: null, q: FromSchema<Q>, b: null, f: FromSchema<F>, file: File) => Promise<R>
);
function getRouteHandler<Q extends JSONSchema, F extends JSONSchema, R>(
  ss: null, qs: Q, bs: null, fs: F, fn: null, cb: (s: null, q: FromSchema<Q>, b: null, f: FromSchema<F>, file: null) => Promise<R>
);
function getRouteHandler<Q extends JSONSchema, R>(
  ss: null, qs: Q, bs: null, fs: null, fn: string, cb: (s: null, q: FromSchema<Q>, b: null, f: null, file: File) => Promise<R>
);
function getRouteHandler<Q extends JSONSchema, R>(
  ss: null, qs: Q, bs: null, fs: null, fn: null, cb: (s: null, q: FromSchema<Q>, b: null, f: null, file: null) => Promise<R>
);
function getRouteHandler<B extends JSONSchema, F extends JSONSchema, R>(
  ss: null, qs: null, bs: B, fs: F, fn: string, cb: (s: null, q: null, b: FromSchema<B>, f: FromSchema<F>, file: File) => Promise<R>
);
function getRouteHandler<B extends JSONSchema, F extends JSONSchema, R>(
  ss: null, qs: null, bs: B, fs: F, fn: null, cb: (s: null, q: null, b: FromSchema<B>, f: FromSchema<F>, file: null) => Promise<R>
);
function getRouteHandler<B extends JSONSchema, R>(
  ss: null, qs: null, bs: B, fs: null, fn: string, cb: (s: null, q: null, b: FromSchema<B>, f: null, file: File) => Promise<R>
);
function getRouteHandler<B extends JSONSchema, R>(
  ss: null, qs: null, bs: B, fs: null, fn: null, cb: (s: null, q: null, b: FromSchema<B>, f: null, file: null) => Promise<R>
);
function getRouteHandler<F extends JSONSchema, R>(
  ss: null, qs: null, bs: null, fs: F, fn: string, cb: (s: null, q: null, b: null, f: FromSchema<F>, file: File) => Promise<R>
);
function getRouteHandler<F extends JSONSchema, R>(
  ss: null, qs: null, bs: null, fs: F, fn: null, cb: (s: null, q: null, b: null, f: FromSchema<F>, file: null) => Promise<R>
);
function getRouteHandler<R>(
  ss: null, qs: null, bs: null, fs: null, fn: string, cb: (s: null, q: null, b: null, f: null, file: File) => Promise<R>
);
function getRouteHandler<R>(
  ss: null, qs: null, bs: null, fs: null, fn: null, cb: (s: null, q: null, b: null, f: null, file: null) => Promise<R>
);

function getRouteHandler<
  S extends JSONSchema,
  Q extends JSONSchema,
  B extends JSONSchema,
  F extends JSONSchema,
  R
>(
  segmentSchema: S | null,
  querySchema: Q | null,
  bodySchema: B | null,
  formSchema: F | null,
  fileName: string | null,
  callback: (segment: FromSchema<S> | null, query: FromSchema<Q> | null, body: FromSchema<B> | null, form: FromSchema<F> | null, file: File | null) => Promise<R>
) {
  async function (req: NextRequest, { params }) {

    const jsonSchema = getJsonSchema();

    let segmentArgs: FromSchema<S> | null = null;
    if (segmentSchema) {
      segmentArgs = jsonSchema.getKeyValue(segmentSchema, (key) => parames[key]);
      if (
        segmentArgs instanceof InvalidArgumentsError
        segmentArgs instanceof JsonSchemaError
      ) {
        return NextResponse.json(segmentArgs.toJson());
      }
    }

    let queryArgs: FromSchema<Q> | null = null;
    if (querySchema) {
      const searchParams = req.nextUrl.searchParams;
      queryArgs = jsonSchema.getKeyValue(querySchema, searchParams.get);
      if (
        queryArgs instanceof InvalidArgumentsError
        queryArgs instanceof JsonSchemaError
      ) {
        return NextResponse.json(queryArgs.toJson());
      }
    }

    let bodyArgs: FromSchema<B> | null = null;
    if (bodySchema) {
      const body = await request.json()

      const validateSchema = jsonSchema.compile(bodySchema);
      if (!validateSchema(body)) {
        // @ts-ignore
        const { errors } = validateSchema;
        console.debug(errors);
        const jsonSchemaError = new JsonSchemaError(errors.propertyName, errors.data, errors, errors.message);
        return NextResponse.json(jsonSchemaError.toJson());
      }
      bodyArgs = body;
    }

    let formArgs: FromSchema<F> | null = null;
    let file: File | null = null;
    if (formSchema || fileName) {
      const formData = await req.formData();

      if (formSchema) {
        formArgs = jsonSchema.getKeyValue(formSchema, formData.get);
        if (
          formArgs instanceof InvalidArgumentsError
          formArgs instanceof JsonSchemaError
        ) {
          return NextResponse.json(formArgs.toJson());
        }
      }

      if (file) {
        file = formData.get(fileName) as File;
        // TODO is File を実装する
        // if (isFile(file)) {
        //   const formFileError = new FormFileError(fileName, `${fileName}はファイルではありません`);
        //   return NextResponse.json(formFileError.toJson());
        // }

        // const arrayBuffer = await file.arrayBuffer();
        // const buffer = Buffer.from(arrayBuffer);
        // const buffer = new Uint8Array(arrayBuffer);
        // await fs.writeFile(`./public/uploads/${file.name}`, buffer);
      }
    }

    try {
      const result = await callback(segmentArgs, queryArgs, bodyArgs, formArgs, file);

      if (result instanceof HandleableError) {
        return NextResponse.json(result.toJson());
      }

      if (result instanceof Error) {
        return new NextResponse(result.message, { status: 500 });
      }

      return NextResponse.json(result);

    } catch (e) {
      return new NextResponse(e.message, { status: 500 });
    }
  }
}

// example こんな感じになるはず
//
// import { FunctionResult, postTextCroak } from '@/case/postTextCroak';
// import { bindContext } from '@/lib/context';
//
// export type ResponseType = FunctionResult;
//
// export const getFetcher = (f: typeof fetch) => async (contents: string, thread?: number): Promise<ResponseType> => {
//   try {
//     let path = '/croak';
//     if (thread) {
//       path = `/croak/${thread}`;
//     }
//
//     const res = await f(path, {
//       method: 'POST',
//       body: { contents },
//     });
//
//     const result = await res.json();
//     return result as ResponseType;
//
//   } catch (e) {
//     // TODO
//     throw e;
//   }
// };
//
// const segmentSchema = {} as const satisfies JSONSchema;
// const bodySchema = {} as const satisfies JSONSchema;
//
// export const POST = getRouteHandler(
//   segmentSchema,
//   null,
//   bodySchema,
//   null,
//   null,
//   (s, q, b, f, file) => bindContext(postTextCroak)(b.contents, s.thread)
// );
