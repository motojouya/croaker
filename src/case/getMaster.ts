import { getDatabase } from "@/database/base";
import { Configuration } from "@/database/query/master/master";
import { read } from "@/database/crud";
import { ContextFullFunction, setContext } from "@/lib/base/context";
import { ClientCroaker, Identifier } from "@/domain/authorization/base";
import { getCroakerUser } from "@/database/query/croaker/getCroakerUser";

export type Master = {
  configuration: Configuration;
  croaker: ClientCroaker;
};
export type FunctionResult = Master;

const getMasterContext = {
  db: () => getDatabase({ read, getCroakerUser }, null),
} as const;

export type GetMaster = ContextFullFunction<
  typeof getMasterContext,
  (identifier: Identifier) => () => Promise<FunctionResult>
>;
export const getMaster: GetMaster =
  ({ db }) =>
  (identifier) =>
  async () => {
    const configuration = await getConfiguration(db);

    if (identifier.type === "anonymous") {
      return {
        configuration,
        croaker: { type: "anonymous" },
      };
    }

    const croaker = await db.getCroakerUser(identifier.user_id);
    if (!croaker) {
      return {
        configuration,
        croaker: { type: "logined" },
      };
    }

    return {
      configuration,
      croaker: {
        type: "registered",
        value: croaker,
      },
    };
  };

setContext(getMaster, getMasterContext);

type ReadableDB = { read: ReturnType<typeof read> };
type GetConfiguration = (db: ReadableDB) => Promise<Configuration>;
const getConfiguration: GetConfiguration = async (db) => {
  const configs = await db.read("configuration", {});
  if (configs.length !== 1) {
    throw new Error("configuration should be single record!");
  }
  return {
    ...configs[0],
    active: !!configs[0].active,
    account_create_available: !!configs[0].account_create_available,
  };
};
