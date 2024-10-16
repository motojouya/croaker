import { getDatabase } from "@/database/base";
import { getLastCroak } from "@/database/query/croakSimple/getLastCroak";
import { createTextCroak, ReturnCroak } from "@/database/query/command/createTextCroak";
import { InvalidArgumentsFail } from "@/lib/base/validation";
import { ContextFullFunction, setContext } from "@/lib/base/context";
import { getLinks } from "@/domain/croak/croak";
import { getFetcher, Ogp, Fetcher } from "@/lib/io/link";
import { FetchAccessFail } from "@/lib/io/linkFail";
import { getLocal, Local } from "@/lib/io/local";
import { Identifier, AuthorityFail, authorizeCroaker } from "@/domain/authorization/base";
import { getCroakerUser } from "@/database/query/croaker/getCroakerUser";
import { Croaker } from "@/database/query/croaker/croaker";
import { AUTHORIZE_FORM_AGREEMENT } from "@/domain/authorization/validation/formAgreement";
import { AUTHORIZE_BANNED } from "@/domain/authorization/validation/banned";
import { getAuthorizePostCroak } from "@/domain/authorization/validation/postCroak";
import { trimContents } from "@/domain/croak/croak";
import { nullableId, nullableIdFP } from "@/domain/id";
import { Croak } from "@/domain/croak/croak";

import { pipe } from "fp-ts/function";
import * as E from "fp-ts/Either";
import * as TE from "fp-ts/TaskEither";

export type FunctionResult = Croak | AuthorityFail | FetchAccessFail | InvalidArgumentsFail;

const postCroakContext = {
  db: () => getDatabase({ getCroakerUser, getLastCroak }, { createTextCroak }),
  fetcher: getFetcher,
  local: getLocal,
} as const;

export type PostCroak = ContextFullFunction<
  typeof postCroakContext,
  (identifier: Identifier) => (text: string, thread?: number) => Promise<FunctionResult>
>;

type CroakData = {
  croaker_id: string;
  contents: string;
  thread?: number;
};
export const postCroak: PostCroak =
  ({ db, local, fetcher }) =>
  (identifier) =>
  (text, thread) =>
    pipe(
      TE.Do,
      TE.bindW("trimedContents", () => TE.fromEither(trimContents(text))),
      TE.bindW("nullableThread", () => TE.fromEither(nullableIdFP("thread", thread))),
      TE.bindW("croaker", ({ nullableThread }) => () => getCroaker(identifier, !!nullableThread, local, db)),
      TE.bindW("links", ({ trimedContents }) => () => getOgps(fetcher, trimedContents)),
      TE.bindW("croakData", ({ croaker, trimedContents, nullableThread }) => TE.right({
        croaker_id: croaker.croaker_id,
        contents: trimedContents,
        thread: nullableThread || undefined,
      })),
      TE.bindW("croak", ({ croakData, links }) => TE.rightTask(() => db.transact((trx) => trx.createTextCroak(croakData, links)))),
      TE.map(({ croak, croaker }) => ({
        ...croak,
        croaker_name: croaker.croaker_name,
        has_thread: false,
        files: [],
      })),
      TE.toUnion,
    )();

setContext(postCroak, postCroakContext);

type ReadableDB = {
  getCroakerUser: ReturnType<typeof getCroakerUser>;
  getLastCroak: ReturnType<typeof getLastCroak>;
};
type GetCroaker = (
  identifier: Identifier,
  isThread: boolean,
  local: Local,
  db: ReadableDB,
) => Promise<E.Either<AuthorityFail, Croaker>>;
const getCroaker: GetCroaker = async (identifier, isThread, local, db) => {
  const authorizePostCroak = getAuthorizePostCroak(
    isThread,
    async () => local.now(),
    async (croaker_id) => {
      const lastCroak = await db.getLastCroak(croaker_id);
      return lastCroak ? lastCroak.posted_date : null;
    },
  );

  const result = await authorizeCroaker(identifier, db.getCroakerUser, [
    AUTHORIZE_FORM_AGREEMENT,
    AUTHORIZE_BANNED,
    authorizePostCroak,
  ]);

  if (result instanceof AuthorityFail) {
    return E.left(result);
  } else {
    return E.right(result);
  }
};

type GetOgps = (fetcher: Fetcher, trimedContents: string) => Promise<E.Either<FetchAccessFail, Ogp[]>>;
const getOgps: GetOgps = async (fetcher, trimedContents) => {
  const links = getLinks(trimedContents);

  const requests = links.map((link) => fetcher.fetchOgp(link));

  const result = await Promise.allSettled(requests);

  if (result.filter((r) => r.status === "rejected").length > 0) {
    throw new Error("Promise shoud not return error");
  }

  // @ts-ignore
  const values = result.filter((r) => r.status === "fulfilled").map((r) => r.value);

  for (const val of values) {
    if (val instanceof FetchAccessFail) {
      return E.left(val); // FIXME とりあえず最初の1つだけ
    }
  }

  return E.right(values);
};
