import { FunctionResult, deleteCroak } from '@/case/croak/deleteCroak';
import { bindContext } from '@/lib/base/context';
import { FetchType, getRouteHandler, executeFetch } from '@/lib/next/routeHandler';
import type { JSONSchema } from "json-schema-to-ts";

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
  (p) => bindContext(deleteCroak)(p.croak_id)
);

export type FetchAPI = (thread: number) => Promise<ResponseType>;
export const fetchAPI: FetchAPI = async (thread) => {
  const result = await executeFetch(() => {
    return fetch(`/api/croak/${thread}/delete`, {
      method: 'POST',
    })
  });
  return result as ResponseType;
};
