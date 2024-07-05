import { getDatabase } from "@/database/base";
import { CroakerRecord, CROAKER_STATUS_ACTIVE } from "@/database/type/croak";
import { read, create } from "@/database/crud";
import { getCroakerUser } from "@/database/query/croaker/getCroakerUser";
import { ContextFullFunction, setContext } from "@/lib/base/context";
import { Local, getLocal } from "@/lib/io/local";
import { Identifier, AuthorityFail, justLoginUser } from "@/domain/authorization/base";
import { InvalidArgumentsFail } from "@/lib/base/validation";
import { getCroakerId as getCroakerIdRandom } from "@/domain/id";
import { CroakerEditableInput, trimCroakerEditableInput } from "@/domain/croaker/croaker";

export type FunctionResult = Omit<CroakerRecord, "user_id"> | InvalidArgumentsFail | AuthorityFail;

const createCroakerContext = {
  db: () => getDatabase(null, { read, create, getCroakerUser }),
  local: getLocal,
  f: () => ({ getCroakerIdRandom }),
} as const;

export type CreateCroaker = ContextFullFunction<
  typeof createCroakerContext,
  (identifier: Identifier) => (input: CroakerEditableInput, formAgreement?: boolean) => Promise<FunctionResult>
>;
export const createCroaker: CreateCroaker =
  ({ db, local, f }) =>
  (identifier) =>
  async (input, formAgreement) => {
    const trimmedInput = trimCroakerEditableInput(input);
    if (trimmedInput instanceof InvalidArgumentsFail) {
      return trimmedInput;
    }

    return db.transact(async (trx) => {
      const userId = await justLoginUser(identifier, trx.getCroakerUser);
      if (userId instanceof AuthorityFail || userId instanceof InvalidArgumentsFail) {
        return userId;
      }

      const defaultRoleId = await getDefaultRoleId(trx);

      const croakerId = await getCroakerId(trx, local, f);

      const croakers = await trx.create("croaker", [
        {
          user_id: userId,
          croaker_id: croakerId,
          name: trimmedInput.name,
          description: trimmedInput.description,
          status: CROAKER_STATUS_ACTIVE,
          role_id: defaultRoleId,
          form_agreement: !!formAgreement,
        },
      ]);
      if (croakers.length !== 1) {
        throw new Error("insert croaker shoud be only one!");
      }

      const { user_id, ...rest } = croakers[0];
      return rest;
    });
  };

type ReadableDB = { read: ReturnType<typeof read> };
type Func = { getCroakerIdRandom: typeof getCroakerIdRandom };

type GetDefaultRoleId = (db: ReadableDB) => Promise<number>;
const getDefaultRoleId: GetDefaultRoleId = async (db) => {
  const configurations = await db.read("configuration", {});
  if (configurations.length !== 1) {
    throw new Error("configuration should be single record!");
  }
  const configuration = configurations[0];

  return configuration.default_role_id;
};

type GetCroakerId = (db: ReadableDB, local: Local, f: Func) => Promise<string>;
const getCroakerId: GetCroakerId = async (db, local, f) => {
  let tryCount = 0;
  while (tryCount < 10) {
    const croakerId = f.getCroakerIdRandom(local.random);
    const croakers = await db.read("croaker", { croaker_id: croakerId });

    if (croakers.length === 0) {
      return croakerId;
    }
    tryCount++;
  }

  throw new Error("croaker identifier conflicted!");
};

setContext(createCroaker, createCroakerContext);
