import { getDatabase } from '@/database/base';
import { CroakerTable } from '@/database/type/croak';
import { read } from '@/database/crud';
import { ContextFullFunction, setContext } from '@/lib/base/context';

export type Croaker = Omit<CroakerTable, 'user_id'>;
export type FunctionResult = Croaker | null;

const getCroakerContext = {
  db: () => getDatabase({ read }, null),
} as const;

export type GetCroaker = ContextFullFunction<
  typeof getCroakerContext,
  (croaker_identifier: string) => Promise<FunctionResult>
>;
export const getCroaker: GetCroaker = ({ db }) => async (croaker_identifier) => {

  const croaker = await db.read('croaker', { identifier: croaker_identifier });
  if (croaker.length !== 1 || croaker[0].deleted_date !== null) {
    return null;
  }

  const { user_id, ...rest } = croaker[0];
  return { ...rest };
};

setContext(getCroaker, getCroakerContext);
