import { InvalidArgumentsError } from '@/lib/base/validation';
import { Random } from '@/lib/io/local';

export type ValidateId = (value: number, name: string) => InvalidArgumentsError | number;
export const validateId: ValidateId = (value, name) => {
  if (!Number.isSafeInteger(value) || value < 1) {
    return new InvalidArgumentsError(name, value, `${name}は1以上の整数です`);
  }
  return value;
};

export type NullableId = (value?: number, name: string) => InvalidArgumentsError | number | null;
export const nullableId: NullableId = (value?, name) => {
  if (!value) {
    return null;
  }

  if (!Number.isSafeInteger(value) || value < 1) {
    return new InvalidArgumentsError(name, value, `${name}は1以上の整数です`);
  }

  return value;
};

const ALPHABET_NUMBER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export type GetCroakerId = (random: Random) => string;
export const getCroakerId: GetCroakerId = (random) => {

  const head = ALPHABET[Math.floor(random())];

  const middle = Array.from(Array(3)).map(() => {
    const index = Math.floor(random() * ALPHABET_NUMBER.length);
    return ALPHABET_NUMBER[index];
  }).join('');

  const tail = ALPHABET[Math.floor(random())];

  return head + middle + tail;
};
