import { FunctionResult, banCroaker } from '@/case/croaker/banCroaker';
import { bindContext } from '@/lib/base/context';
import { FetchType, getRouteHandler, executeFetch } from '@/lib/next/routeHandler';

export type ResponseType = FunctionResult;

const pathSchema = {
  type: 'object',
  properties: {
    croaker_id: { type: 'string' }
  },
  required: ['croaker_id'],
} as const satisfies JSONSchema;

export const POST = getRouteHandler(
  pathSchema,
  (identifier, p) => bindContext(banCroaker)(identifier)(p.croaker_id)
);

export type FetchAPI = (croaker_id: string) => Promise<ResponseType>;
export const fetchAPI: FetchAPI = async (croaker_id) => {
  const result = await executeFetch(() => {
    return fetch(`/api/croaker/${croaker_id}/ban`, {
      method: 'POST',
    })
  });
  return result as ResponseType;
};

