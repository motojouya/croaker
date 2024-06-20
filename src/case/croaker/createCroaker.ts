import { getDatabase } from '@/lib/database/base';
import { CroakerTable } from '@/database/type/croak';
import { RoleTable } from '@/database/type/master';
import { read, create } from '@/database/crud';
import { getCroakerUser } from '@/database/query/getCroakerUser';
import { ContextFullFunction, setContext } from '@/lib/base/context';
import { getLocal } from '@/lib/io/local';
import { Identifier, AuthorityError } from '@/domain/authorize';
import { InvalidArgumentsError } from '@/lib/base/validation';
import { trimName, trimDescription } from '@/domain/text';

export type FunctionResult = Omit<CroakerTable, 'user_id'> | InvalidArgumentsError;

const createCroakerContext = {
  db: () => getDatabase(null, { read, create, getCroakerUser }),
  local: getLocal,
} as const;

export type CreateCroaker = ContextFullFunction<
  typeof createCroakerContext,
  (identifier: Identifier) => (name: string, description: string, formAgreement?: boolean) => Promise<FunctionResult>
>;
export const createCroaker: CreateCroaker = ({ db, local }) => (identifier) => async (name, description, formAgreement) => {

  if (identifier.type === 'anonymous') {
    return new AuthorityError(null, 'login', 'ログインしてください');
  }

  return db.transact(async (trx) => {

    const croaker = await trx.getCroakerUser(identifier.user_id);
    if (croaker) {
      return new InvalidArgumentsError('croaker', croaker, 'すでに登録済みです');
    }

    const defaultRole = await getDefaultRole(trx);

    const trimedName = trimName(name);
    if (trimedName instanceof InvalidArgumentsError) {
      return trimedName;
    }

    const trimedDescription = trimDescription(description);
    if (trimedDescription instanceof InvalidArgumentsError) {
      return trimedDescription;
    }

    const croakId = await getCroakerId(trx, local);

    const croaker = await trx.create('croaker', {
      user_id: user_id,
      croak_id: croakId,
      name: trimedName,
      description: trimedDescription,
      status: CROAKER_STATUS_ACTIVE,
      role_id: defaultRole.id,
      form_agreement: !!formAgreement,
    });

    const { 'user_id', ...rest } = croaker;
    return rest;
  });
};

type ReadableDB = { read: ReturnType<typeof read> };

type GetDefaultRole = (db: ReadableDB) => Promise<RoleTable>
const getDefaultRole: GetDefaultRole = (db) => {

  const configurations = db.read('configuration', {});
  if (configurations.length !== 1) {
    throw new Error('configuration should be single record!');
  }
  const configuration = configuration[0];

  const roles = db.read('role', { role_id: configuration.default_role_id });
  if (roles.length !== 1) {
    throw new Error('default role should be single result!');
  }
  return role[0];
};

type GetCroakerId = (db: ReadableDB, local: Local) => Promise<string>
const getCroakerId: GetCroakerId = async (db, local) => {

  let tryCount = 0;
  while (tryCount < 10) {

    const croakerId = local.getIdentifier();
    const croakers = await db.read('croaker', { croaker_id: croakerId });

    if (croakers.length === 0) {
      return croakerId;
    }
    tryCount++;
  }

  throw new Error('croaker identifier conflicted!');
};

setContext(editCroaker, editCroakerContext);
