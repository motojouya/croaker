import { FunctionResult, searchCroaks } from '@/case/croak/getCroaks';
import { bindContext } from '@/lib/base/context';
import { FetchType, getQueryHandler, executeFetch } from '@/lib/next/routeHandler';
import { z } from 'zod';

export type ResponseType = FunctionResult;

const querySchema = z.object({
  text: z.string(),
  reverse: z.coerce.boolean().nullable(),
  offset_cursor: z.coerce.number().nullable(),
});

export const GET = getQueryHandler(
  null,
  querySchema,
  (identifier, p, q) => bindContext(searchCroaks)(identifier)(q.text, q.reverse, q.offset_cursor)
);

export type FetchAPI = (text: string, reverse: boolean, offsetCursor?: number) => Promise<ResponseType>;
export const fetchAPI: FetchAPI = async (text, reverse, offsetCursor) => {
  const result = await executeFetch(() => {
    return fetch(`/api/croak/search?text=${text}&reverse=${reverse}&offset_cursor=${offsetCursor}`);
  });
  return result as ResponseType;
};
