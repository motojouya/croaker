import { InvalidArgumentsFail } from "@/lib/base/validation";
import { Random } from "@/lib/io/local";

export type ValidateId = (value: number, name: string) => InvalidArgumentsFail | number;
export const validateId: ValidateId = (value, name) => {
  if (!Number.isSafeInteger(value) || value < 1) {
    return new InvalidArgumentsFail(name, String(value), `${name}は1以上の整数です`);
  }
  return value;
};

export type NullableId = (name: string, value?: number) => number | null | InvalidArgumentsFail;
export const nullableId: NullableId = (name, value) => {
  if (!value) {
    return null;
  }

  if (!Number.isSafeInteger(value) || value < 1) {
    return new InvalidArgumentsFail(name, String(value), `${name}は1以上の整数です`);
  }

  return value;
};

const ALPHABET_NUMBER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export type GetCroakerId = (random: Random) => string;
export const getCroakerId: GetCroakerId = (random) => {
  const head = ALPHABET[Math.floor(random() * ALPHABET.length)];

  const middle = Array.from(Array(3))
    .map(() => {
      const index = Math.floor(random() * ALPHABET_NUMBER.length);
      return ALPHABET_NUMBER[index];
    })
    .join("");

  const tail = ALPHABET[Math.floor(random() * ALPHABET.length)];

  return head + middle + tail;
};
