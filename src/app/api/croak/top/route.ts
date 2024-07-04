import { FunctionResult, getTopCroaks } from '@/case/croak/getCroaks';
import { bindContext } from '@/lib/base/context';
import { FetchType, getQueryHandler, executeFetch } from '@/lib/next/routeHandler';
import { z } from 'zod';

export type ResponseType = FunctionResult;

const querySchema = z.object({
  reverse: z.coerce.boolean().nullable(),
  offset_cursor: z.coerce.number().nullable(),
});

export const GET = getQueryHandler(
  null,
  querySchema,
  (identifier, p, q) => bindContext(getTopCroaks)(identifier)(
    q.reverse || undefined,
    q.offset_cursor || undefined
  )
);

export type FetchAPI = (reverse: boolean, offsetCursor?: number) => Promise<ResponseType>;
export const fetchAPI: FetchAPI = async (reverse, offsetCursor) => {
  const result = await executeFetch(() => {
    return fetch(`/api/croak/top?reverse=${reverse}&offset_cursor=${offsetCursor}`);
  });
  return result as ResponseType;
};
