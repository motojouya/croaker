import { getDatabase } from '@/lib/database/base';
import { CroakerTable } from '@/database/type/croak';
import { RoleTable } from '@/database/type/master';
import { read, create } from '@/database/crud';
import { getCroakerUser } from '@/database/query/getCroakerUser';
import { ContextFullFunction, setContext } from '@/lib/base/context';
import { getLocal } from '@/lib/io/local';
import { Identifier, AuthorityError, justLoginUser } from '@/domain/authorize';
import { InvalidArgumentsError } from '@/lib/base/validation';
import { getCroakerId as getCroakerIdRandom } from '@/domain/id';
import { trimName } from '@/domain/text/name';
import { trimDescription } from '@/domain/text/description';

export type FunctionResult = Omit<CroakerTable, 'user_id'> | InvalidArgumentsError;

const createCroakerContext = {
  db: () => getDatabase({ read, getCroakerUser }, { read, create }),
  local: getLocal,
  f: () => ({ getCroakerIdRandom }),
} as const;

export type CreateCroaker = ContextFullFunction<
  typeof createCroakerContext,
  (identifier: Identifier) => (name: string, description: string, formAgreement?: boolean) => Promise<FunctionResult>
>;
export const createCroaker: CreateCroaker = ({ db, local, f }) => (identifier) => async (name, description, formAgreement) => {

  // TODO name,descriptionは一つの型にまとめる。croakerEditablePropsみたいな感じかな
  const trimedName = trimName(name);
  if (trimedName instanceof InvalidArgumentsError) {
    return trimedName;
  }

  const trimedDescription = trimDescription(description);
  if (trimedDescription instanceof InvalidArgumentsError) {
    return trimedDescription;
  }

  return db.transact(async (trx) => {

    const userId = await justLoginUser(identifier, trx.getCroakerUser);
    if (
      userId instanceof AuthorityError ||
      userId instanceof InvalidArgumentsError
    ) {
      return userId;
    }

    const defaultRoleId = await getDefaultRoleId(trx);

    const croakerId = await getCroakerId(trx, local, f);

    const croaker = await trx.create('croaker', {
      user_id: userId,
      croaker_id: croakerId,
      name: trimedName,
      description: trimedDescription,
      status: CROAKER_STATUS_ACTIVE,
      role_id: defaultRoleId,
      form_agreement: !!formAgreement,
    });

    const { user_id, ...rest } = croaker;
    return rest;
  });
};

type ReadableDB = { read: ReturnType<typeof read> };
type Func = { getCroakerIdRandom: typeof getCroakerIdRandom };

type GetDefaultRoleId = (db: ReadableDB) => Promise<number>
const getDefaultRoleId: GetDefaultRoleId = (db) => {

  const configurations = db.read('configuration', {});
  if (configurations.length !== 1) {
    throw new Error('configuration should be single record!');
  }
  const configuration = configuration[0];

  return configuration.default_role_id;
};

type GetCroakerId = (db: ReadableDB, local: Local, f: Func) => Promise<string>
const getCroakerId: GetCroakerId = async (db, local, f) => {

  let tryCount = 0;
  while (tryCount < 10) {

    const croakerId = f.getCroakerIdRandom(local.random);
    const croakers = await db.read('croaker', { croaker_id: croakerId });

    if (croakers.length === 0) {
      return croakerId;
    }
    tryCount++;
  }

  throw new Error('croaker identifier conflicted!');
};

setContext(editCroaker, editCroakerContext);
