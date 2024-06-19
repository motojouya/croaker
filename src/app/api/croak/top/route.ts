import { FunctionResult, getTopCroaks } from '@/case/croak/getCroaks';
import { bindContext } from '@/lib/base/context';
import { FetchType, getQueryHandler, executeFetch } from '@/lib/next/routeHandler';

export type ResponseType = FunctionResult;

const querySchema = {
  type: 'object',
  properties: {
    reverse: { type: 'boolean' },
    offset_cursor: { type: 'number' },
  },
  required: [],
} as const satisfies JSONSchema;

export const GET = getQueryHandler(
  null,
  querySchema,
  (p, q) => bindContext(getTopCroaks)(q.reverse, q.offset_cursor)
);

export type FetchAPI = (reverse: boolean, offsetCursor?: number) => Promise<ResponseType>;
export const fetchAPI: FetchAPI = async (reverse, offsetCursor) => {
  const result = await executeFetch(() => {
    return fetch(`/api/croak/top?reverse=${reverse}&offset_cursor=${offsetCursor}`);
  });
  return result as ResponseType;
};
