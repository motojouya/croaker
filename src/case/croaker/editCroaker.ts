import { getDatabase } from "@/database/base";
import { RecordNotFoundFail } from "@/database/fail";
import { CroakerRecord } from "@/database/type/croak";
import { read, update, getSqlNow } from "@/database/crud";
import { getCroakerUser } from "@/database/query/croaker/getCroakerUser";
import { InvalidArgumentsFail } from "@/lib/base/validation";
import { ContextFullFunction, setContext } from "@/lib/base/context";
import { getLocal } from "@/lib/io/local";
import { Identifier, AuthorityFail, authorizeCroaker } from "@/domain/authorization/base";
import { CroakerEditableInput, trimCroakerEditableInput } from "@/domain/croaker/croaker";

export type FunctionResult = Omit<CroakerRecord, "user_id"> | AuthorityFail | InvalidArgumentsFail | RecordNotFoundFail;

const editCroakerContext = {
  db: () => getDatabase(null, { getCroakerUser, read, update }),
} as const;

export type EditCroaker = ContextFullFunction<
  typeof editCroakerContext,
  (identifier: Identifier) => (input: CroakerEditableInput, formAgreement?: boolean) => Promise<FunctionResult>
>;
export const editCroaker: EditCroaker =
  ({ db }) =>
  (identifier) =>
  async (input, formAgreement) => {
    const trimmedInput = trimCroakerEditableInput(input);
    if (trimmedInput instanceof InvalidArgumentsFail) {
      return trimmedInput;
    }

    return await db.transact(async (trx) => {
      const croaker = await authorizeCroaker(identifier, trx.getCroakerUser);
      if (croaker instanceof AuthorityFail) {
        return croaker;
      }

      const croakerResult = await trx.update(
        "croaker",
        { croaker_id: croaker.croaker_id },
        {
          name: trimmedInput.name,
          description: trimmedInput.description,
          form_agreement: croaker.form_agreement || !!formAgreement,
          // @ts-ignore
          updated_date: getSqlNow(),
        },
      );
      if (croakerResult.length !== 1) {
        throw new Error("update croaker should be only one!");
      }

      const { user_id, ...rest } = croakerResult[0];
      return rest;
    });
  };

setContext(editCroaker, editCroakerContext);
