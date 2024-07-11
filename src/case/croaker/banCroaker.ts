import { getDatabase } from "@/database/base";
import { RecordNotFoundFail } from "@/database/fail";
import { CroakerRecord, CROAKER_STATUS_BANNED } from "@/database/type/croak";
import { read, update, getSqlNow } from "@/database/crud";
import { ContextFullFunction, setContext } from "@/lib/base/context";
import { Identifier, AuthorityFail, authorizeCroaker } from "@/domain/authorization/base";
import { getCroakerUser } from "@/database/query/croaker/getCroakerUser";
import { AUTHORIZE_FORM_AGREEMENT } from "@/domain/authorization/validation/formAgreement";
import { AUTHORIZE_BANNED } from "@/domain/authorization/validation/banned";
import { AUTHORIZE_BAN_POWER } from "@/domain/authorization/validation/banPower";

export type Croaker = Omit<CroakerRecord, "user_id">;

export type FunctionResult = Croaker | AuthorityFail | RecordNotFoundFail;

const banCroakerContext = {
  db: () => getDatabase({ getCroakerUser }, { read, update }),
} as const;

export type BanCroaker = ContextFullFunction<
  typeof banCroakerContext,
  (identifier: Identifier) => (croakerId: string) => Promise<FunctionResult>
>;
export const banCroaker: BanCroaker =
  ({ db }) =>
  (identifier) =>
  async (croakerId) => {
    const croakerActor = await authorizeCroaker(identifier, db.getCroakerUser, [
      AUTHORIZE_FORM_AGREEMENT,
      AUTHORIZE_BANNED,
      AUTHORIZE_BAN_POWER,
    ]);
    if (croakerActor instanceof AuthorityFail) {
      return croakerActor;
    }

    return await db.transact(async (trx) => {
      const croaker = await getCroaker(trx, croakerId);
      if (croaker instanceof RecordNotFoundFail) {
        return croaker;
      }

      const croakerUpdated = await trx.update("croaker", { croaker_id: croakerId }, { status: CROAKER_STATUS_BANNED });
      if (croakerUpdated.length !== 1) {
        throw new Error("update croaker should be only one!");
      }

      // @ts-ignore
      await trx.update("croak", { croaker_id: croakerId }, { deleted_date: getSqlNow() });

      const { user_id, ...rest } = croakerUpdated[0];
      return rest;
    });
  };

setContext(banCroaker, banCroakerContext);

type ReadableDB = { read: ReturnType<typeof read> };
type GetCroaker = (db: ReadableDB, croakerId: string) => Promise<CroakerRecord | RecordNotFoundFail>;
const getCroaker: GetCroaker = async (db, croakerId) => {
  const croakers = await db.read("croaker", { croaker_id: croakerId });
  if (croakers.length !== 1) {
    return new RecordNotFoundFail("croaker", { croaker_id: croakerId }, "存在しないユーザです");
  }

  const croaker = croakers[0];

  if (croaker.status === CROAKER_STATUS_BANNED) {
    return new RecordNotFoundFail("croaker", { croaker_id: croakerId }, "すでに停止されたユーザです");
  }

  return croaker;
};
