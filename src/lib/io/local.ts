type Now = () => Date;
const now: Now = () => new Date();

const ALPHABET_NUMBER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

type GetIdentifier = () => string;
const getIdentifier: GetIdentifier = () => {

  const head = ALPHABET[Math.floor(Math.random())];

  const middle = Array.from(Array(3)).map(() => {
    const index = Math.floor(Math.random() * ALPHABET_NUMBER.length);
    return ALPHABET_NUMBER[index];
  }).join('');

  const tail = ALPHABET[Math.floor(Math.random())];

  return head + middle + tail;
};

export type Local = {
  now: Now;
  getIdentifier: GetIdentifier,
};

export type GetLocal = () => Local;
export const getLocal = () => { now, getIdentifier };
