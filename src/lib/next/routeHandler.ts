import { NextRequest, NextResponse } from "next/server";
import type { Session } from 'next-auth';
import { z } from 'zod';
import { auth } from "@/lib/next/nextAuthOptions"
import { parse, parseKeyValue, ZodSchemaFail, ValueTypeFail } from '@/lib/base/schema'
import { InvalidArgumentsFail } from '@/lib/base/validation';
import { Fail } from '@/lib/base/fail';
import type { Identifier } from '@/domain/authorization/base';
import { FileData, getLocalFile } from '@/lib/io/file';

// TODO 書きたくないが関数overloadしたときに実装のない関数はReturnTypeが推論されないので
// next-authのnext-auth/lib/typesを参照
type AppRouteHandlerFnContext = {
  params?: Record<string, string | string[]>
}
type AppRouteHandlerFn = (
  req: NextRequest,
  ctx: AppRouteHandlerFnContext
) => void | Response | Promise<void | Response>

export type FetchType = typeof fetch;

export async function executeFetch(callback: () => ReturnType<FetchType>) {
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

export type GetIdentifier = (session: Session | null) => Identifier;
export const getIdentifier: GetIdentifier = (session) => {
  if (session) {
    return { type: 'user_id', user_id: session.user.id };
  } else {
    return { type: 'anonymous' };
  }
};

async function handle<R>(session: Session | null, callback: (identifier: Identifier) => Promise<R>) {
  try {
    const identifier = getIdentifier(session);

    const result = await callback(identifier);

    if (result instanceof Fail) {
      return NextResponse.json(result.toJSON());
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

export function getRouteHandler<R>(
  pathSchema: null,
  callback: (identifier: Identifier, path: null) => Promise<R>
): AppRouteHandlerFn;
export function getRouteHandler<P extends z.SomeZodObject, R>(
  pathSchema: P,
  callback: (identifier: Identifier, path: z.infer<P>) => Promise<R>
): AppRouteHandlerFn;
export function getRouteHandler<P extends z.SomeZodObject, R>(
  pathSchema: P | null,
  callback: (identifier: Identifier, path: z.infer<P> | null) => Promise<R>
): AppRouteHandlerFn {

  return auth(async (req, { params }) => {

    let pathArgs: z.infer<P> | ZodSchemaFail | null = null;
    if (pathSchema) {
      pathArgs = parse(pathSchema, params);
      if (pathArgs instanceof ZodSchemaFail) {
        return NextResponse.json(pathArgs.toJSON());
      }
    }

    return await handle(req.auth, (identifier) => callback(identifier, pathArgs));
  });
}

export function getQueryHandler<Q extends z.SomeZodObject, R>(
  pathSchema: null,
  querySchema: Q,
  callback: (identifier: Identifier, path: null, query: z.infer<Q>) => Promise<R>
): AppRouteHandlerFn;
export function getQueryHandler<P extends z.SomeZodObject, Q extends z.SomeZodObject, R>(
  pathSchema: P,
  querySchema: Q,
  callback: (identifier: Identifier, path: z.infer<P>, query: z.infer<Q>) => Promise<R>
): AppRouteHandlerFn;
export function getQueryHandler<P extends z.SomeZodObject, Q extends z.SomeZodObject, R>(
  pathSchema: P | null,
  querySchema: Q,
  callback: (identifier: Identifier, path: z.infer<P> | null, query: z.infer<Q>) => Promise<R>
): AppRouteHandlerFn {

  return auth(async (req, { params }) => {

    let pathArgs: z.infer<P> | ZodSchemaFail | null = null;
    if (pathSchema) {
      pathArgs = parse(pathSchema, params);
      if (pathArgs instanceof ZodSchemaFail) {
        return NextResponse.json(pathArgs.toJSON());
      }
    }

    const searchParams = req.nextUrl.searchParams;
    const queryArgs = parseKeyValue(querySchema, searchParams.get);
    if (queryArgs instanceof ZodSchemaFail) {
      return NextResponse.json(queryArgs.toJSON());
    }

    return await handle(req.auth, (identifier) => callback(identifier, pathArgs, queryArgs));
  });
}

export function getBodyHandler<B extends z.SomeZodObject, R>(
  pathSchema: null,
  bodySchema: B,
  callback: (identifier: Identifier, path: null, body: z.infer<B>) => Promise<R>
): AppRouteHandlerFn;
export function getBodyHandler<P extends z.SomeZodObject, B extends z.SomeZodObject, R>(
  pathSchema: P,
  bodySchema: B,
  callback: (identifier: Identifier, path: z.infer<P>, body: z.infer<B>) => Promise<R>
): AppRouteHandlerFn;
export function getBodyHandler<P extends z.SomeZodObject, B extends z.SomeZodObject, R>(
  pathSchema: P | null,
  bodySchema: B,
  callback: (identifier: Identifier, path: z.infer<P> | null, body: z.infer<B>) => Promise<R>
): AppRouteHandlerFn {

  return auth(async (req, { params }) => {

    let pathArgs: z.infer<P> | ZodSchemaFail | null = null;
    if (pathSchema) {
      pathArgs = parse(pathSchema, params);
      if (pathArgs instanceof ZodSchemaFail) {
        return NextResponse.json(pathArgs.toJSON());
      }
    }

    const body = await req.json()
    const bodyArgs = parse(bodySchema, body);
    if (bodyArgs instanceof ZodSchemaFail) {
      return NextResponse.json(bodyArgs.toJSON());
    }

    return await handle(req.auth, (identifier) => callback(identifier, pathArgs, bodyArgs));
  });
}

// TODO 以下のようにでてしまうのでコメントアウト
// This overload signature is not compatible with its implementation signature.
// export function getFormHandler<F extends z.SomeZodObject, R>(
//   pathSchema: null, formSchema: F, fileName: null,
//   callback: (identifier: Identifier, path: null, form: z.infer<F>, file: null) => Promise<R>
// ): AppRouteHandlerFn;
// export function getFormHandler<R>(
//   pathSchema: null, formSchema: null, fileName: string,
//   callback: (identifier: Identifier, path: null, form: null, file: FileData) => Promise<R>
// ): AppRouteHandlerFn;
// export function getFormHandler<F extends z.SomeZodObject, R>(
//   pathSchema: null, formSchema: F, fileName: string,
//   callback: (identifier: Identifier, path: null, form: z.infer<F>, file: FileData) => Promise<R>
// ): AppRouteHandlerFn;
// export function getFormHandler<P extends z.SomeZodObject, F extends z.SomeZodObject, R>(
//   pathSchema: P, formSchema: F, fileName: null,
//   callback: (identifier: Identifier, path: z.infer<P>, form: z.infer<F>, file: null) => Promise<R>
// ): AppRouteHandlerFn;
// export function getFormHandler<P extends z.SomeZodObject, R>(
//   pathSchema: P, formSchema: null, fileName: string,
//   callback: (identifier: Identifier, path: z.infer<P>, form: null, file: FileData) => Promise<R>
// ): AppRouteHandlerFn;
// export function getFormHandler<P extends z.SomeZodObject, F extends z.SomeZodObject, R>(
//   pathSchema: P, formSchema: F, fileName: string,
//   callback: (identifier: Identifier, path: z.infer<P>, form: z.infer<F>, file: FileData) => Promise<R>
// ): AppRouteHandlerFn;
// TODO どうもfileNameが型引数を取らないので推論できないっぽい
export function getFormHandler<P extends z.SomeZodObject, F extends z.SomeZodObject, R>(
  pathSchema: P | null,
  formSchema: F | null,
  fileName: string | null,
  callback: (identifier: Identifier, path: z.infer<P> | null, form: z.infer<F> | null, file: FileData | null) => Promise<R>
): AppRouteHandlerFn {

  return auth(async (req, { params }) => {

    let pathArgs: z.infer<P> | ZodSchemaFail | null = null;
    if (pathSchema) {
      pathArgs = parse(pathSchema, params);
      if (pathArgs instanceof ZodSchemaFail) {
        return NextResponse.json(pathArgs.toJSON());
      }
    }

    const formData = await req.formData();

    let formArgs: z.infer<F> | ZodSchemaFail | ValueTypeFail | null = null;
    if (formSchema) {
      formArgs = parseKeyValue(formSchema, (key) => {
        const val = formData.get(key);
        if (val instanceof Blob) {
          return new ValueTypeFail(key, 'string', 'Blob', `${key}がファイルです`);
        } else {
          return val;
        }
      });
      if (
        formArgs instanceof ZodSchemaFail ||
        formArgs instanceof ValueTypeFail
      ) {
        return NextResponse.json(formArgs.toJSON());
      }
    }

    let fileData: FileData | null = null;
    if (fileName) {
      const file = formData.get(fileName);

      if (!file) {
        const formFileFail = new ValueTypeFail(fileName, 'File', 'string or Blob', `${fileName}はファイルではありません`);
        return NextResponse.json(formFileFail.toJSON());

      } else if (!(file instanceof File)) {
        const formFileFail = new ValueTypeFail(fileName, 'File', 'null', `${fileName}はファイルではありません`);
        return NextResponse.json(formFileFail.toJSON());
      }
      const localFile = getLocalFile();
      fileData = await localFile.saveTempFile(file);
    }

    return handle(req.auth, (identifier) => callback(identifier, pathArgs, formArgs, fileData));
  });
}
