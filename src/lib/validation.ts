export class InvalidArgumentsError extends Error {
  constructor(
    readonly croaker_identifier: string,
    readonly property_name: string,
    readonly value: string,
    readonly message: string,
  ) {
    super();
  }
}

export class AuthorityError extends Error {
  constructor(
    readonly croaker_identifier: string,
    readonly authority: string,
    readonly message: string,
  ) {
    super();
  }
}
