type Now = () => Date;
const now: Now = () => new Date();

export type Local = {
  now: Now;
};

export type GetLocal = () => Local;
export const getLocal = () => { now };
