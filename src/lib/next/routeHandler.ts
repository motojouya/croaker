import { NextRequest, NextResponse } from "next/server";
import type { Session } from 'next-auth';
import { auth } from "next-auth/next"
import type { FromSchema, JSONSchema } from "json-schema-to-ts";
import { getJsonSchema, JsonSchemaError } from '@/lib/base/jsonSchema'
import { InvalidArgumentsError } from '@/lib/base/validation';
import { HandleableError } from '@/lib/base/error';
import { options } from '@/lib/next/nextAuthOptions';
import type { Identifier } from '@/domain/authorize';

export type FetchType = typeof fetch;

export function executeFetch(callback: () => ReturnType<FetchType>) {
  try {
    const res = await callback();

    if (res.status >= 500) {
      console.log('server error!');
      throw new Error('server error!');
    }

    return await res.json();

  } catch (e) {
    console.log('network error!');
    throw e;
  }
};

export type GetIdentifier = (session?: Session) => Identifier;
export const getIdentifier: GetIdentifier = (session) => {
  if (session) {
    return { type: 'anonymous' };
  } else {
    return { type: 'user_id', user_id: sesion.user.id };
  }
};

function handle<R>(session?: Session, callback: (identifier: Identifier) => Promise<R>) {
  try {
    const identifier = getIdentifier(session);

    const result = await callback(identifier);

    if (result instanceof HandleableError) {
      return NextResponse.json(result.toJson());
    }

    if (result instanceof Error) {
      return new NextResponse(result.message, { status: 500 });
    }

    return NextResponse.json(result);

  } catch (e) {
    if (e instanceof Error) {
      return new NextResponse(e.message, { status: 500 });
    } else {
      return new NextResponse('something happened!', { status: 500 });
    }
  }
}

export function getRouteHandler<R>(pathSchema: null, callback: (identifier: Identifier, path: null) => Promise<R>);
export function getRouteHandler<P extends JSONSchema, R>(pathSchema: P, callback: (identifier: Identifier, path: FromSchema<P>) => Promise<R>);
export function getRouteHandler<P extends JSONSchema, R>(pathSchema: P | null, callback: (identifier: Identifier, path: FromSchema<P> | null) => Promise<R>) {
  return auth(async function (req: NextRequest, { params }) {

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

    return handle(req.auth, (identifier) => callback(identifier, pathArgs));
  });
}

export function getQueryHandler<Q extends JSONSchema, R>(
  pathSchema: null,
  querySchema: Q,
  callback: (identifier: Identifier, path: null, query: FromSchema<Q>) => Promise<R>
);
export function getQueryHandler<P extends JSONSchema, Q extends JSONSchema, R>(
  pathSchema: P,
  querySchema: Q,
  callback: (identifier: Identifier, path: FromSchema<P>, query: FromSchema<Q>) => Promise<R>
);
export function getQueryHandler<S extends JSONSchema, Q extends JSONSchema, R>(
  pathSchema: S | null,
  querySchema: Q,
  callback: (identifier: Identifier, path: FromSchema<P> | null, query: FromSchema<Q>) => Promise<R>
) {
  return auth(async function (req: NextRequest, { params }) {

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

    return handle(req.auth, (identifier) => callback(identifier, pathArgs, queryArgs));
  });
}

export function getBodyHandler<B extends JSONSchema, R>(
  pathSchema: null,
  bodySchema: B,
  callback: (identifier: Identifier, path: null, body: FromSchema<B>) => Promise<R>
);
export function getBodyHandler<P extends JSONSchema, B extends JSONSchema, R>(
  pathSchema: P,
  bodySchema: B,
  callback: (identifier: Identifier, path: FromSchema<P>, body: FromSchema<B>) => Promise<R>
);
export function getBodyHandler<P extends JSONSchema, B extends JSONSchema, R>(
  pathSchema: P | null,
  bodySchema: B,
  callback: (identifier: Identifier, path: FromSchema<P> | null, body: FromSchema<B>) => Promise<R>
) {
  return auth(async function (req: NextRequest, { params }) {

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

    return handle(req.auth, (identifier) => callback(identifier, pathArgs, bodyArgs));
  };
}

export function getFormHandler<F extends JSONSchema, R>(
  pathSchema: null, formSchema: F, fileName: null,
  callback: (identifier: Identifier, path: null, form: FromSchema<F>, file: null) => Promise<R>
);
export function getFormHandler<R>(
  pathSchema: null, formSchema: null, fileName: string,
  callback: (identifier: Identifier, path: null, form: null, file: File) => Promise<R>
);
export function getFormHandler<F extends JSONSchema, R>(
  pathSchema: null, formSchema: F, fileName: string,
  callback: (identifier: Identifier, path: null, form: FromSchema<F>, file: File) => Promise<R>
);
export function getFormHandler<P extends JSONSchema, F extends JSONSchema, R>(
  pathSchema: P, formSchema: F, fileName: null,
  callback: (identifier: Identifier, path: FromSchema<P>, form: FromSchema<F>, file: null) => Promise<R>
);
export function getFormHandler<P extends JSONSchema, R>(
  pathSchema: P, formSchema: null, fileName: string,
  callback: (identifier: Identifier, path: FromSchema<P>, form: null, file: File) => Promise<R>
);
export function getFormHandler<P extends JSONSchema, F extends JSONSchema, R>(
  pathSchema: P, formSchema: F, fileName: string,
  callback: (identifier: Identifier, path: FromSchema<P>, form: FromSchema<F>, file: File) => Promise<R>
);
export function getFormHandler<P extends JSONSchema, F extends JSONSchema, R>(
  pathSchema: P | null,
  formSchema: F | null,
  fileName: string | null,
  callback: (identifier: Identifier, path: FromSchema<P> | null, form: FromSchema<F> | null, file: File | null) => Promise<R>
) {
  return auth(async function (req: NextRequest, { params }) {

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

    return handle(req.auth, (identifier) => callback(identifier, pathArgs, formArgs, file));
  });
}

export class FormFileError extends HandleableError {
  override readonly name = 'lib.routeHandler.FileError' as const;
  constructor(
    readonly property_name: string,
    readonly message: string,
  ) {
    super();
  }
}