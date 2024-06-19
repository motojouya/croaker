import { HandleableError } from '@/lib/base/error';

export class InvalidArgumentsError extends HandleableError {
  override readonly name = 'lib.validation.InvalidArgumentsError' as const;
  constructor(
    readonly property_name: string,
    readonly value: string,
    readonly message: string,
  ) {
    super();
  }
}
