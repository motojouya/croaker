import { getDatabase } from "@/database/base";
import { ConfigurationRecord } from "@/database/type/master";
import { read } from "@/database/crud";
import { ContextFullFunction, setContext } from "@/lib/base/context";
import { ClientCroaker, Identifier } from "@/domain/authorization/base";
import { getCroakerUser } from "@/database/query/croaker/getCroakerUser";

export type Master = {
  configuration: ConfigurationRecord;
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
    const configs = await db.read("configuration", {});
    if (configs.length !== 1) {
      throw new Error("configuration should be single record!");
    }
    const configuration = configs[0];

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
