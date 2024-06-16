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

function handle<R>(callback: () => Promise<R>) {
  try {
    const result = await callback(pathArgs, queryArgs, bodyArgs, formArgs, file);

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

function getRouteHandler<R>(pathSchema: null, callback: (path: null) => Promise<R>);
function getRouteHandler<P extends JSONSchema, R>(pathSchema: P, callback: (path: FromSchema<P>) => Promise<R>);
function getRouteHandler<P extends JSONSchema, R>(pathSchema: P | null, callback: (path: FromSchema<P> | null) => Promise<R>) {
  async function (req: NextRequest, { params }) {

    const jsonSchema = getJsonSchema();

    let pathArgs: FromSchema<P> | InvalidArgumentsError | JsonSchemaError | null = null;
    if (pathSchema) {
      pathArgs = jsonSchema.getKeyValue(pathSchema, (key) => parames[key]);
      if (
        pathArgs instanceof InvalidArgumentsError
        pathArgs instanceof JsonSchemaError
      ) {
        return NextResponse.json(pathArgs.toJson());
      }
    }

    return handle(() => callback(pathArgs));
  }
}

function getQueryHandler<Q extends JSONSchema, R>(
  pathSchema: null,
  querySchema: Q,
  callback: (path: null, query: FromSchema<Q>) => Promise<R>
);
function getQueryHandler<P extends JSONSchema, Q extends JSONSchema, R>(
  pathSchema: P,
  querySchema: Q,
  callback: (path: FromSchema<P>, query: FromSchema<Q>) => Promise<R>
);
function getQueryHandler<S extends JSONSchema, Q extends JSONSchema, R>(
  pathSchema: S | null,
  querySchema: Q,
  callback: (path: FromSchema<P> | null, query: FromSchema<Q>) => Promise<R>
) {
  async function (req: NextRequest, { params }) {

    const jsonSchema = getJsonSchema();

    let pathArgs: FromSchema<P> | InvalidArgumentsError | JsonSchemaError | null = null;
    if (pathSchema) {
      pathArgs = jsonSchema.getKeyValue(pathSchema, (key) => parames[key]);
      if (
        pathArgs instanceof InvalidArgumentsError
        pathArgs instanceof JsonSchemaError
      ) {
        return NextResponse.json(pathArgs.toJson());
      }
    }

    const searchParams = req.nextUrl.searchParams;
    const queryArgs = jsonSchema.getKeyValue(querySchema, searchParams.get);
    if (
      queryArgs instanceof InvalidArgumentsError
      queryArgs instanceof JsonSchemaError
    ) {
      return NextResponse.json(queryArgs.toJson());
    }

    return handle(() => callback(pathArgs, queryArgs));
  }
}

function getBodyHandler<B extends JSONSchema, R>(
  pathSchema: null,
  bodySchema: B,
  callback: (path: null, body: FromSchema<B>) => Promise<R>
);
function getBodyHandler<P extends JSONSchema, B extends JSONSchema, R>(
  pathSchema: P,
  bodySchema: B,
  callback: (path: FromSchema<P>, body: FromSchema<B>) => Promise<R>
);
function getBodyHandler<P extends JSONSchema, B extends JSONSchema, R>(
  pathSchema: P | null,
  bodySchema: B,
  callback: (path: FromSchema<P> | null, body: FromSchema<B>) => Promise<R>
) {
  async function (req: NextRequest, { params }) {

    const jsonSchema = getJsonSchema();

    let pathArgs: FromSchema<P> | InvalidArgumentsError | JsonSchemaError | null = null;
    if (pathSchema) {
      pathArgs = jsonSchema.getKeyValue(pathSchema, (key) => parames[key]);
      if (
        pathArgs instanceof InvalidArgumentsError
        pathArgs instanceof JsonSchemaError
      ) {
        return NextResponse.json(pathArgs.toJson());
      }
    }

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

    return handle(() => callback(pathArgs, bodyArgs));
  }
}

function getFormHandler<F extends JSONSchema, R>(
  pathSchema: null, formSchema: F, fileName: null,
  callback: (path: null, form: FromSchema<F>, file: null) => Promise<R>
);
function getFormHandler<R>(
  pathSchema: null, formSchema: null, fileName: string,
  callback: (path: null, form: null, file: File) => Promise<R>
);
function getFormHandler<F extends JSONSchema, R>(
  pathSchema: null, formSchema: F, fileName: string,
  callback: (path: null, form: FromSchema<F>, file: File) => Promise<R>
);
function getFormHandler<P extends JSONSchema, F extends JSONSchema, R>(
  pathSchema: P, formSchema: F, fileName: null,
  callback: (path: FromSchema<P>, form: FromSchema<F>, file: null) => Promise<R>
);
function getFormHandler<P extends JSONSchema, R>(
  pathSchema: P, formSchema: null, fileName: string,
  callback: (path: FromSchema<P>, form: null, file: File) => Promise<R>
);
function getFormHandler<P extends JSONSchema, F extends JSONSchema, R>(
  pathSchema: P, formSchema: F, fileName: string,
  callback: (path: FromSchema<P>, form: FromSchema<F>, file: File) => Promise<R>
);
function getFormHandler<P extends JSONSchema, F extends JSONSchema, R>(
  pathSchema: P | null,
  formSchema: F | null,
  fileName: string | null,
  callback: (path: FromSchema<P> | null, form: FromSchema<F> | null, file: File | null) => Promise<R>
) {
  async function (req: NextRequest, { params }) {

    const jsonSchema = getJsonSchema();

    let pathArgs: FromSchema<P> | null = null;
    if (pathSchema) {
      pathArgs = jsonSchema.getKeyValue(pathSchema, (key) => parames[key]);
      if (
        pathArgs instanceof InvalidArgumentsError
        pathArgs instanceof JsonSchemaError
      ) {
        return NextResponse.json(pathArgs.toJson());
      }
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

      if (fileName) {
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

    return handle(() => callback(pathArgs, formArgs, file));
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
// const pathSchema = {} as const satisfies JSONSchema;
// const bodySchema = {} as const satisfies JSONSchema;
//
// export const POST = getRouteHandler(
//   pathSchema,
//   null,
//   bodySchema,
//   null,
//   null,
//   (s, q, b, f, file) => bindContext(postTextCroak)(b.contents, s.thread)
// );
