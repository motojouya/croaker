import { getDatabase } from '@/database/base';
import { RoleTable, ConfigurationTable } from '@/database/type/master';
import { read } from '@/database/crud';
import { ContextFullFunction, setContext } from '@/lib/base/context';

export type Master = {
  configuration: ConfigurationTable;
  roles: RoleTable[];
};
export type FunctionResult = Master;

const getMasterContext = {
  db: () => getDatabase({ read }, null),
} as const;

export type GetMaster = ContextFullFunction<
  typeof getMasterContext,
  () => Promise<FunctionResult>
>;
export const getMaster: GetMaster = ({ db }) => async () => {

  const configs = await db.read('configuration', {});
  if (configs.length !== 1) {
    throw new Error('configuration should be single record!');
  }
  const configuration = configs[0];

  const roles = await db.read('role', {});
  if (roles.length === 0) {
    throw new Error('no role records!');
  }

  return { configuration, roles };
};

setContext(getMaster, getMasterContext);
