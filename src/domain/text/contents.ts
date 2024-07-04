import { InvalidArgumentsFail } from '@/lib/base/validation';
import { trimText, charCount } from '@/domain/text/text';

export const CONTENTS_COUNT_MAX = 140;

export type TrimContents = (contents?: string) => string | InvalidArgumentsFail;
export const trimContents: TrimContents = (contents) => {

  if (!contents) {
    return new InvalidArgumentsFail('contents', '', '入力してください');
  }

  const lines = trimText(contents);
  if (lines.length === 0) {
    return new InvalidArgumentsFail('contents', contents, '入力してください');
  }

  const len = charCount(lines);
  if (len < 1 || CONTENTS_COUNT_MAX < len) {
    return new InvalidArgumentsFail('contents', contents, `1文字以上${CONTENTS_COUNT_MAX}以下です`);
  }

  return lines.join('\n');
};
