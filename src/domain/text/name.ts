import { InvalidArgumentsFail } from '@/lib/base/validation';
import { trimText, charCount } from '@/domain/text/text';

export const NAME_COUNT_MAX = 40;

export type TrimName = (name?: string) => string | InvalidArgumentsFail;
export const trimName: TrimName = (name) => {

  if (!name) {
    return new InvalidArgumentsFail('name', '', '名前を入力してください');
  }

  const lines = trimText(name);
  if (lines.length !== 1) {
    return new InvalidArgumentsFail('name', name, '名前は改行できません');
  }

  const trimed = lines[0];

  if (!trimed) {
    return new InvalidArgumentsFail('name', name, '名前を入力してください');
  }

  const len = [...trimed].length;
  if (len < 1 || NAME_COUNT_MAX < len) {
    return new InvalidArgumentsFail('name', name, `名前は1文字以上${NAME_COUNT_MAX}以下です`);
  }

  return trimed;
};
