import { InvalidArgumentsFail } from '@/lib/base/validation';
import { trimText, charCount } from '@/domain/text/text';

export const DESCRIPTION_COUNT_MAX = 1000;

export type TrimDescription = (description?: string) => string | InvalidArgumentsFail;
export const trimDescription: TrimDescription = (description) => {

  if (!description) {
    return '';
  }

  const lines = trimText(description);
  if (lines.length === 0) {
    return '';
  }

  const len = charCount(lines);
  if (DESCRIPTION_COUNT_MAX < len) {
    return new InvalidArgumentsFail('description', description, `説明は${DESCRIPTION_COUNT_MAX}以下です`);
  }

  return lines.join('\n');
};
