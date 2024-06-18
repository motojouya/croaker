import { FunctionResult, banCroaker } from '@/case/croaker/banCroaker';
import { bindContext } from '@/lib/base/context';
import { FetchType, getRouteHandler, executeFetch } from '@/lib/next/routeHandler';

export type ResponseType = FunctionResult;

const pathSchema = {
  type: 'object',
  properties: {
    identifier: { type: 'string' }
  },
  required: ['identifier'],
} as const satisfies JSONSchema;

export const POST = getRouteHandler(
  pathSchema,
  (p) => bindContext(banCroaker)(p.identifier)
);

export type GetFetcher = (f: FetchType) => (identifier: string) => Promise<ResponseType>;
export const getFetcher = (f) => async (identifier) => {
  return executeFetch<ResponseType>(() => {
    return f(`/api/croaker/${identifier}/ban`, {
      method: 'POST',
    })
  });
};

