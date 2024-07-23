import { Fail, isFailJSON } from "@/lib/base/fail";

export class FetchAccessFail extends Fail {
  constructor(
    readonly link: string,
    readonly message: string,
  ) {
    super("lib.io.linl.FetchAccessFail");
  }
}
export const isFetchAccessFail = isFailJSON(new FetchAccessFail("", ""));
