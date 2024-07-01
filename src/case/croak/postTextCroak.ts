import { getDatabase } from '@/database/base';
import { Croak } from '@/database/query/croak/croak';
import { getLastCroak } from '@/database/query/croakSimple/getLastCroak';
import { createTextCroak } from '@/database/query/command/createTextCroak';
import { InvalidArgumentsError } from '@/lib/base/validation';
import { ContextFullFunction, setContext } from '@/lib/base/context';
import {
  CHARACTOR_COUNT_MAX,
  trimText,
  charCount,
  getLinks,
} from '@/domain/text';
import { getFetcher, Ogp } from '@/lib/io/link';
import { getLocal } from '@/lib/io/local';
import { Identifier, AuthorityError, authorizeCroaker } from '@/authorization/base';
import { getCroakerUser } from '@/database/getCroakerUser';
import { AUTHORIZE_FORM_AGREEMENT } from '@/authorization/validation/formAgreement';
import { AUTHORIZE_BANNED } from '@/authorization/validation/banned';
import { getAuthorizePostCroak } from '@/authorization/validation/postCroak';
import { trimContents } from '@/domain/text/contents';
import { nullableId } from '@/domain/id';

// export type PostCroak = ContextFullFunction<
//   {
//     session: Session,
//     fetcher: Fetcher,
//     local: Local,
//     db: DB<
//       {
//         read: ReturnType<typeof read>,
//         getLastCroak: ReturnType<typeof getLastCroak>,
//       },
//       {
//         create: ReturnType<typeof create>
//       }
//     >,
//   },
//   (text: string, thread?: number) => Promise<
//     | Omit<Croak, 'has_thread' | 'files'>
//     | AuthorityError
//     | InvalidArgumentsError
//   >
// >;

export type FunctionResult =
    | Omit<Croak, 'has_thread' | 'files'>
    | AuthorityError
    | InvalidArgumentsError;

const postCroakContext = {
  db: () => getDatabase({ getCroakerUser, getLastCroak }, { createTextCroak }),
  fetcher: getFetcher,
  local: getLocal,
} as const;

export type PostCroak = ContextFullFunction<
  typeof postCroakContext,
  (identifier: Identifier) => (text: string, thread?: number) => Promise<FunctionResult>
>;
export const postCroak: PostCroak = ({ db, local, fetcher }) => (identifier) => async (text, thread) => {

  const trimedContents = trimContents(text);
  if (trimedContents instanceof InvalidArgumentsError) {
    return trimedContents;
  }

  const nullableThread = nullableId(thread, 'thread');
  if (nullableThread instanceof InvalidArgumentsError) {
    return nullableThread;
  }

  const croaker = await getCroaker(identifier, !!nullableThread, local, db);
  if (croaker instanceof AuthorityError) {
    return croaker;
  }

  const createCroak = {
    croaker_id: croaker.croaker_id,
    contents: trimedContents,
    thread: nullableThread,
  };

  const links = await getOgps(fetcher, trimedContents);

  const croak = await db.transact((trx) => trx.createTextCroak(createCroak, links));

  return {
    ...croak,
    croaker_name: croaker.name,
  };
};

setContext(postCroak, postCroakContext);

type ReadableDB = {
  getCroakerUser: ReturnType<typeof getCroakerUser>,
  getLastCroak: ReturnType<typeof getLastCroak>,
};
type GetCroaker = (identifier: Identifier, isThread: boolean, local: Local, db: ReadableDB) => Promise<Croaker | AuthorityError>;
const getCroaker: GetCroaker = async (identifier, isThread, local, db) => {

  const authorizePostCroak = getAuthorizePostCroak(
    isThread,
    local.now,
    async (croaker_id) => {
      const lastCroak = await db.getLastCroak(croaker_id);
      return lastCroak ? lastCroak.posted_date : null;
    },
  );

  return await authorizeCroaker(
    identifier,
    db.getCroakerUser,
    [AUTHORIZE_FORM_AGREEMENT, AUTHORIZE_BANNED, authorizePostCroak]
  );
};

type GetOgps = (fetcher: Fetcher, trimedContents: string) => Promise<Ogp[]>;
const getOgps: GetOgps = async (fetcher, trimedContents) => {

  const links = getLinks(trimedContents);

  const requests = links.map(link => fetcher.fetchOgp(link));

  return await Promise.allSettled(requests);
};
