import { Fail, isFailJSON } from "@/lib/base/fail";

export class RecordAlreadyExistFail extends Fail {
  constructor(
    readonly table: string,
    readonly data: object,
    readonly message: string,
  ) {
    super("lib.db.RecordAlreadyExistFail");
  }
}
export const isRecordAlreadyExist = isFailJSON(new RecordAlreadyExistFail("", {}, ""));

export class RecordNotFoundFail extends Fail {
  constructor(
    readonly table: string,
    readonly keys: object,
    readonly message: string,
  ) {
    super("lib.db.RecordNotFoundFail");
  }
}
export const isRecordNotFound = isFailJSON(new RecordNotFoundFail("", {}, ""));

export class MutationFail extends Fail {
  constructor(
    readonly action: string,
    readonly table: string,
    readonly value: object,
    readonly message: string,
  ) {
    super("lib.db.MutationFail");
  }
}
export const isMutationFail = isFailJSON(new MutationFail("", "", {}, ""));
