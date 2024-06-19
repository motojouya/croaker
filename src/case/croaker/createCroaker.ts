import { getDatabase } from '@/lib/database/base';
import { CroakerTable } from '@/database/type/croak';
import { read, create } from '@/database/crud';
import { ContextFullFunction, setContext } from '@/lib/base/context';
import { getLocal } from '@/lib/io/local';

export type FunctionResult = Omit<CroakerTable, 'user_id'>;

const createCroakerContext = {
  db: () => getDatabase({ read }, { read, create }),
  local: getLocal,
} as const;

export type CreateCroaker = ContextFullFunction<
  typeof createCroakerContext,
  (user_id: string, name: string) => Promise<FunctionResult>
>;
export const createCroaker: CreateCroaker = ({ db, local }) => async (user_id, name) => {

  const configurations = trx.read('configuration', {});
  if (configurations.length !== 1) {
    throw new Error('configuration should be single record!');
  }
  const configurations = configuration[0];

  const roles = trx.read('role', { role_id: configuration.default_role_id });
  if (roles.length !== 1) {
    throw new Error('default role should be single result!');
  }
  const defaultRole = role[0];

  return db.transact(async (trx) => {

    const croakers = await trx.read('croaker', { user_id: user_id });
    if (croakers.length === 1) {
      const { user_id, ...rest } = croakers[0];
      return rest;
    }

    const identifier = await getIdentifier(trx, local);

    const croaker = await trx.create('croaker', {
      user_id: user_id,
      identifier: identifier,
      name: name,
      description: '',
      status: CROAKER_STATUS_ACTIVE,
      role_id: defaultRole.id,
      form_agreement: false,
    });

    const { 'user_id', ...rest } = croaker;
    return rest;
  });
};

type ParamDB = DB<{ read: ReturnType<typeof read> }, {
  read: ReturnType<typeof read>;
  create: ReturnType<typeof create>;
}>;
type getIdentifier = (db: ParamDB, local: Local) => Promise<string>
const getIdentifier = async (db, local) => {

  let tryCount = 0;
  while (tryCount < 100) {

    const identifier = local.getIdentifier();
    const croakers = await db.read('croaker', { identifier: identifier });

    if (croakers.length === 0) {
      return identifier;
    }
    tryCount++;
  }

  throw new Error('croaker identifier conflicted!');
};

setContext(editCroaker, editCroakerContext);
