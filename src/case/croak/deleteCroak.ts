import { getDatabase } from "@/database/base";
import { RecordNotFoundFail } from "@/database/fail";
import { CroakRecord } from "@/database/type/croak";
import { read, update, getSqlNow } from "@/database/crud";
import { ContextFullFunction, setContext } from "@/lib/base/context";
import { Identifier, AuthorityFail, authorizeCroaker } from "@/domain/authorization/base";
import { getCroakerUser } from "@/database/query/croaker/getCroakerUser";
import { AUTHORIZE_FORM_AGREEMENT } from "@/domain/authorization/validation/formAgreement";
import { AUTHORIZE_BANNED } from "@/domain/authorization/validation/banned";
import { getAuthorizeDeleteOtherPost } from "@/domain/authorization/validation/deleteOtherPost";

export type Croak = CroakRecord;

export type FunctionResult = Croak | AuthorityFail | RecordNotFoundFail;

const deleteCroakContext = {
  db: () => getDatabase({ getSqlNow }, { getCroakerUser, read, update }),
} as const;

export type DeleteCroak = ContextFullFunction<
  typeof deleteCroakContext,
  (identifier: Identifier) => (croakId: number) => Promise<FunctionResult>
>;
export const deleteCroak: DeleteCroak =
  ({ db }) =>
  (identifier) =>
  async (croakId) => {
    return await db.transact(async (trx) => {
      const croak = await getCroak(trx, croakId);
      if (croak instanceof RecordNotFoundFail) {
        return croak;
      }

      const croaker = await authorizeCroaker(identifier, trx.getCroakerUser, [
        AUTHORIZE_FORM_AGREEMENT,
        AUTHORIZE_BANNED,
        getAuthorizeDeleteOtherPost(croak.croaker_id),
      ]);
      if (croaker instanceof AuthorityFail) {
        return croaker;
      }

      // NOTE ファイル末尾参照
      // @ts-ignore
      const result = await trx.update("croak", { croak_id: croakId }, { deleted_date: db.getSqlNow() });
      if (result.length !== 1) {
        throw new Error("croak shoud be unique by croak_id");
      }

      return result[0];
    });
  };

setContext(deleteCroak, deleteCroakContext);

type ReadableDB = { read: ReturnType<typeof read> };
type GetCroak = (db: ReadableDB, croakId: number) => Promise<Croak | RecordNotFoundFail>;
const getCroak: GetCroak = async (db, croakId) => {
  const croaks = await db.read("croak", { croak_id: croakId });
  if (croaks.length !== 1 || !!croaks[0].deleted_date) {
    return new RecordNotFoundFail("croak", { croak_id: croakId }, "投稿がすでに存在しません");
  }

  return croaks[0];
};

// 以下の書き方はtypescript&kysely的には正しい。
// まんまを表現したいので、純粋にdb.getSqlNow()を渡して大丈夫なはず。
//
// import { Kysely } from 'kysely';
// import { Database } from '@/database/type';
// import { CroakRecord } from '@/database/type/croak'
//
// type UpdateCroakDate = (db: Kysely<Database>) => (croakId: number) => Promise<CroakRecord[]>;
// const updateCroakDate: UpdateCroakDate = (db) => async (croakId) => {
//   return db
//     .updateTable('croak')
//     .set({ deleted_date: db.fn('datetime', ['now', 'localtime']) })
//     .where((eb) => eb.and({ croak_id: croakId }))
//     .returningAll()
//     .execute();
// }
