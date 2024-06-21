import { InvalidArgumentsError } from '@/lib/base/validation';
import { trimText, charCount } from '@/domain/text/text';

export const CONTENTS_COUNT_MAX = 140;

export type TrimContents = (contents?: string) => string | InvalidArgumentsError;
export const trimContents: TrimContents = (contents) => {

  if (!contents) {
    return new InvalidArgumentsError('contents', contents, '入力してください');
  }

  const lines = trimText(contents);
  if (lines.length === 0) {
    return new InvalidArgumentsError('contents', contents, '入力してください');
  }

  const len = charCount(lines);
  if (len < 1 || CONTENTS_COUNT_MAX < len) {
    return new InvalidArgumentsError('name', name, `1文字以上${CONTENTS_COUNT_MAX}以下です`);
  }

  return lines.join('\n');
};
