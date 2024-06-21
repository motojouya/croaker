import { InvalidArgumentsError } from '@/lib/base/validation';

export type ValidateId = (value: number, name: string) => InvalidArgumentsError | number;
export const validateId: ValidateId = (value, name) => {
  if (!Number.isSafeInteger(value) || value < 1) {
    return new InvalidArgumentsError(name, value, `${name}は1以上の整数です`);
  }
  return value;
};
