import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { Session } from "next-auth";
import { z } from "zod";
import { auth } from "@/lib/next/nextAuthOptions";
import { parse, parseKeyValue, ZodSchemaFail, ValueTypeFail } from "@/lib/base/schema";
import { InvalidArgumentsFail } from "@/lib/base/validation";
import { ErrorJSON, FailJSON, ResultJson, Fail } from "@/lib/base/fail";
import type { Identifier } from "@/domain/authorization/base";
import { FileData, getLocalFile } from "@/lib/io/file";
import { getIdentifier } from "@/lib/next/utility";

const serverActionFailName = "lib.next.serverActions.ServerActionFail" as const;

async function handle<R>(
  session: Session | null,
  pathToRevalidate: string | null,
  redirectPath: string | null,
  callback: (identifier: Identifier) => Promise<R>,
): Promise<ResultJson<R> | ErrorJSON> {
  let succeededResult: ResultJson<R>;

  try {
    const identifier = getIdentifier(session);

    const result = await callback(identifier);

    if (result instanceof Fail) {
      return result.toJSON() as ResultJson<R>;
    }

    if (result instanceof Error) {
      return {
        name: serverActionFailName,
        message: result.message,
      };
    }

    succeededResult = result as ResultJson<R>;
  } catch (e) {
    console.log('server action handle e', e);
    if (e instanceof Error) {
      return {
        name: serverActionFailName,
        message: e.message,
      };
    } else {
      return {
        name: serverActionFailName,
        message: "something happened!",
      };
    }
  }

  if (pathToRevalidate) {
    revalidatePath(pathToRevalidate);
  }

  if (redirectPath) {
    redirect(redirectPath);
  }

  return succeededResult;
}

// FIXME overloadできる気がする
export type FormAction<T> = (
  formData: FormData,
) => Promise<ResultJson<T> | ErrorJSON | FailJSON<ZodSchemaFail> | FailJSON<ValueTypeFail>>;
export function getFormAction<F extends z.SomeZodObject, R>(
  formSchema: F | null,
  fileName: string | null,
  pathToRevalidate: string | null,
  redirectPath: string | null,
  callback: (identifier: Identifier, form: z.infer<F> | null, file: FileData | null) => Promise<R>,
): FormAction<R> {
  return async (formData) => {
    let formArgs: z.infer<F> | ZodSchemaFail | ValueTypeFail | null = null;
    if (formSchema) {
      formArgs = parseKeyValue(formSchema, (key) => {
        const val = formData.get(key);
        if (val instanceof Blob) {
          return new ValueTypeFail(key, "string", "Blob", `${key}がファイルです`);
        } else {
          return val;
        }
      });
      if (formArgs instanceof ZodSchemaFail || formArgs instanceof ValueTypeFail) {
        return formArgs.toJSON();
      }
    }

    let fileData: FileData | null = null;
    if (fileName) {
      const file = formData.get(fileName);

      if (!file) {
        const formFileFail = new ValueTypeFail(
          fileName,
          "File",
          "string or Blob",
          `${fileName}はファイルではありません`,
        );
        return formFileFail.toJSON();
      } else if (!(file instanceof File)) {
        const formFileFail = new ValueTypeFail(fileName, "File", "null", `${fileName}はファイルではありません`);
        return formFileFail.toJSON();
      }

      const localFile = getLocalFile();
      fileData = await localFile.saveTempFile(file);
    }

    return handle(await auth(), pathToRevalidate, redirectPath, (identifier) =>
      callback(identifier, formArgs, fileData),
    );
  };
}

function resolveRevalidatePath<T>(pathToRevalidate: RevalidatePathResolver<T> | string | null, arg: T): string | null {
  if (!pathToRevalidate) {
    return null;
  }

  if (typeof pathToRevalidate === "string") {
    return pathToRevalidate;
  }

  return pathToRevalidate(arg);
}

export type RevalidatePathResolver<A> = (args: A) => string;
export type ServerAction<A extends z.SomeZodObject, R> = (
  args: z.infer<A>,
) => Promise<ResultJson<R> | ErrorJSON | FailJSON<ZodSchemaFail>>;
export function getServerAction<A extends z.SomeZodObject, R>(
  argsSchema: A,
  pathToRevalidate: RevalidatePathResolver<z.infer<A>> | string | null,
  redirectPath: string | null,
  callback: (identifier: Identifier, args: z.infer<A>) => Promise<R>,
): ServerAction<A, R> {
  return async (args) => {
    const parsedArgs = parse(argsSchema, args);
    if (parsedArgs instanceof ZodSchemaFail) {
      return parsedArgs.toJSON();
    }

    // FIXME なぞ pathToRevalidateはsync functionのはずだが、asyncになってる
    let path = resolveRevalidatePath(pathToRevalidate, parsedArgs);
    if (path as any instanceof Promise) {
      path = await path;
    }

    return handle(await auth(), path, redirectPath, (identifier) =>
      callback(identifier, parsedArgs),
    );
  };
}
