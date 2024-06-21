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
  (identifier, p, q) => bindContext(getThreadCroaks)(identifier)(p.croak_id, q.reverse, q.offset_cursor)
);

export type FetchAPI = (croak_id: string, reverse: boolean, offsetCursor?: number) => Promise<ResponseType>;
export const fetchAPI: FetchAPI = async (croak_id, reverse, offsetCursor) => {
  const result = await executeFetch(() => {
    return fetch(`/api/croak/${croak_id}?reverse=${reverse}&offset_cursor=${offsetCursor}`);
  });
  return result as ResponseType;
};
