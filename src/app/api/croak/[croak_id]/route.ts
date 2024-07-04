import { FunctionResult, getThreadCroaks } from '@/case/croak/getCroaks';
import { bindContext } from '@/lib/base/context';
import { FetchType, getQueryHandler, executeFetch } from '@/lib/next/routeHandler';
import { z } from 'zod';

export type ResponseType = FunctionResult;

const pathSchema = z.object({
  croak_id: z.coerce.number(),
});

const querySchema = z.object({
  reverse: z.coerce.boolean().nullable(),
  offset_cursor: z.coerce.number().nullable(),
});

export const GET = getQueryHandler(
  pathSchema,
  querySchema,
  (identifier, p, q) => bindContext(getThreadCroaks)(identifier)(
    p.croak_id,
    q.reverse || undefined,
    q.offset_cursor || undefined
  )
);

export type FetchAPI = (croak_id: string, reverse: boolean, offsetCursor?: number) => Promise<ResponseType>;
export const fetchAPI: FetchAPI = async (croak_id, reverse, offsetCursor) => {
  const result = await executeFetch(() => {
    return fetch(`/api/croak/${croak_id}?reverse=${reverse}&offset_cursor=${offsetCursor}`);
  });
  return result as ResponseType;
};
