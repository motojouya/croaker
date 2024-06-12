export class InvalidArgumentsError extends Error {
  override readonly name = 'lib.validation.InvalidArgumentsError' as const;
  constructor(
    readonly croaker_identifier: string,
    readonly property_name: string,
    readonly value: string,
    readonly message: string,
  ) {
    super();
  }
}
