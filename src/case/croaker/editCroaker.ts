import { getDatabase, RecordNotFoundError, sqlNow } from '@/lib/database/base';
import { CroakerTable } from '@/database/type/croak';
import { read, update } from '@/database/crud';
import { getCroakerUser } from '@/database/query/getCroakerUser';
import { InvalidArgumentsError } from '@/lib/base/validation';
import { ContextFullFunction, setContext } from '@/lib/base/context';
import { getLocal } from '@/lib/local';
import {
  Identifier,
  AuthorityError,
  authorizeCroaker,
} from '@/authorization/base';
import { trimName, trimDescription } from '@/domain/text';

export type FunctionResult =
    | Omit<CroakerTable, 'user_id'>
    | AuthorityError
    | InvalidArgumentsError
    | RecordNotFoundError;

const editCroakerContext = {
  db: () => getDatabase(null, { getCroakerUser, read, update }),
} as const;

export type EditCroaker = ContextFullFunction<
  typeof editCroakerContext,
  (identifier: Identifier) => (name: string, description: string, formAgreement?: boolean) => Promise<FunctionResult>
>;
export const editCroaker: EditCroaker = ({ db }) => (identifier) => async (name, description, formAgreement) => {

  const trimedName = trimName(name);
  if (trimedName instanceof InvalidArgumentsError) {
    return trimedName;
  }

  const trimedDescription = trimDescription(description);
  if (trimedDescription instanceof InvalidArgumentsError) {
    return trimedDescription;
  }

  return await db.transact(async (trx) => {

    const croaker = await authorizeCroaker(identifier, trx.getCroakerUser);
    if (croaker instanceof AuthorityError) {
      return croaker;
    }

    const croakerResult = await trx.update('croaker', { croaker_id: croaker.croaker_id }, {
      name: trimedName,
      description: trimedDescription,
      form_agreement: croaker.form_agreement || !!formAgreement,
      updated_date: sqlNow(), // trigger不要のはず
    });

    const { 'user_id', ...rest } = croakerResult;
    return rest;
  });
};

setContext(editCroaker, editCroakerContext);
