import { FunctionResult, getThreadCroaks } from '@/case/croak/getCroaks';
import { bindContext } from '@/lib/base/context';
import { FetchType, getQueryHandler, executeFetch } from '@/lib/next/routeHandler';

export type ResponseType = FunctionResult;

const pathSchema = {
  type: 'object',
  properties: {
    croak_id: { type: 'string' }
  },
  required: ['croak_id'],
} as const satisfies JSONSchema;

const querySchema = {
  type: 'object',
  properties: {
    reverse: { type: 'boolean' },
    offset_cursor: { type: 'number' },
  },
  required: [],
} as const satisfies JSONSchema;

export const GET = getQueryHandler(
  pathSchema,
  querySchema,
  (p, q) => bindContext(getThreadCroaks)(p.croak_id, q.reverse, q.offset_cursor)
);

export type GetFetcher = (f: FetchType) => (croak_id: string, reverse: boolean, offsetCursor?: number) => Promise<ResponseType>;
export const getFetcher = (f) => async (croak_id, reverse, offsetCursor) => {
  return executeFetch<ResponseType>(() => {
    return f(`/api/croak/${croak_id}?reverse=${reverse}&offset_cursor=${offsetCursor}`);
  });
};
