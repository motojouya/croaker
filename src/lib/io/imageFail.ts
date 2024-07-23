import { Fail, isFailJSON } from "@/lib/base/fail";

export class ImageInformationFail extends Fail {
  constructor(
    readonly key: string,
    readonly value: string,
    readonly path: string,
    readonly message: string,
  ) {
    super("lib.image.ImageInformationFail");
  }
}
export const isImageInformationFail = isFailJSON(new ImageInformationFail("", "", "", ""));

export class ImageCommandFail extends Fail {
  constructor(
    readonly action: string,
    readonly path: string,
    readonly exception: Error,
    readonly message: string,
  ) {
    super("lib.image.ImageCommandFail");
  }
}
export const isImageCommandFail = isFailJSON(new ImageCommandFail("", "", new Error(), ""));
