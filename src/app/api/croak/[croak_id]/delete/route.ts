import { FunctionResult, deleteCroak } from '@/case/croak/deleteCroak';
import { bindContext } from '@/lib/base/context';
import { FetchType, getRouteHandler, executeFetch } from '@/lib/next/routeHandler';

export type ResponseType = FunctionResult;

const pathSchema = {
  type: 'object',
  properties: {
    croak_id: { type: 'string' }
  },
  required: ['croak_id'],
} as const satisfies JSONSchema;

export const POST = getRouteHandler(
  pathSchema,
  (p, b) => bindContext(deleteCroak)(p.croak_id)
);

export type GetFetcher = (f: FetchType) => (thread: number) => Promise<ResponseType>;
export const getFetcher = (f) => async (thread) => {
  return executeFetch<ResponseType>(() => {
    return f(`/api/croak/${thread}/delete`, {
      method: 'POST',
    })
  });
};
