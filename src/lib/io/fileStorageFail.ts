import { Fail, isFailJSON } from "@/lib/base/fail";

export class FileFail extends Fail {
  constructor(
    readonly action: string,
    readonly path: string,
    readonly exception: Error,
    readonly message: string,
  ) {
    super("lib.fileStorage.FileFail");
  }
}
export const isFileFail = isFailJSON(new FileFail("", "", new Error(), ""));
