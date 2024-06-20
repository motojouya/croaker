import { getDatabase } from '@/database/base';
import { CroakerTable } from '@/database/type/croak';
import { read } from '@/database/crud';
import { getCroaker } from '@/database/getCroaker';
import { ContextFullFunction, setContext } from '@/lib/base/context';

export type Croaker = Omit<CroakerTable, 'user_id' | 'role_id'>;
export type FunctionResult = Croaker | null;

const getCroakerContext = {
  db: () => getDatabase({ read }, null),
} as const;

export type GetCroaker = ContextFullFunction<
  typeof getCroakerContext,
  (identifier: Identifier) => (croakerId: string) => Promise<FunctionResult>
>;
export const getCroaker: GetCroaker = ({ db }) => (identifier) => async (croakerId) => {
  const croaker = await db.getCroaker(croaker_id);
  if (!croaker) {
    return null;
  }
  return croaker;
};

setContext(getCroaker, getCroakerContext);
