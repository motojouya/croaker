import { Fail, isFailJSON } from "@/lib/base/fail";

export class InvalidArgumentsFail extends Fail {
  constructor(
    public readonly property_name: string,
    public readonly value: string,
    public readonly message: string,
  ) {
    super("lib.validation.InvalidArgumentsFail");
  }
}
export const isInvalidArguments = isFailJSON(new InvalidArgumentsFail("", "", ""));
