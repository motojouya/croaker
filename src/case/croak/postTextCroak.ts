import { getSession } from '@/lib/session';
import { getDatabase } from '@/lib/database/base';
import { Croak } from '@/database/query/croak';
import { read } from '@/database/query/base';
import { getLastCroak } from '@/database/query/getLastCroak';
import { createTextCroak } from '@/database/command/createTextCroak';
import { InvalidArgumentsError } from '@/lib/base/validation';
import { ContextFullFunction, setContext } from '@/lib/base/context';
import {
  CHARACTOR_COUNT_MAX,
  trimText,
  charCount,
  getLinks,
} from '@/domain/text';
import { getFetcher } from '@/lib/io/link';
import {
  AuthorityError,
  authorizeMutation,
  authorizePostCroak,
} from '@/domain/authorize';
import { getLocal } from '@/lib/io/local';

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
  db: () => getDatabase({ read, getLastCroak }, { createTextCroak }),
  session: getSession,
  fetcher: getFetcher,
  local: getLocal,
} as const;

export type PostCroak = ContextFullFunction<
  typeof postCroakContext,
  (text: string, thread?: number) => Promise<FunctionResult>
>;
export const postCroak: PostCroak = ({ session, db, local, fetcher }) => async (text, thread) => {

  const actor = session.getActor();

  const lines = trimText(text);

  const charactorCount = charCount(lines);
  if (charactorCount < 1 || CHARACTOR_COUNT_MAX < charactorCount) {
    return new InvalidArgumentsError('text', text, `textは1以上${CHARACTOR_COUNT_MAX}文字までです`);
  }

  if (thread && thread < 1) {
    return new InvalidArgumentsError('thread', thread, 'threadは1以上の整数です');
  }

  const authorizeMutationErr = authorizeMutation(actor);
  if (authorizeMutationErr) {
    return authorizeMutationErr;
  }

  const actorAuthority = await db.read('role', { role_name: actor.role_name });
  if (!actorAuthority) {
    throw new Error('user role is not assigned!');
  }

  const lastCroak = await db.getLastCroak(actor.croaker_identifier);
  const authorizePostCroakErr = authorizePostCroak(actor, actorAuthority, lastCroak, local.now(), !!thread);
  if (authorizePostCroakErr) {
    return authorizePostCroakErr;
  }

  const linkList = getLinks(lines);
  const ogps = await fetcher.fetchOgp(linkList);

  const createCroak = {
    user_id: actor.user_id,
    contents: lines.join('\n'),
    thread: thread,
  };
  const createLinks = ogps.map(ogp => ({
    url: ogp.url,
    type: ogp.type,
    title: ogp.title,
    image: ogp.image,
    summary: ogp.summary,
  }));

  const croak = await db.transact((trx) => trx.createTextCroak(createCroak, createLinks));

  const { croak_id, contents, thread, posted_date, links } = croak;
  const { croaker_identifier, croaker_name, } = actor;
  return {
    croak_id,
    contents,
    thread,
    posted_date,
    croaker_identifier,
    croaker_name,
    links,
  };
};

setContext(postCroak, postCroakContext);
