import { FunctionResult, searchCroaks } from '@/case/croak/getCroaks';
import { bindContext } from '@/lib/base/context';
import { FetchType, getQueryHandler, executeFetch } from '@/lib/next/routeHandler';

export type ResponseType = FunctionResult;

const querySchema = {
  type: 'object',
  properties: {
    text: { type: 'string' },
    reverse: { type: 'boolean' },
    offset_cursor: { type: 'number' },
  },
  required: ['text'],
} as const satisfies JSONSchema;

export const GET = getQueryHandler(
  null,
  querySchema,
  (p, q) => bindContext(searchCroaks)(q.text, q.reverse, q.offset_cursor)
);

export type GetFetcher = (f: FetchType) => (text: string, reverse: boolean, offsetCursor?: number) => Promise<ResponseType>;
export const getFetcher = (f) => async (text, reverse, offsetCursor) => {
  return executeFetch<ResponseType>(() => {
    return f(`/api/croak/search?text=${text}&reverse=${reverse}&offset_cursor=${offsetCursor}`);
  });
};
