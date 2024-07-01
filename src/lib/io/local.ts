export type Now = () => Date;
const now: Now = () => new Date();

export type Random = () => number;
const random: Random = () => Math.random();

export type Local = {
  now: Now;
  random: Random;
};

export type GetLocal = () => Local;
export const getLocal = () => ({ now, random });
