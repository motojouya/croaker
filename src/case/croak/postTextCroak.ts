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
import { nullableId } from "@/domain/id";
import { Croak } from "@/domain/croak/croak";

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
export const postCroak: PostCroak =
  ({ db, local, fetcher }) =>
  (identifier) =>
  async (text, thread) => {
    const trimedContents = trimContents(text);
    if (trimedContents instanceof InvalidArgumentsFail) {
      return trimedContents;
    }

    const nullableThread = nullableId("thread", thread);
    if (nullableThread instanceof InvalidArgumentsFail) {
      return nullableThread;
    }

    const croaker = await getCroaker(identifier, !!nullableThread, local, db);
    if (croaker instanceof AuthorityFail) {
      return croaker;
    }

    const createCroak = {
      croaker_id: croaker.croaker_id,
      contents: trimedContents,
      thread: nullableThread || undefined,
    };

    const links = await getOgps(fetcher, trimedContents);
    if (links instanceof FetchAccessFail) {
      return links;
    }

    const croak = await db.transact((trx) => trx.createTextCroak(createCroak, links));

    return {
      ...croak,
      croaker_name: croaker.croaker_name,
      has_thread: false,
      files: [],
    };
  };

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
) => Promise<Croaker | AuthorityFail>;
const getCroaker: GetCroaker = async (identifier, isThread, local, db) => {
  const authorizePostCroak = getAuthorizePostCroak(
    isThread,
    async () => local.now(),
    async (croaker_id) => {
      const lastCroak = await db.getLastCroak(croaker_id);
      return lastCroak ? lastCroak.posted_date : null;
    },
  );

  return await authorizeCroaker(identifier, db.getCroakerUser, [
    AUTHORIZE_FORM_AGREEMENT,
    AUTHORIZE_BANNED,
    authorizePostCroak,
  ]);
};

type GetOgps = (fetcher: Fetcher, trimedContents: string) => Promise<Ogp[] | FetchAccessFail>;
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
      return val; // FIXME とりあえず最初の1つだけ
    }
  }

  return values;
};
