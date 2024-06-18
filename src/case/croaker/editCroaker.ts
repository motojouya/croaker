import { getSession } from '@/lib/session';
import { getDatabase, RecordNotFoundError } from '@/lib/database/base';
import { CroakerTable } from '@/database/type/croak';
import { read, update } from '@/database/crud';
import { InvalidArgumentsError } from '@/lib/base/validation';
import { ContextFullFunction, setContext } from '@/lib/base/context';
import {
  AuthorityError,
  authorizeBasically,
} from '@/lib/authorize';
import { getLocal } from '@/lib/local';

export type FunctionResult =
    | Omit<CroakerTable, 'user_id' | 'files'>
    | AuthorityError
    | InvalidArgumentsError
    | RecordNotFoundError;

const editCroakerContext = {
  db: () => getDatabase(null, { read, update }),
  session: getSession,
} as const;

export type EditCroaker = ContextFullFunction<
  typeof editCroakerContext,
  (name: string, description: string, formAgreement?: boolean) => Promise<FunctionResult>
>;
export const editCroaker: EditCroaker = ({ session, db }) => async (name, description, formAgreement) => {

  const actor = session.getActor();

  const basicErr = authorizeBasically(actor);
  if (basicErr) {
    return basicErr;
  }

  if (!name || [...name].length === 0) {
    return new InvalidArgumentsError('name', name, '名前を入力してください');
  }

  return db.transact((trx) => {

    const croakers = trx.read({ identifier: actor.identifier });
    if (croakers.length !== 1) {
      return new RecordNotFoundError('croaker', { identifier: actor.identifier }, '存在しないユーザです');
    }

    const croaker = trx.update({ identifier: actor.identifier }, {
      name: name,
      description: description,
      form_agreement: croakers[0].form_agreement || !!formAgreement,
      // TODO updated_date: now(), できればDBの自動更新にしたい
    });

    const { 'user_id', ...rest } = croaker;
    return rest;
  });
};

setContext(editCroaker, editCroakerContext);
