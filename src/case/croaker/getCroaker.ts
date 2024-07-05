import { getDatabase } from "@/database/base";
import { CroakerRecord } from "@/database/type/croak";
import { read } from "@/database/crud";
import { Croaker } from "@/database/query/croaker/croaker";
import { getCroaker as getCroakerDB } from "@/database/query/croaker/getCroaker";
import { ContextFullFunction, setContext } from "@/lib/base/context";
import { Identifier } from "@/domain/authorization/base";

export type FunctionResult = Croaker | null;

const getCroakerContext = {
  db: () => getDatabase({ getCroakerDB }, null),
} as const;

export type GetCroaker = ContextFullFunction<
  typeof getCroakerContext,
  (identifier: Identifier) => (croakerId: string) => Promise<FunctionResult>
>;
export const getCroaker: GetCroaker =
  ({ db }) =>
  (identifier) =>
  (croakerId) =>
    db.getCroakerDB(croakerId);

setContext(getCroaker, getCroakerContext);
